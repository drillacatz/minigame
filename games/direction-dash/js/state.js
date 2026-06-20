/* =====================================================================
   js/state.js  —  Direction Dash game state
   Pure data; no DOM access. Depends on: config.js
   ===================================================================== */

(function (DD) {
  'use strict';

  class GameState {
    constructor() {
      this._phase        = 'idle';  // idle | countdown | playing | win | lose
      this._diffKey      = null;
      this._difficulty   = null;
      this._grid         = [];      // flat array of direction strings
      this._gridSize     = 0;
      this._totalCells   = 0;
      this._currentIndex = 0;
      this._wrongCount   = 0;
      this._correctCount = 0;
    }

    /* ── Setup ───────────────────────────────────────────────── */

    /**
     * Initialise state for the given difficulty key.
     * Throws if key is not found in CONFIG.
     */
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

      // Reset counters
      this._currentIndex = 0;
      this._wrongCount   = 0;
      this._correctCount = 0;
      this._phase        = 'idle';
    }

    /** Generate a fresh random grid. Can be called again to re-randomise. */
    _generateGrid() {
      const dirs = DD.CONFIG.DIRS;
      this._grid = Array.from(
        { length: this._totalCells },
        () => dirs[Math.floor(Math.random() * dirs.length)]
      );
    }

    /* ── Phase management ────────────────────────────────────── */

    setPhase(phase) { this._phase = phase; }

    /* ── Input handlers ──────────────────────────────────────── */

    /** Call when the player inputs the correct direction. */
    registerCorrect() {
      this._correctCount++;
      this._currentIndex++;
    }

    /** Call when the player inputs a wrong direction. */
    registerWrong() {
      this._wrongCount++;
    }

    /* ── Derived / read-only ─────────────────────────────────── */

    get phase()        { return this._phase; }
    get diffKey()      { return this._diffKey; }
    get difficulty()   { return this._difficulty; }
    get grid()         { return this._grid; }
    get gridSize()     { return this._gridSize; }
    get totalCells()   { return this._totalCells; }
    get currentIndex() { return this._currentIndex; }
    get wrongCount()   { return this._wrongCount; }
    get correctCount() { return this._correctCount; }

    /** Direction the player must currently input. */
    get expectedDir() { return this._grid[this._currentIndex]; }

    /** True when all cells have been correctly answered. */
    get isComplete()   { return this._currentIndex >= this._totalCells; }
  }

  DD.GameState = GameState;

}(window.DD = window.DD || {}));
