/* =====================================================================
   js/game.js  —  Direction Dash main controller
   Bootstraps from URL params, drives the game loop.
   Depends on: config.js, state.js, renderer.js, timer.js, input.js
   ===================================================================== */

(function (DD) {
  'use strict';

  class DirectionDashGame {
    constructor() {
      this._state        = null;
      this._timer        = null;
      this._input        = null;
      this._inputLocked  = false;  // brief lock after wrong input
      this._diffKey      = 'ezpz'; // read from URL on init
    }

    /* ================================================================
       Boot — called once when page loads
       ================================================================ */
    init() {
      DD.Renderer.init();

      // Read difficulty from URL: game.html?difficulty=master
      const params   = new URLSearchParams(window.location.search);
      this._diffKey  = params.get('difficulty') || 'ezpz';
      if (!DD.CONFIG.DIFFICULTIES[this._diffKey]) {
        console.warn(`[DD] Unknown difficulty "${this._diffKey}", defaulting to ezpz.`);
        this._diffKey = 'ezpz';
      }

      // Wire permanent UI buttons (only do this once; restart re-uses them)
      this._bindPermanentUI();

      // Start the first game
      this._setupGame();
    }

    /* ================================================================
       Setup (also called by restart)
       ================================================================ */
    _setupGame() {
      // Tear down any running game
      this._timer?.stop();
      this._input?.destroy();
      this._inputLocked = false;

      // Fresh state
      this._state = new DD.GameState();
      this._state.setup(this._diffKey);

      // Input manager
      const gameAreaEl = document.getElementById('js-game-area');
      const dpadEl     = document.getElementById('js-dpad');
      this._input      = new DD.InputManager(
        gameAreaEl, dpadEl,
        (dir) => this._handlePlayerInput(dir)
      );
      const defaultMode = DD.isMobile()
        ? DD.CONFIG.MODES.BUTTONS
        : DD.CONFIG.MODES.KEYBOARD;
      this._input.setMode(defaultMode);
      this._input.deactivate();

      // Render initial UI
      const { difficulty, totalCells } = this._state;
      DD.Renderer.buildGrid(difficulty.gridSize, totalCells);
      DD.Renderer.setDiffLabel(difficulty.label);
      DD.Renderer.updateTimer(difficulty.timeLimit, 1);
      DD.Renderer.updateStats(0, totalCells, 0);
      DD.Renderer.hideResult();

      // Begin countdown
      this._state.setPhase('countdown');
      this._runCountdown(0);
    }

    /* ================================================================
       Countdown sequence
       ================================================================ */
    _runCountdown(stepIndex) {
      const seq = DD.CONFIG.COUNTDOWN_SEQ;
      if (stepIndex >= seq.length) {
        DD.Renderer.hideCountdown();
        this._beginGame();
        return;
      }
      DD.Renderer.showCountdownStep(seq[stepIndex], () => {
        this._runCountdown(stepIndex + 1);
      });
    }

    /* ================================================================
       Game start
       ================================================================ */
    _beginGame() {
      // Reveal grid cells with stagger, then start timer
      DD.Renderer.revealAll(this._state.grid, () => {
        // onDone callback fires after all reveals + animation settle
        this._state.setPhase('playing');
        DD.Renderer.setActiveCell(0);
        DD.Renderer.updateStats(0, this._state.totalCells, 0);
        this._input.activate();
        this._startTimer();
      });
    }

    /* ================================================================
       Timer
       ================================================================ */
    _startTimer() {
      const timeLimit = this._state.difficulty.timeLimit;

      this._timer = new DD.Timer({
        totalSeconds: timeLimit,
        onTick: (remaining, fraction) => {
          DD.Renderer.updateTimer(remaining, fraction);
        },
        onExpire: () => {
          this._handleTimeOut();
        },
      });
      this._timer.start();
    }

    /* ================================================================
       Input handler — called by InputManager on every player action
       ================================================================ */
    _handlePlayerInput(direction) {
      // Guard: only accept input while actively playing and not locked
      if (this._state.phase !== 'playing' || this._inputLocked) return;

      const expected = this._state.expectedDir;

      if (direction === expected) {
        this._onCorrectInput();
      } else {
        this._onWrongInput(direction);
      }
    }

    _onCorrectInput() {
      const idx = this._state.currentIndex;

      // Immediate visual feedback
      DD.Renderer.flashCell(idx, 'correct');

      // Register in state
      this._state.registerCorrect();
      DD.Renderer.updateStats(
        this._state.currentIndex,
        this._state.totalCells,
        this._state.wrongCount
      );

      // After flash animation, mark done and advance
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
      const idx = this._state.currentIndex;

      // Lock briefly so player can't spam wrong keys
      this._inputLocked = true;

      // Visual feedback
      DD.Renderer.flashCell(idx, 'wrong');
      DD.Renderer.flashKey(direction);      // light up the wrong WASD key if visible

      // Update state
      this._state.registerWrong();
      DD.Renderer.updateStats(
        this._state.currentIndex,
        this._state.totalCells,
        this._state.wrongCount
      );

      // Penalise timer — may trigger onExpire
      this._timer?.penalize(DD.CONFIG.PENALTY_SEC);

      // Release lock
      setTimeout(() => { this._inputLocked = false; }, DD.CONFIG.INPUT_LOCK_MS);
    }

    /* ================================================================
       Win condition
       ================================================================ */
    _handleWin() {
      if (this._state.phase !== 'playing') return;
      this._state.setPhase('win');
      this._timer?.stop();
      this._input.deactivate();

      const remaining = this._timer?.remaining ?? 0;
      const score     = this._calcScore(remaining, this._state.wrongCount);
      const isHS      = this._saveHighScore(score);

      DD.Renderer.showResult(true, {
        completed:     this._state.totalCells,
        total:         this._state.totalCells,
        errors:        this._state.wrongCount,
        timeRemaining: remaining,
        score,
        isHighScore:   isHS,
      });
    }

    /* ================================================================
       Lose (time out)
       ================================================================ */
    _handleTimeOut() {
      if (this._state.phase !== 'playing') return;
      this._state.setPhase('lose');
      this._input.deactivate();

      DD.Renderer.showResult(false, {
        completed:     this._state.currentIndex,
        total:         this._state.totalCells,
        errors:        this._state.wrongCount,
        timeRemaining: 0,
        score:         0,
        isHighScore:   false,
      });
    }

    /* ================================================================
       Scoring
       ================================================================ */
    _calcScore(timeRemaining, errors) {
      if (timeRemaining <= 0) return 0;
      // Base: time × 100; accuracy multiplier decays with errors
      const accuracy = errors === 0 ? 1.5 : 1 / (1 + errors * 0.25);
      return Math.max(0, Math.round(timeRemaining * 100 * accuracy));
    }

    /* ================================================================
       High score (localStorage)
       ================================================================ */
    _saveHighScore(score) {
      try {
        const raw     = localStorage.getItem(DD.CONFIG.LS_KEY);
        const store   = raw ? JSON.parse(raw) : {};
        const prevBest = store[this._diffKey]?.score ?? -1;

        if (score > prevBest) {
          store[this._diffKey] = { score, date: new Date().toISOString() };
          localStorage.setItem(DD.CONFIG.LS_KEY, JSON.stringify(store));
          return true;  // new high score
        }
        return false;
      } catch (e) {
        // localStorage unavailable (private mode, etc.) — not critical
        return false;
      }
    }

    /* ================================================================
       Permanent UI bindings — wired once, survive restart
       ================================================================ */
    _bindPermanentUI() {
      // Restart button inside result overlay
      document.getElementById('js-btn-restart')
        ?.addEventListener('click', () => this._restart());

      // Mode-toggle button in HUD
      document.getElementById('js-mode-toggle')
        ?.addEventListener('click', () => this._input?.toggleSwipe());
    }

    /* ================================================================
       Restart — reset state and re-run setup without reloading the page
       ================================================================ */
    _restart() {
      this._setupGame();
    }
  }

  /* ── Bootstrap on DOM ready ──────────────────────────────────── */
  function boot() {
    const game = new DirectionDashGame();
    game.init();
    // Expose on window for debugging / dev tools inspection
    window.__ddGame = game;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

}(window.DD = window.DD || {}));
