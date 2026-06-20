/* =====================================================================
   js/main.js  —  homepage initialisation
   Reads GAMES_REGISTRY (games.js) and injects game cards into the grid.
   ===================================================================== */

(function () {
  'use strict';

  /* ── Helpers ───────────────────────────────────────────────────── */

  /** Safely escape HTML to prevent XSS from game metadata */
  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ── Card builder ──────────────────────────────────────────────── */

  function buildCard(game) {
    const isPlayable = Boolean(game.url);

    /* Wrapper — <a> if playable, <div role="listitem"> if coming soon */
    const tag      = isPlayable ? 'a'   : 'div';
    const el       = document.createElement(tag);
    el.className   = 'game-card' + (isPlayable ? '' : ' game-card--locked');
    el.setAttribute('role', 'listitem');

    if (isPlayable) {
      el.href = game.url;
      el.setAttribute('aria-label', `Play ${game.title}`);
    } else {
      el.setAttribute('aria-label', `${game.title} – unavailable`);
      el.setAttribute('tabindex', '0');
    }

    /* Set CSS accent variable per-card for hover glow */
    if (game.accent) {
      el.style.setProperty('--card-accent', game.accent);
    }

    el.innerHTML = /* html */`
      <img
        class="game-card__img"
        src="${esc(game.thumbnail)}"
        alt="${esc(game.title)} thumbnail"
        loading="lazy"
        onerror="this.src='assets/images/coming-soon.svg'"
      >
      <div class="game-card__banner">
        <p class="game-card__title">${esc(game.title)}</p>
        <p class="game-card__sub">${esc(game.subtitle)}</p>
      </div>
      ${!isPlayable ? '<div class="game-card__locked-badge">COMING SOON</div>' : ''}
    `;

    return el;
  }

  /* ── Render ────────────────────────────────────────────────────── */

  function renderGames() {
    const grid = document.getElementById('js-games-grid');
    if (!grid) return;

    grid.innerHTML = ''; // clear placeholder

    if (!window.GAMES_REGISTRY || GAMES_REGISTRY.length === 0) {
      grid.innerHTML = '<p class="games-grid__placeholder">No games found.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    GAMES_REGISTRY.forEach(game => fragment.appendChild(buildCard(game)));
    grid.appendChild(fragment);
  }

  /* ── Init ──────────────────────────────────────────────────────── */

  function init() {
    renderGames();

    /* Update copyright year */
    const yearEl = document.getElementById('js-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
