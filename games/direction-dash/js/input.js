(function (DD) {
  'use strict';

  class KeyboardInput {
    constructor(onDir, onFeedback) {
      this._onDir      = onDir;
      this._onFeedback = onFeedback || function () {};
      this._enabled    = false;
      this._handler    = this._onKeyDown.bind(this);
    }

    enable() {
      if (this._enabled) return;
      window.addEventListener('keydown', this._handler);
      this._enabled = true;
    }

    disable() {
      window.removeEventListener('keydown', this._handler);
      this._enabled = false;
    }

    _onKeyDown(e) {
      const key = e.key.toLowerCase();
      const dir = DD.CONFIG.KEY_MAP[key];
      if (!dir) return;
      e.preventDefault();
      this._onFeedback(dir);
      this._onDir(dir);
    }
  }

  class ButtonInput {
    constructor(dpadEl, onDir, onFeedback) {
      this._el         = dpadEl;
      this._onDir      = onDir;
      this._onFeedback = onFeedback || function () {};
      this._enabled    = false;
      this._handler    = this._onClick.bind(this);
    }

    enable() {
      if (!this._el || this._enabled) return;
      this._el.addEventListener('pointerdown', this._handler);
      this._enabled = true;
    }

    disable() {
      if (this._el) {
        this._el.removeEventListener('pointerdown', this._handler);
      }
      this._enabled = false;
    }

    _onClick(e) {
      const btn = e.target.closest('[data-dir]');
      if (!btn) return;
      e.preventDefault();
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 150);
      this._onFeedback(btn.dataset.dir);
      this._onDir(btn.dataset.dir);
    }
  }

  class SwipeInput {
    constructor(el, onDir, onFeedback) {
      this._el         = el;
      this._onDir      = onDir;
      this._onFeedback = onFeedback || function () {};
      this._enabled    = false;
      this._startX     = 0;
      this._startY     = 0;
      this._tracking   = false;

      this._onPtrDown = this._handleDown.bind(this);
      this._onPtrUp   = this._handleUp.bind(this);
    }

    enable() {
      if (!this._el || this._enabled) return;
      this._el.addEventListener('pointerdown', this._onPtrDown, { passive: false });
      this._el.addEventListener('pointerup',   this._onPtrUp);
      this._el.addEventListener('pointercancel', this._cancel.bind(this));
      this._enabled = true;
    }

    disable() {
      if (this._el) {
        this._el.removeEventListener('pointerdown', this._onPtrDown);
        this._el.removeEventListener('pointerup',   this._onPtrUp);
      }
      this._tracking = false;
      this._enabled  = false;
    }

    _handleDown(e) {
      e.preventDefault();
      this._startX   = e.clientX;
      this._startY   = e.clientY;
      this._tracking = true;
    }

    _handleUp(e) {
      if (!this._tracking) return;
      this._tracking = false;
      this._processSwipe(e.clientX, e.clientY);
    }

    _cancel() { this._tracking = false; }

    _processSwipe(endX, endY) {
      const dx      = endX - this._startX;
      const dy      = endY - this._startY;
      const absDx   = Math.abs(dx);
      const absDy   = Math.abs(dy);
      const maxDist = Math.max(absDx, absDy);

      if (maxDist < DD.CONFIG.SWIPE_THRESHOLD_PX) return;

      const dir = absDx >= absDy
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down'  : 'up');

      this._onFeedback(dir);
      this._onDir(dir);
    }
  }

  class InputManager {
    constructor(gameAreaEl, dpadEl, onDirection, onFeedback) {
      this._active = false;
      this._mode   = null;

      const emit = (dir) => {
        if (!this._active) return;
        onDirection(dir);
      };
      const feedback = (dir) => {
        if (onFeedback) onFeedback(dir, this._mode);
      };

      this._keyboard = new KeyboardInput(emit, feedback);
      this._buttons  = new ButtonInput(dpadEl, emit, feedback);
      this._swipe    = new SwipeInput(gameAreaEl, emit, feedback);
    }

    setMode(mode) {
      this._mode = mode;

      this._keyboard.disable();
      this._buttons.disable();
      this._swipe.disable();

      switch (mode) {
        case DD.CONFIG.MODES.KEYBOARD: this._keyboard.enable(); break;
        case DD.CONFIG.MODES.BUTTONS:  this._buttons.enable();  break;
        case DD.CONFIG.MODES.SWIPE:    this._swipe.enable();    break;
      }

      DD.Renderer.setInputMode(mode);
    }

    toggleSwipe() {
      if (this._mode === DD.CONFIG.MODES.SWIPE) {
        const def = DD.isMobile() ? DD.CONFIG.MODES.BUTTONS : DD.CONFIG.MODES.KEYBOARD;
        this.setMode(def);
      } else {
        this.setMode(DD.CONFIG.MODES.SWIPE);
      }
      return this._mode;
    }

    activate()   { this._active = true; }
    deactivate() { this._active = false; }

    get mode()   { return this._mode; }

    destroy() {
      this._keyboard.disable();
      this._buttons.disable();
      this._swipe.disable();
    }
  }

  DD.isMobile = function () {
    return navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  };

  DD.InputManager = InputManager;

}(window.DD = window.DD || {}));
