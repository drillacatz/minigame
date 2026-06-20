/* =====================================================================
   js/main.js  —  homepage initialisation
   Reads GAMES_REGISTRY (games.js) and injects game cards into the grid.
   ===================================================================== */

(function () {
  'use strict';

  /** Safely escape HTML to prevent XSS from game metadata */
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function buildCard(game) {
    const isPlayable = Boolean(game.url);

    const tag    = isPlayable ? 'a' : 'div';
    const el     = document.createElement(tag);
    el.className = 'game-card' + (isPlayable ? '' : ' game-card--locked');
    el.setAttribute('role', 'listitem');

    if (isPlayable) {
      el.href = game.url;
      el.setAttribute('aria-label', 'Play ' + game.title);
    } else {
      el.setAttribute('aria-label', game.title + ' – unavailable');
      el.setAttribute('tabindex', '0');
    }

    if (game.accent) {
      el.style.setProperty('--card-accent', game.accent);
    }

    el.innerHTML =
      '<img' +
        ' class="game-card__img"' +
        ' src="' + esc(game.thumbnail) + '"' +
        ' alt="' + esc(game.title) + ' thumbnail"' +
        ' loading="lazy"' +
        ' onerror="this.src=\'assets/images/coming-soon.svg\'"' +
      '>' +
      '<div class="game-card__banner">' +
        '<p class="game-card__title">' + esc(game.title) + '</p>' +
        '<p class="game-card__sub">'   + esc(game.subtitle) + '</p>' +
      '</div>' +
      (isPlayable ? '' : '<div class="game-card__locked-badge">COMING SOON</div>');

    return el;
  }

  function renderGames() {
    var grid = document.getElementById('js-games-grid');
    if (!grid) {
      console.error('[Miniverse] #js-games-grid element not found in HTML.');
      return;
    }

    grid.innerHTML = ''; // clear "Loading…" placeholder

    // Guard: games.js must have loaded and populated GAMES_REGISTRY
    if (typeof GAMES_REGISTRY === 'undefined') {
      console.error('[Miniverse] GAMES_REGISTRY is undefined — js/data/games.js may have failed to load.');
      grid.innerHTML = '<p class="games-grid__placeholder">Failed to load game list. Check the browser console (F12).</p>';
      return;
    }

    if (GAMES_REGISTRY.length === 0) {
      grid.innerHTML = '<p class="games-grid__placeholder">No games registered yet.</p>';
      return;
    }

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < GAMES_REGISTRY.length; i++) {
      fragment.appendChild(buildCard(GAMES_REGISTRY[i]));
    }
    grid.appendChild(fragment);
  }

  function init() {
    renderGames();

    var yearEl = document.getElementById('js-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
