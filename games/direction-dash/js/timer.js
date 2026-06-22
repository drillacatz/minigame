(function (DD) {
  'use strict';

  class Timer {
    constructor({ totalSeconds, onTick, onExpire }) {
      this._total      = totalSeconds;
      this._onTick     = onTick    || function(){};
      this._onExpire   = onExpire  || function(){};
      this._startedAt  = null;
      this._penaltyAcc = 0;
      this._rafId      = null;
      this._stopped    = false;
      this._expired    = false;
    }

    start() {
      if (this._startedAt !== null) return;
      this._startedAt = performance.now();
      this._stopped   = false;
      this._expired   = false;
      this._tick();
    }

    stop() {
      this._stopped = true;
      if (this._rafId !== null) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    }

    penalize(seconds) {
      this._penaltyAcc += seconds;
      if (this._computeRemaining() <= 0 && !this._expired) this._triggerExpiry();
    }

    get remaining() { return this._computeRemaining(); }

    _computeRemaining() {
      if (this._startedAt === null) return this._total;
      return Math.max(0, this._total - (performance.now() - this._startedAt) / 1000 - this._penaltyAcc);
    }

    _tick() {
      if (this._stopped) return;
      var remaining = this._computeRemaining();
      var fraction  = remaining / this._total;
      this._onTick(remaining, fraction);
      if (remaining <= 0) { this._triggerExpiry(); return; }
      this._rafId = requestAnimationFrame(() => this._tick());
    }

    _triggerExpiry() {
      if (this._expired) return;
      this._expired = true;
      this.stop();
      this._onTick(0, 0);
      this._onExpire();
    }
  }

  DD.Timer = Timer;

}(window.DD = window.DD || {}));
