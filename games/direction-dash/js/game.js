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
      var params    = new URLSearchParams(window.location.search);
      this._diffKey = params.get('difficulty') || 'ezpz';
      if (!DD.CONFIG.DIFFICULTIES[this._diffKey]) this._diffKey = 'ezpz';
      this._bindPermanentUI();
      if (params.get('difficulty')) {
        this._setupGame();
      } else {
        this._openMenu();
      }
    }

    _openMenu() {
      this._timer && this._timer.stop();
      this._timer = null;
      this._input && this._input.deactivate();
      DD.Renderer.hideResult();
      DD.Renderer.hideCountdown();
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
      var labels = { ezpz: 'EZPZ', whatever: 'WHATEVER', master: 'MASTER' };
      var store = {};
      try {
        var raw = localStorage.getItem(DD.CONFIG.LS_KEY);
        store = raw ? JSON.parse(raw) : {};
      } catch(e) { store = {}; }
      return Object.keys(labels)
        .map(function (key) { return { key: key, label: labels[key], score: store[key] ? store[key].score : null }; })
        .sort(function (a, b) { return ((b.score !== null ? b.score : -1)) - (a.score !== null ? a.score : -1); });
    }

    _setupGame() {
      this._timer && this._timer.stop();
      this._input && this._input.destroy();
      this._inputLocked = false;

      this._state = new DD.GameState();
      this._state.setup(this._diffKey);

      var gameAreaEl = document.getElementById('js-game-area');
      var dpadEl     = document.getElementById('js-dpad');
      this._input = new DD.InputManager(gameAreaEl, dpadEl, (dir) => this._handlePlayerInput(dir));
      var defaultMode = DD.isMobile() ? DD.CONFIG.MODES.BUTTONS : DD.CONFIG.MODES.KEYBOARD;
      this._input.setMode(defaultMode);
      this._input.deactivate();

      var totalCells = this._state.totalCells;
      var difficulty = this._state.difficulty;
      DD.Renderer.buildGrid(difficulty.gridSize, totalCells);
      DD.Renderer.setDiffLabel(difficulty.label);
      DD.Renderer.updateTimer(difficulty.timeLimit, 1);
      DD.Renderer.updateStats(0, totalCells, 0);
      DD.Renderer.hideResult();

      this._state.setPhase('countdown');
      DD.Renderer.startGlitch();
      this._runCountdown(0);
    }

    _runCountdown(stepIndex) {
      var seq = DD.CONFIG.COUNTDOWN_SEQ;
      if (stepIndex >= seq.length) return;
      var isFinalStep = stepIndex === seq.length - 1;
      if (isFinalStep) DD.Renderer.freezeGrid(this._state.grid);
      DD.Renderer.showCountdownStep(seq[stepIndex], () => {
        if (isFinalStep) {
          this._goAfterFreeze();
        } else {
          this._runCountdown(stepIndex + 1);
        }
      });
    }

    _goAfterFreeze() {
      setTimeout(() => { DD.Renderer.showGoFlash(() => this._startPlaying()); }, DD.CONFIG.PRE_GO_PAUSE_MS);
    }

    _startPlaying() {
      this._state.setPhase('playing');
      DD.Renderer.setActiveCell(0);
      DD.Renderer.updateStats(0, this._state.totalCells, 0);
      this._input.activate();
      this._startTimer();
    }

    _startTimer() {
      var timeLimit = this._state.difficulty.timeLimit;
      this._timer = new DD.Timer({
        totalSeconds: timeLimit,
        onTick:   (remaining, fraction) => DD.Renderer.updateTimer(remaining, fraction),
        onExpire: () => this._handleTimeOut(),
      });
      this._timer.start();
    }

    _handlePlayerInput(direction) {
      if (this._state.phase !== 'playing' || this._inputLocked) return;
      DD.Renderer.flashKey(direction, direction === this._state.expectedDir ? 'correct' : 'wrong');
      if (direction === this._state.expectedDir) {
        this._onCorrectInput();
      } else {
        this._onWrongInput(direction);
      }
    }

    _onCorrectInput() {
      var idx = this._state.currentIndex;
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
      this._state.registerWrong();
      DD.Renderer.updateStats(this._state.currentIndex, this._state.totalCells, this._state.wrongCount);
      this._timer && this._timer.penalize(DD.CONFIG.PENALTY_SEC);
      setTimeout(() => { this._inputLocked = false; }, DD.CONFIG.INPUT_LOCK_MS);
    }

    _handleWin() {
      if (this._state.phase !== 'playing') return;
      this._state.setPhase('win');
      this._timer && this._timer.stop();
      this._input.deactivate();
      var remaining = this._timer ? this._timer.remaining : 0;
      var score = this._calcScore(remaining, this._state.wrongCount);
      var isHighScore = this._saveHighScore(score);
      DD.Renderer.showResult(true, {
        completed: this._state.totalCells,
        total: this._state.totalCells,
        errors: this._state.wrongCount,
        timeRemaining: remaining,
        score: score,
        isHighScore: isHighScore,
      }, this._loadRanking());
    }

    _handleTimeOut() {
      if (this._state.phase !== 'playing') return;
      this._state.setPhase('lose');
      this._input.deactivate();
      DD.Renderer.showResult(false, {
        completed: this._state.currentIndex,
        total: this._state.totalCells,
        errors: this._state.wrongCount,
        timeRemaining: 0,
        score: 0,
        isHighScore: false,
      }, this._loadRanking());
    }

    _calcScore(timeRemaining, errors) {
      if (timeRemaining <= 0) return 0;
      var accuracy = errors === 0 ? 1.5 : 1 / (1 + errors * 0.25);
      return Math.max(0, Math.round(timeRemaining * 100 * accuracy));
    }

    _saveHighScore(score) {
      try {
        var raw   = localStorage.getItem(DD.CONFIG.LS_KEY);
        var store = raw ? JSON.parse(raw) : {};
        var prev  = store[this._diffKey] ? store[this._diffKey].score : -1;
        if (score > prev) {
          store[this._diffKey] = { score: score, date: new Date().toISOString() };
          localStorage.setItem(DD.CONFIG.LS_KEY, JSON.stringify(store));
          return true;
        }
        return false;
      } catch(e) { return false; }
    }

    _bindPermanentUI() {
      var self = this;
      document.getElementById('js-btn-restart')?.addEventListener('click',  function() { self._setupGame(); });
      document.getElementById('js-btn-mainmenu')?.addEventListener('click', function() { self._openMenu(); });
      document.getElementById('js-btn-start')?.addEventListener('click',    function() { self._startFromMenu(); });
      document.getElementById('js-mode-toggle')?.addEventListener('click',  function() { self._input && self._input.toggleSwipe(); });
      DD.Renderer.bindMenuDiffCards(function(diffKey) { self._selectDiff(diffKey); });
    }
  }

  function boot() {
    var game = new DirectionDashGame();
    game.init();
    window.__ddGame = game;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

}(window.DD = window.DD || {}));
