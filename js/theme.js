(function (root) {
  'use strict';

  var KEY = 'miniverse_theme_v1';

  function get() {
    try {
      var stored = localStorage.getItem(KEY);
      return stored === 'light' || stored === 'dark' ? stored : 'dark';
    } catch (e) {
      return 'dark';
    }
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function set(theme) {
    var safe = theme === 'light' ? 'light' : 'dark';
    try { localStorage.setItem(KEY, safe); } catch (e) {}
    apply(safe);
    document.dispatchEvent(new CustomEvent('miniverse-theme-change', { detail: { theme: safe } }));
    return safe;
  }

  function toggle() {
    return set(get() === 'light' ? 'dark' : 'light');
  }

  function init() {
    apply(get());
  }

  root.MiniverseTheme = { init: init, get: get, set: set, toggle: toggle };

}(window));
