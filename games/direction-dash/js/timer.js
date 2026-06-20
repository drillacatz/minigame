/* =====================================================================
   js/timer.js  —  requestAnimationFrame countdown timer
   No DOM access; calls onTick / onExpire callbacks.
   Depends on: config.js
   ===================================================================== */

(function (DD) {
  'use strict';

  class Timer {
    /**
     * @param {object} opts
     * @param {number}   opts.totalSeconds   Initial time budget
     * @param {function} opts.onTick         Called every RAF frame: (remaining, fraction)
     * @param {function} opts.onExpire       Called once when remaining hits 0
     */
    constructor({ totalSeconds, onTick, onExpire }) {
      this._total       = totalSeconds;
      this._onTick      = onTick    || (() => {});
      this._onExpire    = onExpire  || (() => {});

      this._startedAt   = null;     // performance.now() at start
      this._penaltyAcc  = 0;        // accumulated penalty seconds
      this._rafId       = null;
      this._stopped     = false;
      this._expired     = false;
    }

    /* ── Public ──────────────────────────────────────────────── */

    start() {
      if (this._startedAt !== null) return;  // prevent double-start
      this._startedAt = performance.now();
      this._stopped   = false;
      this._expired   = false;
      this._tick();
    }

    stop() {
      this._stopped = true;
      if (this._rafId !== null) {
        cancelAnimationFrame(this._rafId);
        this._rafId = null;
      }
    }

    /**
     * Deduct seconds from the remaining time.
     * If this causes expiry, triggers onExpire immediately.
     * @param {number} seconds
     */
    penalize(seconds) {
      this._penaltyAcc += seconds;
      const remaining = this._computeRemaining();
      if (remaining <= 0 && !this._expired) {
        this._triggerExpiry();
      }
    }

    /** Current remaining time in seconds (read-only snapshot). */
    get remaining() {
      return this._computeRemaining();
    }

    /* ── Private ─────────────────────────────────────────────── */

    _computeRemaining() {
      if (this._startedAt === null) return this._total;
      const elapsed = (performance.now() - this._startedAt) / 1000;
      return Math.max(0, this._total - elapsed - this._penaltyAcc);
    }

    _tick() {
      if (this._stopped) return;

      const remaining = this._computeRemaining();
      const fraction  = remaining / this._total;

      this._onTick(remaining, fraction);

      if (remaining <= 0) {
        this._triggerExpiry();
        return;
      }

      this._rafId = requestAnimationFrame(() => this._tick());
    }

    _triggerExpiry() {
      if (this._expired) return;   // guard against double-fire
      this._expired = true;
      this.stop();
      this._onTick(0, 0);          // final tick at 0
      this._onExpire();
    }
  }

  DD.Timer = Timer;

}(window.DD = window.DD || {}));
