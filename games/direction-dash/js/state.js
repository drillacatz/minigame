(function (DD) {
  'use strict';

  class GameState {
    constructor() {
      this._phase        = 'idle';
      this._diffKey      = null;
      this._difficulty   = null;
      this._grid         = [];
      this._gridSize     = 0;
      this._totalCells   = 0;
      this._currentIndex = 0;
      this._wrongCount   = 0;
      this._correctCount = 0;
    }

    setup(diffKey) {
      const diff = DD.CONFIG.DIFFICULTIES[diffKey];
      if (!diff) {
        throw new Error(`[Direction Dash] Unknown difficulty key: "${diffKey}"`);
      }
      this._diffKey    = diffKey;
      this._difficulty = diff;
      this._gridSize   = diff.gridSize;
      this._totalCells = diff.gridSize * diff.gridSize;
      this._generateGrid();

      this._currentIndex = 0;
      this._wrongCount   = 0;
      this._correctCount = 0;
      this._phase        = 'idle';
    }

    _generateGrid() {
      const dirs = DD.CONFIG.DIRS;
      this._grid = Array.from(
        { length: this._totalCells },
        () => dirs[Math.floor(Math.random() * dirs.length)]
      );
    }

    setPhase(phase) { this._phase = phase; }

    registerCorrect() {
      this._correctCount++;
      this._currentIndex++;
    }

    registerWrong() {
      this._wrongCount++;
    }

    get phase()        { return this._phase; }
    get diffKey()      { return this._diffKey; }
    get difficulty()   { return this._difficulty; }
    get grid()         { return this._grid; }
    get gridSize()     { return this._gridSize; }
    get totalCells()   { return this._totalCells; }
    get currentIndex() { return this._currentIndex; }
    get wrongCount()   { return this._wrongCount; }
    get correctCount() { return this._correctCount; }

    get expectedDir() { return this._grid[this._currentIndex]; }

    get isComplete()   { return this._currentIndex >= this._totalCells; }
  }

  DD.GameState = GameState;

}(window.DD = window.DD || {}));
