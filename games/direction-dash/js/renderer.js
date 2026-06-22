(function (DD) {
  'use strict';

  var MODE_ICONS = {
    keyboard: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M10 14h4"/></svg>',
    buttons:  '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>',
    swipe:    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-4 0v1"/><path d="M14 5V4a2 2 0 0 0-4 0v3"/><path d="M10 5.5V3a2 2 0 0 0-4 0v5"/><path d="M6 8v4l-1.5 1.5A2 2 0 0 0 6 17l1 1 4 1h4a4 4 0 0 0 4-4V9"/></svg>',
  };

  var MODE_LABELS = { keyboard: 'WASD', buttons: 'D-PAD', swipe: 'SWIPE' };

  var _el = {};

  function init() {
    _el = {
      timerFill:     document.getElementById('js-timer-fill'),
      timerLabel:    document.getElementById('js-timer-label'),
      diffLabel:     document.getElementById('js-diff-label'),
      progress:      document.getElementById('js-progress'),
      errors:        document.getElementById('js-errors'),
      grid:          document.getElementById('js-grid'),
      panelMenu:     document.getElementById('js-panel-menu'),
      panelCountdown:document.getElementById('js-panel-countdown'),
      panelResult:   document.getElementById('js-panel-result'),
      menuRanking:   document.getElementById('js-menu-ranking'),
      menuDiffCards: document.querySelectorAll('.diff-card'),
      countdownNum:  document.getElementById('js-countdown-num'),
      resultTitle:   document.getElementById('js-result-title'),
      resultStats:   document.getElementById('js-result-stats'),
      resultLeaderboard: document.getElementById('js-result-leaderboard'),
      dpad:          document.getElementById('js-dpad'),
      kbHint:        document.getElementById('js-kb-hint'),
      swipeHint:     document.getElementById('js-swipe-hint'),
      modeBtn:       document.getElementById('js-mode-toggle'),
      modeIcon:      document.getElementById('js-mode-icon'),
      modeLabel:     document.getElementById('js-mode-label'),
      themeBtn:      document.getElementById('js-theme-toggle'),
      themeIcon:     document.getElementById('js-theme-icon'),
    };
    _bindTheme();
  }

  function _bindTheme() {
    if (!_el.themeBtn) return;
    var stored = null;
    try { stored = localStorage.getItem('dd_theme_v1'); } catch(e) {}
    var preferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    _applyTheme(stored || preferred);
    _el.themeBtn.addEventListener('click', function() {
      var cur = document.documentElement.getAttribute('data-theme') || 'dark';
      _applyTheme(cur === 'dark' ? 'light' : 'dark');
    });
  }

  function _applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (_el.themeIcon) _el.themeIcon.textContent = theme === 'light' ? '☀' : '◑';
    try { localStorage.setItem('dd_theme_v1', theme); } catch(e) {}
  }

  function buildGrid(gridSize, totalCells) {
    stopGlitch();
    _el.grid.innerHTML = '';
    _el.grid.style.setProperty('--grid-cols', gridSize);
    var dirs = DD.CONFIG.DIRS;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < totalCells; i++) {
      var cell = document.createElement('div');
      cell.className = 'cell cell--glitch';
      cell.setAttribute('data-index', i);
      cell.setAttribute('role', 'gridcell');
      var sym = document.createElement('span');
      sym.className = 'cell__symbol';
      sym.textContent = DD.CONFIG.DIR_SYMBOLS[dirs[Math.floor(Math.random() * dirs.length)]];
      cell.appendChild(sym);
      frag.appendChild(cell);
    }
    _el.grid.appendChild(frag);
  }

  function _getCell(index) {
    return _el.grid.querySelector('[data-index="' + index + '"]');
  }

  var _glitchTimerId = null;

  function startGlitch() {
    stopGlitch();
    var dirs    = DD.CONFIG.DIRS;
    var symbols = DD.CONFIG.DIR_SYMBOLS;
    _glitchTimerId = setInterval(function () {
      _el.grid.querySelectorAll('.cell--glitch .cell__symbol').forEach(function (s) {
        s.textContent = symbols[dirs[Math.floor(Math.random() * dirs.length)]];
      });
    }, DD.CONFIG.GLITCH_INTERVAL_MS);
  }

  function stopGlitch() {
    if (_glitchTimerId !== null) { clearInterval(_glitchTimerId); _glitchTimerId = null; }
  }

  function freezeGrid(grid) {
    stopGlitch();
    for (var i = 0; i < grid.length; i++) {
      var cell = _getCell(i);
      if (!cell) continue;
      var dir = grid[i];
      cell.querySelector('.cell__symbol').textContent = DD.CONFIG.DIR_SYMBOLS[dir] || '?';
      cell.className = 'cell cell--revealed cell--lock';
      cell.setAttribute('data-dir', dir);
    }
  }

  function setActiveCell(index) {
    var prev = _el.grid.querySelector('.cell--active');
    if (prev) prev.classList.remove('cell--active');
    var cell = _getCell(index);
    if (cell) cell.classList.add('cell--active');
  }

  function flashCell(index, type) {
    var cell = _getCell(index);
    if (!cell) return;
    var cls = type === 'correct' ? 'cell--flash-correct' : 'cell--flash-wrong';
    cell.classList.add(cls);
    cell.addEventListener('animationend', function handler() {
      cell.classList.remove(cls);
      cell.removeEventListener('animationend', handler);
    });
  }

  function markCellDone(index) {
    var cell = _getCell(index);
    if (!cell) return;
    cell.classList.remove('cell--active', 'cell--flash-correct');
    cell.classList.add('cell--done');
    cell.querySelector('.cell__symbol').textContent = '✓';
  }

  function updateTimer(remaining, fraction) {
    if (!_el.timerFill) return;
    _el.timerFill.style.width = Math.max(0, Math.min(100, fraction * 100)) + '%';
    _el.timerFill.classList.remove('timer--mid', 'timer--low');
    if (fraction <= DD.CONFIG.TIMER_LOW_FRAC) {
      _el.timerFill.classList.add('timer--low');
    } else if (fraction <= DD.CONFIG.TIMER_MID_FRAC) {
      _el.timerFill.classList.add('timer--mid');
    }
    if (_el.timerLabel) {
      _el.timerLabel.textContent = remaining.toFixed(1);
      _el.timerLabel.style.color =
        fraction <= DD.CONFIG.TIMER_LOW_FRAC ? 'var(--red)' :
        fraction <= DD.CONFIG.TIMER_MID_FRAC ? 'var(--gold)' : 'var(--cyan)';
    }
  }

  function setDiffLabel(label) { if (_el.diffLabel) _el.diffLabel.textContent = label; }

  function updateStats(cur, total, wrong) {
    if (_el.progress) _el.progress.textContent = cur + '/' + total;
    if (_el.errors)   _el.errors.textContent   = wrong;
  }

  function _replaceCountdownEl(text) {
    var old = _el.countdownNum;
    var clone = old.cloneNode(false);
    clone.textContent = text;
    old.parentNode.replaceChild(clone, old);
    _el.countdownNum = clone;
  }

  function showCountdownStep(text, onDone) {
    _el.panelCountdown.classList.remove('hidden');
    _replaceCountdownEl(text);
    setTimeout(function () { onDone && onDone(); }, DD.CONFIG.COUNTDOWN_STEP_MS);
  }

  function showGoFlash(onDone) {
    _el.panelCountdown.classList.remove('hidden');
    _replaceCountdownEl('GO!');
    setTimeout(function () {
      _el.panelCountdown.classList.add('hidden');
      onDone && onDone();
    }, DD.CONFIG.GO_SHOW_MS);
  }

  function hideCountdown() { _el.panelCountdown.classList.add('hidden'); }

  function showMenu() {
    _el.panelMenu.classList.remove('hidden');
    _el.panelResult.classList.add('hidden');
    _el.panelCountdown.classList.add('hidden');
    document.body.classList.add('menu-open');
  }

  function hideMenu() {
    _el.panelMenu.classList.add('hidden');
    document.body.classList.remove('menu-open');
  }

  function setMenuSelection(diffKey) {
    if (!_el.menuDiffCards) return;
    _el.menuDiffCards.forEach(function (card) {
      var selected = card.getAttribute('data-diff') === diffKey;
      card.classList.toggle('is-selected', selected);
      card.setAttribute('aria-pressed', String(selected));
    });
  }

  function bindMenuDiffCards(onSelect) {
    if (!_el.menuDiffCards) return;
    _el.menuDiffCards.forEach(function (card) {
      card.addEventListener('click', function () { onSelect(card.getAttribute('data-diff')); });
    });
  }

  function renderRanking(entries) {
    if (!_el.menuRanking) return;
    _el.menuRanking.innerHTML = entries.map(function (entry, i) {
      var hasScore = typeof entry.score === 'number';
      return '<li class="ranking-row' + (hasScore ? '' : ' ranking-row--empty') + '">' +
        '<span class="ranking-row__rank">#' + (i + 1) + '</span>' +
        '<span class="ranking-row__diff">' + entry.label + '</span>' +
        '<span class="ranking-row__score">' + (hasScore ? entry.score : '—') + '</span>' +
        '</li>';
    }).join('');
  }

  function showResult(win, stats, rankingEntries) {
    if (!_el.panelResult) return;
    _el.resultTitle.textContent = win ? 'CLEARED!' : "TIME'S UP";
    _el.resultTitle.className = 'result-title result-title--' + (win ? 'win' : 'lose');

    var rows = [
      { label: 'PROGRESS', val: stats.completed + ' / ' + stats.total },
      { label: 'ERRORS',   val: stats.errors },
    ];
    if (win) {
      rows.push({ label: 'TIME LEFT', val: stats.timeRemaining.toFixed(2) + 's' });
      rows.push({ label: 'SCORE', val: stats.score, hi: true });
    }
    _el.resultStats.innerHTML = rows.map(function (r) {
      return '<div class="result-row"><span class="result-row__label">' + r.label +
        '</span><span class="result-row__val' + (r.hi ? ' result-row__val--score' : '') +
        '">' + r.val + '</span></div>';
    }).join('') + (stats.isHighScore ? '<div class="result-highscore">★ NEW HIGH SCORE</div>' : '');

    if (_el.resultLeaderboard && rankingEntries && rankingEntries.length) {
      _el.resultLeaderboard.innerHTML = '<p class="result-leaderboard__title">LEADERBOARD</p>' +
        '<ol class="ranking-list">' +
        rankingEntries.map(function (entry, i) {
          var hasScore = typeof entry.score === 'number';
          return '<li class="ranking-row' + (hasScore ? '' : ' ranking-row--empty') + '">' +
            '<span class="ranking-row__rank">#' + (i + 1) + '</span>' +
            '<span class="ranking-row__diff">' + entry.label + '</span>' +
            '<span class="ranking-row__score">' + (hasScore ? entry.score : '—') + '</span>' +
            '</li>';
        }).join('') + '</ol>';
    } else if (_el.resultLeaderboard) {
      _el.resultLeaderboard.innerHTML = '';
    }

    _el.panelResult.classList.remove('hidden');
    _el.panelMenu.classList.add('hidden');
  }

  function hideResult() { if (_el.panelResult) _el.panelResult.classList.add('hidden'); }

  function setInputMode(mode) {
    var M = DD.CONFIG.MODES;
    if (_el.dpad)      _el.dpad.classList.toggle('hidden', mode !== M.BUTTONS);
    if (_el.kbHint)    _el.kbHint.classList.toggle('hidden', mode !== M.KEYBOARD);
    if (_el.swipeHint) _el.swipeHint.classList.toggle('hidden', mode !== M.SWIPE);
    if (_el.modeIcon)  _el.modeIcon.innerHTML  = MODE_ICONS[mode] || '';
    if (_el.modeLabel) _el.modeLabel.textContent = MODE_LABELS[mode] || mode.toUpperCase();
  }

  function flashKey(direction, type) {
    if (!_el.kbHint) return;
    var map = { up: 'w', down: 's', left: 'a', right: 'd' };
    var letter = map[direction];
    if (!letter) return;
    var key = _el.kbHint.querySelector('[data-key="' + letter + '"]');
    if (!key) return;
    var cls = type === 'wrong' ? 'key--wrong' : 'key--active';
    key.classList.add(cls);
    setTimeout(function () { key.classList.remove(cls); }, 160);
  }

  DD.Renderer = {
    init, buildGrid, startGlitch, stopGlitch, freezeGrid,
    setActiveCell, flashCell, markCellDone,
    updateTimer, setDiffLabel, updateStats,
    showCountdownStep, showGoFlash, hideCountdown,
    showMenu, hideMenu, setMenuSelection, bindMenuDiffCards, renderRanking,
    showResult, hideResult, setInputMode, flashKey,
  };

}(window.DD = window.DD || {}));
