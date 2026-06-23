(function (DD) {
  'use strict';

  function loadScores() {
    try {
      const raw = localStorage.getItem(DD.CONFIG.LS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function buildDiffCard(diff, index) {
    const a = document.createElement('a');
    a.href = 'game.html?difficulty=' + diff.key;
    a.className = 'diff-card diff-card--' + diff.key;
    a.setAttribute('data-sfx', 'click');
    a.setAttribute('aria-label', diff.modeLine + ': ' + diff.gridSize + 'x' + diff.gridSize + ' grid');
    a.innerHTML =
      '<div class="diff-card__hud-corner diff-card__hud-corner--tl"></div>' +
      '<div class="diff-card__hud-corner diff-card__hud-corner--br"></div>' +
      '<p class="diff-card__key">0' + (index + 1) + '</p>' +
      '<h3 class="diff-card__name">' + diff.label + '</h3>' +
      '<p class="diff-card__mode">' + diff.modeLine + '</p>' +
      '<ul class="diff-card__stats">' +
        '<li><span class="stat-label">GRID</span><span class="stat-val">' + diff.gridSize + ' &times; ' + diff.gridSize + '</span></li>' +
        '<li><span class="stat-label">TIME</span><span class="stat-val">' + diff.timeLimit + ' sec</span></li>' +
        '<li><span class="stat-label">CELLS</span><span class="stat-val">' + (diff.gridSize * diff.gridSize) + '</span></li>' +
      '</ul>' +
      '<div class="diff-card__play-btn">PLAY</div>';
    return a;
  }

  function renderDiffCards() {
    const container = document.getElementById('js-diff-cards');
    if (!container) return;
    const frag = document.createDocumentFragment();
    DD.CONFIG.DIFF_ORDER.forEach((key, i) => {
      frag.appendChild(buildDiffCard(DD.CONFIG.DIFFICULTIES[key], i));
    });
    container.appendChild(frag);
  }

  function renderScoreBadges() {
    const row = document.getElementById('js-scores-row');
    if (!row) return;

    const scores = loadScores();
    row.innerHTML = DD.CONFIG.DIFF_ORDER.map((key) => {
      const diff     = DD.CONFIG.DIFFICULTIES[key];
      const entry    = scores[key];
      const hasScore = entry && typeof entry.score === 'number';
      return `
        <div class="score-badge${hasScore ? '' : ' score-badge--no-score'}">
          <span class="score-badge__diff">${diff.label}</span>
          <span class="score-badge__score">${hasScore ? entry.score : '—'}</span>
        </div>`;
    }).join('');
  }

  function initThemeToggle() {
    const btn = document.getElementById('js-theme-toggle');
    if (!btn || typeof MiniverseTheme === 'undefined') return;
    const sunIco  = btn.querySelector('.icon--theme-sun');
    const moonIco = btn.querySelector('.icon--theme-moon');

    function sync(theme) {
      const isLight = theme === 'light';
      sunIco.style.display  = isLight ? '' : 'none';
      moonIco.style.display = isLight ? 'none' : '';
      btn.setAttribute('aria-pressed', String(isLight));
      btn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    }

    sync(MiniverseTheme.get());
    btn.addEventListener('click', () => sync(MiniverseTheme.toggle()));
  }

  function initSoundToggle() {
    const btn = document.getElementById('js-sound-toggle');
    if (!btn || typeof MiniverseAudio === 'undefined') return;
    const onIco  = btn.querySelector('.icon--sound-on');
    const offIco = btn.querySelector('.icon--sound-off');

    function sync(muted) {
      onIco.style.display  = muted ? 'none' : '';
      offIco.style.display = muted ? '' : 'none';
      btn.setAttribute('aria-pressed', String(muted));
      btn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
    }

    sync(MiniverseAudio.isMuted());
    btn.addEventListener('click', () => sync(MiniverseAudio.toggleMute()));
  }

  function init() {
    renderDiffCards();
    renderScoreBadges();
    initThemeToggle();
    initSoundToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}(window.DD = window.DD || {}));
