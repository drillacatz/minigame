(function (root) {
  'use strict';

  function resolveEl(ref) {
    if (!ref) return null;
    return typeof ref === 'string' ? document.getElementById(ref) : ref;
  }

  function create(options) {
    options = options || {};
    var el = resolveEl(options.element);
    var backdrop = resolveEl(options.backdrop);
    var closeBtn = resolveEl(options.closeButton);
    var focusTarget = resolveEl(options.focusTarget) || closeBtn;
    var onOpen = typeof options.onOpen === 'function' ? options.onOpen : function () {};
    var onClose = typeof options.onClose === 'function' ? options.onClose : function () {};
    var lockBody = options.lockBody !== false;
    var bodyClass = options.bodyClass || 'overlay-open';
    var closeOnEsc = options.closeOnEsc !== false;
    var visible = false;

    function open(data) {
      if (!el) return;
      el.classList.remove('hidden');
      if (lockBody) document.body.classList.add(bodyClass);
      visible = true;
      onOpen(data);
      if (focusTarget) {
        setTimeout(function () {
          if (typeof focusTarget.focus === 'function') focusTarget.focus();
        }, 60);
      }
    }

    function close() {
      if (!el || !visible) return;
      el.classList.add('hidden');
      if (lockBody) document.body.classList.remove(bodyClass);
      visible = false;
      onClose();
    }

    function isOpen() {
      return visible;
    }

    if (backdrop) backdrop.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (closeOnEsc) {
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && visible) close();
      });
    }

    return { open: open, close: close, isOpen: isOpen, element: el };
  }

  root.MiniverseOverlay = { create: create };

}(window));
