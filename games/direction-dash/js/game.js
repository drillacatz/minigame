/* =====================================================================
   js/game.js  —  Direction Dash main controller
   Flow: [paused menu: pick difficulty + view ranking] → START GAME →
         countdown (READY → 3 → 2 → 1, grid visible & glitching the whole
         time) → arrows freeze on "1" → GO! → play
   ===================================================================== */

(function (DD) {
  'use strict';

  class DirectionDashGame {
    constructor() {
      this._state       = null;
      this._timer       = null;
      this._input       = null;
      this._inputLocked = false;
      this._diffKey     = 'ezpz';
    }

    init() {
      DD.Renderer.init();
      const params  = new URLSearchParams(window.location.search);
      this._diffKey = params.get('difficulty') || 'ezpz';
      if (!DD.CONFIG.DIFFICULTIES[this._diffKey]) this._diffKey = 'ezpz';
      this._bindPermanentUI();
      this._openMenu();
    }

    /* ================================================================
       Paused start menu — difficulty select + ranking + START GAME.
       Shown on first load, and again via "MAIN MENU" after a round.
       ================================================================ */
    _openMenu() {
      this._timer?.stop();
      this._timer = null;
      this._input?.deactivate();
      DD.Renderer.hideResult();
      DD.Renderer.setMenuSelection(this._diffKey);
      DD.Renderer.renderRanking(this._loadRanking());
      DD.Renderer.showMenu();
    }

    _selectDiff(diffKey) {
      if (!DD.CONFIG.DIFFICULTIES[diffKey]) return;
      this._diffKey = diffKey;
      DD.Renderer.setMenuSelection(diffKey);
    }

    _startFromMenu() {
      DD.Renderer.hideMenu();
      this._setupGame();
    }

    _loadRanking() {
      const labels = { ezpz: 'EZPZ', whatever: 'WHATEVER', master: 'MASTER' };
      let store = {};
      try {
        const raw = localStorage.getItem(DD.CONFIG.LS_KEY);
        store = raw ? JSON.parse(raw) : {};
      } catch { store = {}; }
      return Object.keys(labels)
        .map((key) => ({ key, label: labels[key], score: store[key]?.score ?? null }))
        .sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    }

    _setupGame() {
      this._timer?.stop();
      this._input?.destroy();
      this._inputLocked = false;

      this._state = new DD.GameState();
      this._state.setup(this._diffKey);

      const gameAreaEl = document.getElementById('js-game-area');
      const dpadEl     = document.getElementById('js-dpad');
      this._input = new DD.InputManager(gameAreaEl, dpadEl, (dir) => this._handlePlayerInput(dir));
      const defaultMode = DD.isMobile() ? DD.CONFIG.MODES.BUTTONS : DD.CONFIG.MODES.KEYBOARD;
      this._input.setMode(defaultMode);
      this._input.deactivate();

      const { difficulty, totalCells } = this._state;
      DD.Renderer.buildGrid(difficulty.gridSize, totalCells);
      DD.Renderer.setDiffLabel(difficulty.label);
      DD.Renderer.updateTimer(difficulty.timeLimit, 1);
      DD.Renderer.updateStats(0, totalCells, 0);
      DD.Renderer.hideResult();

      this._state.setPhase('countdown');
      DD.Renderer.startGlitch();   // grid is visible now; arrows glitch as a "loading" animation
      this._runCountdown(0);
    }

    /* ================================================================
       Countdown:  READY → 3 → 2 → 1
       The grid is visible (and glitching) for the whole countdown.
       The instant "1" appears, every arrow freezes to its real value.
       ================================================================ */
    _runCountdown(stepIndex) {
      const seq = DD.CONFIG.COUNTDOWN_SEQ;  // ['READY','3','2','1']

      if (stepIndex < seq.length) {
        const isFinalStep = stepIndex === seq.length - 1;  // the "1" step

        if (isFinalStep) {
          // Freeze the glitching arrows into their real, final values right now.
          DD.Renderer.freezeGrid(this._state.grid);
        }

        DD.Renderer.showCountdownStep(seq[stepIndex], () => {
          if (isFinalStep) {
            this._goAfterFreeze();
          } else {
            this._runCountdown(stepIndex + 1);
          }
        });
      }
    }

    _goAfterFreeze() {
      // Short pause so the player can register the now-locked grid, then GO!
      setTimeout(() => {
        DD.Renderer.showGoFlash(() => this._startPlaying());
      }, DD.CONFIG.PRE_GO_PAUSE_MS);
    }

    _startPlaying() {
      this._state.setPhase('playing');
      DD.Renderer.setActiveCell(0);
      DD.Renderer.updateStats(0, this._state.totalCells, 0);
      this._input.activate();
      this._startTimer();
    }

    _startTimer() {
      const timeLimit = this._state.difficulty.timeLimit;
      this._timer = new DD.Timer({
        totalSeconds: timeLimit,
        onTick:   (remaining, fraction) => DD.Renderer.updateTimer(remaining, fraction),
        onExpire: () => this._handleTimeOut(),
      });
      this._timer.start();
    }

    /* ================================================================
       Input
       ================================================================ */
    _handlePlayerInput(direction) {
      if (this._state.phase !== 'playing' || this._inputLocked) return;
      if (direction === this._state.expectedDir) {
        this._onCorrectInput();
      } else {
        this._onWrongInput(direction);
      }
    }

    _onCorrectInput() {
      const idx = this._state.currentIndex;
      MiniverseAudio.playSfx('correct');
      DD.Renderer.flashCell(idx, 'correct');
      this._state.registerCorrect();
      DD.Renderer.updateStats(this._state.currentIndex, this._state.totalCells, this._state.wrongCount);
      setTimeout(() => {
        DD.Renderer.markCellDone(idx);
        if (this._state.isComplete) {
          this._handleWin();
        } else {
          DD.Renderer.setActiveCell(this._state.currentIndex);
        }
      }, DD.CONFIG.CORRECT_DELAY_MS);
    }

    _onWrongInput(direction) {
      this._inputLocked = true;
      MiniverseAudio.playSfx('wrong');
      DD.Renderer.flashCell(this._state.currentIndex, 'wrong');
      DD.Renderer.flashKey(direction);
      this._state.registerWrong();
      DD.Renderer.updateStats(this._state.currentIndex, this._state.totalCells, this._state.wrongCount);
      this._timer?.penalize(DD.CONFIG.PENALTY_SEC);
      setTimeout(() => { this._inputLocked = false; }, DD.CONFIG.INPUT_LOCK_MS);
    }

    /* ================================================================
       Win / Lose
       ================================================================ */
    _handleWin() {
      if (this._state.phase !== 'playing') return;
      this._state.setPhase('win');
      this._timer?.stop();
      this._input.deactivate();
      const remaining = this._timer?.remaining ?? 0;
      const score = this._calcScore(remaining, this._state.wrongCount);
      DD.Renderer.showResult(true, {
        completed: this._state.totalCells, total: this._state.totalCells,
        errors: this._state.wrongCount, timeRemaining: remaining,
        score, isHighScore: this._saveHighScore(score),
      });
    }

    _handleTimeOut() {
      if (this._state.phase !== 'playing') return;
      this._state.setPhase('lose');
      this._input.deactivate();
      DD.Renderer.showResult(false, {
        completed: this._state.currentIndex, total: this._state.totalCells,
        errors: this._state.wrongCount, timeRemaining: 0, score: 0, isHighScore: false,
      });
    }

    _calcScore(timeRemaining, errors) {
      if (timeRemaining <= 0) return 0;
      const accuracy = errors === 0 ? 1.5 : 1 / (1 + errors * 0.25);
      return Math.max(0, Math.round(timeRemaining * 100 * accuracy));
    }

    _saveHighScore(score) {
      try {
        const raw   = localStorage.getItem(DD.CONFIG.LS_KEY);
        const store = raw ? JSON.parse(raw) : {};
        if (score > (store[this._diffKey]?.score ?? -1)) {
          store[this._diffKey] = { score, date: new Date().toISOString() };
          localStorage.setItem(DD.CONFIG.LS_KEY, JSON.stringify(store));
          return true;
        }
        return false;
      } catch { return false; }
    }

    _bindPermanentUI() {
      document.getElementById('js-btn-restart')?.addEventListener('click', () => this._setupGame());
      document.getElementById('js-btn-mainmenu')?.addEventListener('click', () => this._openMenu());
      document.getElementById('js-btn-start')?.addEventListener('click', () => this._startFromMenu());
      document.getElementById('js-mode-toggle')?.addEventListener('click', () => this._input?.toggleSwipe());
      DD.Renderer.bindMenuDiffCards((diffKey) => this._selectDiff(diffKey));
    }
  }

  function boot() {
    const game = new DirectionDashGame();
    game.init();
    window.__ddGame = game;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

}(window.DD = window.DD || {}));
