(function (DD) {
  'use strict';

  var MODE_ICONS = {
    keyboard: [
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"',
      ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '<rect x="2" y="6" width="20" height="12" rx="2"/>',
      '<path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M10 14h4"/>',
      '</svg>'
    ].join(''),
    buttons: [
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"',
      ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '<path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
      '<rect x="9" y="9" width="6" height="6" rx="1"/>',
      '<path d="M12 6v3M12 15v3M6 12h3M15 12h3"/>',
      '</svg>'
    ].join(''),
    swipe: [
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"',
      ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '<path d="M18 11V6a2 2 0 0 0-4 0v1"/>',
      '<path d="M14 5V4a2 2 0 0 0-4 0v3"/>',
      '<path d="M10 5.5V3a2 2 0 0 0-4 0v5"/>',
      '<path d="M6 8v4l-1.5 1.5A2 2 0 0 0 6 17l1 1 4 1h4a4 4 0 0 0 4-4V9"/>',
      '</svg>'
    ].join('')
  };

  var _el = {};
  var _menuOverlay = null;
  var _countdownOverlay = null;
  var _resultOverlay = null;

  function init() {
    _el = {
      timerFill:         document.getElementById('js-timer-fill'),
      timerLabel:        document.getElementById('js-timer-label'),
      diffLabel:         document.getElementById('js-diff-label'),
      progress:          document.getElementById('js-progress'),
      errors:            document.getElementById('js-errors'),
      grid:              document.getElementById('js-grid'),
      menu:              document.getElementById('js-menu'),
      menuRanking:       document.getElementById('js-menu-ranking'),
      menuDiffContainer: document.getElementById('js-menu-diff-cards'),
      menuDiffCards:     null,
      countdown:         document.getElementById('js-countdown'),
      countdownNum:      document.getElementById('js-countdown-num'),
      result:            document.getElementById('js-result'),
      resultTitle:       document.getElementById('js-result-title'),
      resultStats:       document.getElementById('js-result-stats'),
      resultRanking:      document.getElementById('js-result-ranking'),
      dpad:              document.getElementById('js-dpad'),
      kbHint:            document.getElementById('js-kb-hint'),
      swipeHint:         document.getElementById('js-swipe-hint'),
      modeBtn:           document.getElementById('js-mode-toggle'),
      modeIcon:           document.getElementById('js-mode-icon'),
      modeLabel:          document.getElementById('js-mode-label')
    };

    buildMenuDiffCards();

    if (typeof MiniverseOverlay !== 'undefined') {
      _menuOverlay = MiniverseOverlay.create({
        element: _el.menu, bodyClass: 'menu-open', closeOnEsc: false, focusTarget: null
      });
      _countdownOverlay = MiniverseOverlay.create({
        element: _el.countdown, lockBody: false, closeOnEsc: false, focusTarget: null
      });
      _resultOverlay = MiniverseOverlay.create({
        element: _el.result, lockBody: false, closeOnEsc: false, focusTarget: 'js-btn-restart'
      });
    }
  }

  function buildMenuDiffCards() {
    if (!_el.menuDiffContainer) return;
    var order = DD.CONFIG.DIFF_ORDER;
    _el.menuDiffContainer.innerHTML = order.map(function (key) {
      var diff = DD.CONFIG.DIFFICULTIES[key];
      return '<button type="button" class="diff-mini-card diff-mini-card--' + key + '" data-diff="' + key + '" data-sfx="click" aria-pressed="false">' +
        '<span class="diff-mini-card__name">' + diff.label + '</span>' +
        '<span class="diff-mini-card__meta">' + diff.gridSize + '&times;' + diff.gridSize + ' &middot; ' + diff.timeLimit + 's</span>' +
      '</button>';
    }).join('');
    _el.menuDiffCards = _el.menuDiffContainer.querySelectorAll('.diff-mini-card');
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
      var syms = _el.grid.querySelectorAll('.cell--glitch .cell__symbol');
      syms.forEach(function (s) {
        s.textContent = symbols[dirs[Math.floor(Math.random() * dirs.length)]];
      });
    }, DD.CONFIG.GLITCH_INTERVAL_MS);
  }

  function stopGlitch() {
    if (_glitchTimerId !== null) {
      clearInterval(_glitchTimerId);
      _glitchTimerId = null;
    }
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
    var low = fraction <= DD.CONFIG.TIMER_LOW_FRAC;
    var mid = !low && fraction <= DD.CONFIG.TIMER_MID_FRAC;

    _el.timerFill.classList.remove('timer--mid', 'timer--low');
    if (low) _el.timerFill.classList.add('timer--low');
    else if (mid) _el.timerFill.classList.add('timer--mid');

    if (_el.timerLabel) {
      _el.timerLabel.textContent = remaining.toFixed(1);
      _el.timerLabel.classList.remove('hud-stat__value--low', 'hud-stat__value--mid');
      if (low) _el.timerLabel.classList.add('hud-stat__value--low');
      else if (mid) _el.timerLabel.classList.add('hud-stat__value--mid');
    }
  }

  function setDiffLabel(label) { if (_el.diffLabel) _el.diffLabel.textContent = label; }

  function updateStats(cur, total, wrong) {
    if (_el.progress) _el.progress.textContent = cur + '/' + total;
    if (_el.errors)   _el.errors.textContent   = wrong;
  }

  function showCountdownStep(text, onDone) {
    if (!_el.countdown) { onDone && onDone(); return; }
    if (_countdownOverlay) _countdownOverlay.open(); else _el.countdown.classList.remove('hidden');
    _el.countdownNum.textContent = text;
    var old = _el.countdownNum;
    var clone = old.cloneNode(true);
    old.parentNode.replaceChild(clone, old);
    _el.countdownNum = clone;
    setTimeout(function() { onDone && onDone(); }, DD.CONFIG.COUNTDOWN_STEP_MS);
  }

  function showGoFlash(onDone) {
    if (!_el.countdown) { onDone && onDone(); return; }
    if (_countdownOverlay) _countdownOverlay.open(); else _el.countdown.classList.remove('hidden');
    _el.countdownNum.textContent = 'GO!';
    var old = _el.countdownNum;
    var clone = old.cloneNode(true);
    old.parentNode.replaceChild(clone, old);
    _el.countdownNum = clone;
    setTimeout(function() {
      if (_countdownOverlay) _countdownOverlay.close(); else _el.countdown.classList.add('hidden');
      onDone && onDone();
    }, DD.CONFIG.GO_SHOW_MS);
  }

  function hideCountdown() {
    if (_countdownOverlay) _countdownOverlay.close();
    else if (_el.countdown) _el.countdown.classList.add('hidden');
  }

  function showMenu() {
    if (_menuOverlay) _menuOverlay.open();
    else if (_el.menu) { _el.menu.classList.remove('hidden'); document.body.classList.add('menu-open'); }
  }

  function hideMenu() {
    if (_menuOverlay) _menuOverlay.close();
    else if (_el.menu) { _el.menu.classList.add('hidden'); document.body.classList.remove('menu-open'); }
  }

  function isMenuOpen() {
    return !!(_menuOverlay && _menuOverlay.isOpen());
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
      card.addEventListener('click', function () {
        onSelect(card.getAttribute('data-diff'));
      });
    });
  }

  function _rankingRowHtml(entry, i) {
    var hasScore = typeof entry.score === 'number';
    return '<li class="menu-ranking__row' + (hasScore ? '' : ' menu-ranking__row--empty') + '">' +
      '<span class="menu-ranking__rank">#' + (i + 1) + '</span>' +
      '<span class="menu-ranking__diff">' + entry.label + '</span>' +
      '<span class="menu-ranking__score">' + (hasScore ? entry.score : '—') + '</span>' +
    '</li>';
  }

  function renderRanking(entries) {
    if (!_el.menuRanking) return;
    _el.menuRanking.innerHTML = entries.map(_rankingRowHtml).join('');
  }

  function renderResultRanking(entries) {
    if (!_el.resultRanking) return;
    _el.resultRanking.innerHTML = entries.map(_rankingRowHtml).join('');
  }

  function showResult(win, stats, ranking) {
    if (!_el.result) return;
    _el.resultTitle.textContent = win ? 'CLEARED!' : "TIME'S UP";
    _el.resultTitle.className = 'result-title result-title--' + (win ? 'win' : 'lose');

    var rows = [
      { label: 'PROGRESS', val: stats.completed + ' / ' + stats.total },
      { label: 'ERRORS',   val: stats.errors }
    ];
    if (win) {
      rows.push({ label: 'TIME LEFT', val: stats.timeRemaining.toFixed(2) + 's' });
      rows.push({ label: 'SCORE', val: stats.score, hi: true });
    }
    _el.resultStats.innerHTML = rows.map(function(r) {
      return '<div class="result-row"><span class="result-row__label">' + r.label +
        '</span><span class="result-row__val' + (r.hi ? ' result-row__val--score' : '') +
        '">' + r.val + '</span></div>';
    }).join('') + (stats.isHighScore ? '<div class="result-highscore">&#9733; NEW HIGH SCORE</div>' : '');

    if (ranking) renderResultRanking(ranking);

    if (_resultOverlay) _resultOverlay.open();
    else _el.result.classList.remove('hidden');
  }

  function hideResult() {
    if (_resultOverlay) _resultOverlay.close();
    else if (_el.result) _el.result.classList.add('hidden');
  }

  function setInputMode(mode) {
    var M = DD.CONFIG.MODES;
    if (_el.dpad)      _el.dpad.classList.toggle('hidden', mode !== M.BUTTONS);
    if (_el.kbHint)    _el.kbHint.classList.toggle('hidden', mode !== M.KEYBOARD);
    if (_el.swipeHint) _el.swipeHint.classList.toggle('hidden', mode !== M.SWIPE);

    if (_el.modeIcon)  _el.modeIcon.innerHTML  = MODE_ICONS[mode] || '';
    if (_el.modeLabel) _el.modeLabel.textContent = DD.CONFIG.MODE_LABELS[mode] || mode.toUpperCase();
  }

  function flashKey(direction) {
    if (!_el.kbHint) return;
    var letter = DD.CONFIG.KEY_LABELS[direction];
    if (!letter) return;
    _el.kbHint.querySelectorAll('kbd').forEach(function(k) {
      if (k.textContent.trim() === letter) {
        k.classList.add('key--active');
        setTimeout(function() { k.classList.remove('key--active'); }, 160);
      }
    });
  }

  function flashSwipeIcon() {
    if (!_el.swipeHint) return;
    var icon = _el.swipeHint.querySelector('.swipe-hint__icon');
    if (!icon) return;
    icon.classList.add('swipe-hint__icon--active');
    setTimeout(function () { icon.classList.remove('swipe-hint__icon--active'); }, 200);
  }

  function flashInputFeedback(direction, mode) {
    if (mode === DD.CONFIG.MODES.KEYBOARD) flashKey(direction);
    else if (mode === DD.CONFIG.MODES.SWIPE) flashSwipeIcon();
  }

  DD.Renderer = {
    init, buildGrid, startGlitch, stopGlitch, freezeGrid,
    setActiveCell, flashCell, markCellDone,
    updateTimer, setDiffLabel, updateStats,
    showCountdownStep, showGoFlash, hideCountdown,
    showMenu, hideMenu, isMenuOpen, setMenuSelection, bindMenuDiffCards, renderRanking,
    showResult, hideResult, setInputMode, flashKey, flashInputFeedback
  };

}(window.DD = window.DD || {}));
