/* =====================================================================
   js/config.js  —  Direction Dash configuration constants
   All values live here; change once, applies everywhere.
   ===================================================================== */

(function (DD) {
  'use strict';

  DD.CONFIG = Object.freeze({

    /* ── Difficulty definitions ──────────────────────────────── */
    DIFFICULTIES: Object.freeze({
      ezpz: Object.freeze({
        key:       'ezpz',
        label:     'EZPZ',
        modeLine:  'Easy Mode',
        gridSize:  3,
        timeLimit: 9,
        color:     '#00d4ff',
      }),
      whatever: Object.freeze({
        key:       'whatever',
        label:     'WHATEVER',
        modeLine:  'Standard Mode',
        gridSize:  4,
        timeLimit: 9,
        color:     '#9d4eff',
      }),
      master: Object.freeze({
        key:       'master',
        label:     'MASTER',
        modeLine:  'Hard Mode',
        gridSize:  5,
        timeLimit: 9,
        color:     '#ff2d8b',
      }),
    }),

    /* ── Directions ──────────────────────────────────────────── */
    DIRS: Object.freeze(['up', 'down', 'left', 'right']),

    DIR_SYMBOLS: Object.freeze({
      up:    '↑',
      down:  '↓',
      left:  '←',
      right: '→',
    }),

    /** Maps KeyboardEvent.key (lowercased) → direction string */
    KEY_MAP: Object.freeze({
      w:          'up',
      arrowup:    'up',
      s:          'down',
      arrowdown:  'down',
      a:          'left',
      arrowleft:  'left',
      d:          'right',
      arrowright: 'right',
    }),

    /* ── Gameplay ────────────────────────────────────────────── */
    PENALTY_SEC:       1,          // seconds deducted per wrong input
    INPUT_LOCK_MS:     160,        // brief lock after wrong to prevent spam
    CORRECT_DELAY_MS:  110,        // ms before advancing to next cell (lets flash animate)

    /* ── Countdown ───────────────────────────────────────────── */
    COUNTDOWN_SEQ:      Object.freeze(['READY', '3', '2', '1', 'GO!']),
    COUNTDOWN_STEP_MS:  700,       // duration each step is shown (must match CSS)

    /* ── Input modes ─────────────────────────────────────────── */
    MODES: Object.freeze({
      KEYBOARD: 'keyboard',
      BUTTONS:  'buttons',
      SWIPE:    'swipe',
    }),

    /* ── Swipe ───────────────────────────────────────────────── */
    SWIPE_THRESHOLD_PX: 40,        // minimum drag distance to register a swipe

    /* ── Timer colour thresholds (fraction of total time) ────── */
    TIMER_MID_FRAC: 0.55,          // below this → yellow
    TIMER_LOW_FRAC: 0.30,          // below this → red + pulse

    /* ── localStorage ───────────────────────────────────────── */
    LS_KEY: 'miniverse_dd_scores_v1',
  });

}(window.DD = window.DD || {}));
