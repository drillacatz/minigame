/* =====================================================================
   js/config.js  —  Direction Dash configuration constants
   ===================================================================== */

(function (DD) {
  'use strict';

  DD.CONFIG = Object.freeze({

    DIFFICULTIES: Object.freeze({
      ezpz: Object.freeze({
        key: 'ezpz', label: 'EZPZ', modeLine: 'Easy Mode',
        gridSize: 3, timeLimit: 9, color: '#00d4ff',
      }),
      whatever: Object.freeze({
        key: 'whatever', label: 'WHATEVER', modeLine: 'Standard Mode',
        gridSize: 4, timeLimit: 9, color: '#9d4eff',
      }),
      master: Object.freeze({
        key: 'master', label: 'MASTER', modeLine: 'Hard Mode',
        gridSize: 5, timeLimit: 9, color: '#ff2d8b',
      }),
    }),

    DIRS: Object.freeze(['up', 'down', 'left', 'right']),

    /* ── Emoji direction symbols ─────────────────────────────── */
    DIR_SYMBOLS: Object.freeze({
      up:    '⬆️',
      down:  '⬇️',
      left:  '⬅️',
      right: '➡️',
    }),

    KEY_MAP: Object.freeze({
      w: 'up', arrowup: 'up',
      s: 'down', arrowdown: 'down',
      a: 'left', arrowleft: 'left',
      d: 'right', arrowright: 'right',
    }),

    PENALTY_SEC:      1,
    INPUT_LOCK_MS:    160,
    CORRECT_DELAY_MS: 110,

    /* ── Countdown — GO! is triggered separately after grid reveal */
    COUNTDOWN_SEQ:     Object.freeze(['READY', '3', '2', '1']),
    COUNTDOWN_STEP_MS: 700,
    /* How often (ms) each cell's arrow randomly changes while "loading" during countdown */
    GLITCH_INTERVAL_MS: 90,
    /* Pause (ms) after the grid freezes before showing GO! */
    PRE_GO_PAUSE_MS:   500,
    /* How long GO! is shown before game starts */
    GO_SHOW_MS:        600,

    MODES: Object.freeze({ KEYBOARD: 'keyboard', BUTTONS: 'buttons', SWIPE: 'swipe' }),

    SWIPE_THRESHOLD_PX: 40,
    TIMER_MID_FRAC: 0.55,
    TIMER_LOW_FRAC: 0.30,
    LS_KEY: 'miniverse_dd_scores_v1',
  });

}(window.DD = window.DD || {}));
