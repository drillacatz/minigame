/* =====================================================================
   js/renderer.js  —  Direction Dash DOM renderer
   All DOM mutations live here. No game logic.
   ===================================================================== */

(function (DD) {
  'use strict';

  /* ── SVG icon strings for input mode button ─────────────────── */
  var MODE_ICONS = {
    keyboard: /* keyboard */ [
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"',
      ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '<rect x="2" y="6" width="20" height="12" rx="2"/>',
      '<path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M10 14h4"/>',
      '</svg>'
    ].join(''),
    buttons: /* d-pad */ [
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"',
      ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '<path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
      '<rect x="9" y="9" width="6" height="6" rx="1"/>',
      '<path d="M12 6v3M12 15v3M6 12h3M15 12h3"/>',
      '</svg>'
    ].join(''),
    swipe: /* hand swipe */ [
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"',
      ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
      '<path d="M18 11V6a2 2 0 0 0-4 0v1"/>',
      '<path d="M14 5V4a2 2 0 0 0-4 0v3"/>',
      '<path d="M10 5.5V3a2 2 0 0 0-4 0v5"/>',
      '<path d="M6 8v4l-1.5 1.5A2 2 0 0 0 6 17l1 1 4 1h4a4 4 0 0 0 4-4V9"/>',
      '</svg>'
    ].join(''),
  };

  /* ── DOM element cache ───────────────────────────────────────── */
  var _el = {};

  function init() {
    _el = {
      timerFill:    document.getElementById('js-timer-fill'),
      timerLabel:   document.getElementById('js-timer-label'),
      diffLabel:    document.getElementById('js-diff-label'),
      progress:     document.getElementById('js-progress'),
      errors:       document.getElementById('js-errors'),
      grid:         document.getElementById('js-grid'),
      countdown:    document.getElementById('js-countdown'),
      countdownNum: document.getElementById('js-countdown-num'),
      result:       document.getElementById('js-result'),
      resultTitle:  document.getElementById('js-result-title'),
      resultStats:  document.getElementById('js-result-stats'),
      dpad:         document.getElementById('js-dpad'),
      kbHint:       document.getElementById('js-kb-hint'),
      swipeHint:    document.getElementById('js-swipe-hint'),
      modeBtn:      document.getElementById('js-mode-toggle'),
      modeIcon:     document.getElementById('js-mode-icon'),
      modeLabel:    document.getElementById('js-mode-label'),
    };
  }

  /* ── Grid ────────────────────────────────────────────────────── */
  function buildGrid(gridSize, totalCells) {
    _el.grid.innerHTML = '';
    _el.grid.style.setProperty('--grid-cols', gridSize);
    var frag = document.createDocumentFragment();
    for (var i = 0; i < totalCells; i++) {
      var cell = document.createElement('div');
      cell.className = 'cell cell--hidden';
      cell.setAttribute('data-index', i);
      cell.setAttribute('role', 'gridcell');
      var sym = document.createElement('span');
      sym.className = 'cell__symbol';
      sym.textContent = '?';
      cell.appendChild(sym);
      frag.appendChild(cell);
    }
    _el.grid.appendChild(frag);
  }

  function _getCell(index) {
    return _el.grid.querySelector('[data-index="' + index + '"]');
  }

  function revealCell(index, direction) {
    var cell = _getCell(index);
    if (!cell) return;
    var sym = DD.CONFIG.DIR_SYMBOLS[direction] || '?';
    cell.querySelector('.cell__symbol').textContent = sym;
    cell.className = 'cell cell--revealed';
    cell.setAttribute('data-dir', direction);
  }

  function revealAll(grid, onDone) {
    var staggerMs = Math.min(20, 400 / grid.length);
    for (var i = 0; i < grid.length; i++) {
      (function(idx, dir) {
        setTimeout(function() {
          revealCell(idx, dir);
          if (idx === grid.length - 1 && typeof onDone === 'function') {
            setTimeout(onDone, 260);
          }
        }, idx * staggerMs);
      })(i, grid[i]);
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

  /* ── Timer ───────────────────────────────────────────────────── */
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
        fraction <= DD.CONFIG.TIMER_LOW_FRAC ? '#ff3f3f' :
        fraction <= DD.CONFIG.TIMER_MID_FRAC ? '#ffd700' : '#00d4ff';
    }
  }

  /* ── HUD ─────────────────────────────────────────────────────── */
  function setDiffLabel(label) { if (_el.diffLabel) _el.diffLabel.textContent = label; }

  function updateStats(cur, total, wrong) {
    if (_el.progress) _el.progress.textContent = cur + '/' + total;
    if (_el.errors)   _el.errors.textContent   = wrong;
  }

  /* ── Countdown overlay ───────────────────────────────────────── */
  function showCountdownStep(text, onDone) {
    if (!_el.countdown) { onDone && onDone(); return; }
    _el.countdown.classList.remove('hidden', 'overlay--transparent');
    _el.countdownNum.textContent = text;
    /* Restart CSS animation by cloning the element */
    var old = _el.countdownNum;
    var clone = old.cloneNode(true);
    old.parentNode.replaceChild(clone, old);
    _el.countdownNum = clone;
    setTimeout(function() { onDone && onDone(); }, DD.CONFIG.COUNTDOWN_STEP_MS);
  }

  /**
   * Show "GO!" over a semi-transparent overlay so the grid remains visible.
   * The player can see the arrows while GO! flashes.
   */
  function showGoFlash(onDone) {
    if (!_el.countdown) { onDone && onDone(); return; }
    _el.countdown.classList.remove('hidden');
    _el.countdown.classList.add('overlay--transparent');
    _el.countdownNum.textContent = 'GO!';
    var old = _el.countdownNum;
    var clone = old.cloneNode(true);
    old.parentNode.replaceChild(clone, old);
    _el.countdownNum = clone;
    setTimeout(function() {
      _el.countdown.classList.add('hidden');
      _el.countdown.classList.remove('overlay--transparent');
      onDone && onDone();
    }, DD.CONFIG.GO_SHOW_MS);
  }

  function hideCountdown() {
    if (_el.countdown) _el.countdown.classList.add('hidden');
  }

  /* ── Result overlay ──────────────────────────────────────────── */
  function showResult(win, stats) {
    if (!_el.result) return;
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
    _el.resultStats.innerHTML = rows.map(function(r) {
      return '<div class="result-row"><span class="result-row__label">' + r.label +
        '</span><span class="result-row__val' + (r.hi ? ' result-row__val--score' : '') +
        '">' + r.val + '</span></div>';
    }).join('') + (stats.isHighScore ? '<div class="result-highscore">&#9733; NEW HIGH SCORE</div>' : '');

    _el.result.classList.remove('hidden');
  }

  function hideResult() { if (_el.result) _el.result.classList.add('hidden'); }

  /* ── Input mode (widgets + button icon) ──────────────────────── */
  function setInputMode(mode) {
    var M = DD.CONFIG.MODES;
    if (_el.dpad)      _el.dpad.classList.toggle('hidden', mode !== M.BUTTONS);
    if (_el.kbHint)    _el.kbHint.classList.toggle('hidden', mode !== M.KEYBOARD);
    if (_el.swipeHint) _el.swipeHint.classList.toggle('hidden', mode !== M.SWIPE);

    /* Update mode toggle button — icon + label reflect CURRENT mode */
    if (_el.modeIcon)  _el.modeIcon.innerHTML  = MODE_ICONS[mode] || '';
    if (_el.modeLabel) {
      var labels = { keyboard: 'WASD', buttons: 'D-PAD', swipe: 'SWIPE' };
      _el.modeLabel.textContent = labels[mode] || mode.toUpperCase();
    }
  }

  function flashKey(direction) {
    if (!_el.kbHint) return;
    var map = { up: 'W', down: 'S', left: 'A', right: 'D' };
    var letter = map[direction];
    if (!letter) return;
    _el.kbHint.querySelectorAll('kbd').forEach(function(k) {
      if (k.textContent.trim() === letter) {
        k.classList.add('key--active');
        setTimeout(function() { k.classList.remove('key--active'); }, 150);
      }
    });
  }

  DD.Renderer = {
    init, buildGrid, revealAll, setActiveCell, flashCell, markCellDone,
    updateTimer, setDiffLabel, updateStats,
    showCountdownStep, showGoFlash, hideCountdown,
    showResult, hideResult, setInputMode, flashKey,
  };

}(window.DD = window.DD || {}));
