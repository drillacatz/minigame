(function () {
  'use strict';

  var diffModal = null;

  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function loadScores(lsKey) {
    try {
      var raw = lsKey ? localStorage.getItem(lsKey) : null;
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function buildCard(game) {
    var isPlayable = !game.locked && !!game.url;
    var hasDiffs = isPlayable && Array.isArray(game.difficulties) && game.difficulties.length > 0;
    var tag = (isPlayable && !hasDiffs) ? 'a' : 'div';
    var el = document.createElement(tag);
    el.className = 'game-card' + (game.locked ? ' game-card--locked' : '');
    el.setAttribute('role', 'listitem');

    if (isPlayable) {
      el.setAttribute('data-sfx', 'click');
      if (hasDiffs) {
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', 'Select difficulty for ' + game.title);
        el.style.cursor = 'pointer';
        el.addEventListener('click', function () { openDiffModal(game); });
        el.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDiffModal(game); }
        });
      } else {
        el.href = game.url;
        el.setAttribute('aria-label', 'Play ' + game.title);
      }
    } else {
      el.setAttribute('aria-label', game.title + ' \u2013 unavailable');
    }

    if (game.accent) el.style.setProperty('--card-accent', game.accent);

    el.innerHTML =
      '<img class="game-card__img" src="' + esc(game.thumbnail) + '" alt="' + esc(game.title) +
      '" loading="lazy" onerror="this.src=\'assets/images/coming-soon.svg\'">' +
      '<div class="game-card__banner">' +
        '<p class="game-card__title">' + esc(game.title) + '</p>' +
        (game.subtitle ? '<p class="game-card__sub">' + esc(game.subtitle) + '</p>' : '') +
      '</div>' +
      (game.locked ? '<div class="game-card__locked-badge">COMING SOON</div>' : '');

    return el;
  }

  function openDiffModal(game) {
    if (diffModal) diffModal.open(game);
  }

  function renderGames() {
    var grid = document.getElementById('js-games-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (typeof GAMES_REGISTRY === 'undefined') {
      grid.innerHTML = '<p class="games-grid__placeholder">Failed to load game list.</p>';
      return;
    }
    if (!GAMES_REGISTRY.length) {
      grid.innerHTML = '<p class="games-grid__placeholder">No games yet.</p>';
      return;
    }

    var frag = document.createDocumentFragment();
    for (var i = 0; i < GAMES_REGISTRY.length; i++) {
      frag.appendChild(buildCard(GAMES_REGISTRY[i]));
    }
    grid.appendChild(frag);
  }

  function initDiffModal() {
    if (typeof MiniverseOverlay === 'undefined') return;
    diffModal = MiniverseOverlay.create({
      element: 'js-launch-modal',
      backdrop: 'js-modal-backdrop',
      closeButton: 'js-modal-close',
      bodyClass: 'modal-open',
      focusTarget: 'js-modal-close',
      onOpen: function (game) {
        var titleEl = document.getElementById('js-modal-title');
        var tipEl = document.getElementById('js-modal-tip');
        var diffsEl = document.getElementById('js-modal-diffs');
        if (titleEl) titleEl.textContent = game.title;
        if (tipEl) tipEl.textContent = game.tip || '';
        if (!diffsEl) return;

        var scores = loadScores(game.lsKey);
        diffsEl.innerHTML = (game.difficulties || []).map(function (diff) {
          var entry = scores[diff.key];
          var score = (entry && typeof entry.score === 'number') ? entry.score : null;
          var scoreHtml = score !== null
            ? 'BEST&nbsp;<span class="ldiff__score-val">' + score + '</span>'
            : '<span class="ldiff__score-empty">\u2014</span>';

          return '<a class="ldiff"' +
            ' href="' + esc(game.url) + '?difficulty=' + esc(diff.key) + '"' +
            ' data-diff="' + esc(diff.key) + '"' +
            ' data-sfx="click"' +
            ' aria-label="Play ' + esc(game.title) + ' on ' + esc(diff.label) + '">' +
            '<span class="ldiff__name" style="color:' + esc(diff.color) + '">' + esc(diff.label) + '</span>' +
            '<span class="ldiff__meta">' + esc(diff.meta) + '</span>' +
            '<span class="ldiff__score">' + scoreHtml + '</span>' +
          '</a>';
        }).join('');
      }
    });
  }

  function initSoundToggle() {
    var btn = document.getElementById('js-sound-toggle');
    if (!btn || typeof MiniverseAudio === 'undefined') return;
    var onIco = btn.querySelector('.icon--sound-on');
    var offIco = btn.querySelector('.icon--sound-off');

    function sync(muted) {
      onIco.style.display = muted ? 'none' : '';
      offIco.style.display = muted ? '' : 'none';
      btn.setAttribute('aria-pressed', String(muted));
      btn.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
    }

    sync(MiniverseAudio.isMuted());
    btn.addEventListener('click', function () { sync(MiniverseAudio.toggleMute()); });
  }

  function initThemeToggle() {
    var btn = document.getElementById('js-theme-toggle');
    if (!btn || typeof MiniverseTheme === 'undefined') return;
    var sunIco = btn.querySelector('.icon--theme-sun');
    var moonIco = btn.querySelector('.icon--theme-moon');

    function sync(theme) {
      var isLight = theme === 'light';
      sunIco.style.display = isLight ? '' : 'none';
      moonIco.style.display = isLight ? 'none' : '';
      btn.setAttribute('aria-pressed', String(isLight));
      btn.setAttribute('aria-label', isLight ? 'Switch to dark theme' : 'Switch to light theme');
    }

    sync(MiniverseTheme.get());
    btn.addEventListener('click', function () { sync(MiniverseTheme.toggle()); });
  }

  function initAudio() {
    if (typeof MiniverseAudio === 'undefined') return;
    MiniverseAudio.init({ basePath: '' });
    MiniverseAudio.playBgm('lobby');
  }

  function init() {
    renderGames();
    initDiffModal();
    initSoundToggle();
    initThemeToggle();
    initAudio();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
