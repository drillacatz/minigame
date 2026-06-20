/* =====================================================================
   js/renderer.js  —  Direction Dash DOM renderer
   Owns all read/write of DOM. Game logic must NOT touch the DOM directly.
   Depends on: config.js
   ===================================================================== */

(function (DD) {
  'use strict';

  /* ── Private element cache ───────────────────────────────────── */
  let _el = {};

  /* ── Initialise ──────────────────────────────────────────────── */
  function init() {
    _el = {
      timerFill:     document.getElementById('js-timer-fill'),
      timerLabel:    document.getElementById('js-timer-label'),
      diffLabel:     document.getElementById('js-diff-label'),
      progress:      document.getElementById('js-progress'),
      errors:        document.getElementById('js-errors'),
      grid:          document.getElementById('js-grid'),
      countdown:     document.getElementById('js-countdown'),
      countdownNum:  document.getElementById('js-countdown-num'),
      result:        document.getElementById('js-result'),
      resultTitle:   document.getElementById('js-result-title'),
      resultStats:   document.getElementById('js-result-stats'),
      dpad:          document.getElementById('js-dpad'),
      kbHint:        document.getElementById('js-kb-hint'),
      swipeHint:     document.getElementById('js-swipe-hint'),
      modeBtn:       document.getElementById('js-mode-toggle'),
    };
  }

  /* ── Grid ────────────────────────────────────────────────────── */

  /** Build the CSS grid and populate it with hidden cells. */
  function buildGrid(gridSize, totalCells) {
    _el.grid.innerHTML = '';
    _el.grid.style.setProperty('--grid-cols', gridSize);

    const frag = document.createDocumentFragment();
    for (let i = 0; i < totalCells; i++) {
      const cell   = document.createElement('div');
      cell.className = 'cell cell--hidden';
      cell.setAttribute('data-index', i);
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', 'hidden');

      const sym  = document.createElement('span');
      sym.className = 'cell__symbol';
      sym.textContent = '?';
      cell.appendChild(sym);
      frag.appendChild(cell);
    }
    _el.grid.appendChild(frag);
  }

  /** @returns {HTMLElement|null} */
  function _getCell(index) {
    return _el.grid.querySelector(`[data-index="${index}"]`);
  }

  /**
   * Reveal a single cell — show its direction symbol.
   * Each cell gets a tiny staggered delay for a cascade effect.
   */
  function revealCell(index, direction) {
    const cell = _getCell(index);
    if (!cell) return;

    const sym = DD.CONFIG.DIR_SYMBOLS[direction] || '?';
    cell.querySelector('.cell__symbol').textContent = sym;
    cell.className = 'cell cell--revealed';
    cell.setAttribute('aria-label', direction);
    cell.setAttribute('data-dir', direction);
  }

  /** Reveal all cells in sequence with a stagger. Calls onDone when last reveals. */
  function revealAll(grid, onDone) {
    const staggerMs = Math.min(20, 400 / grid.length); // tighter stagger for large grids
    grid.forEach((dir, i) => {
      setTimeout(() => {
        revealCell(i, dir);
        if (i === grid.length - 1 && typeof onDone === 'function') {
          // Give the last animation (~250ms) a moment before callback
          setTimeout(onDone, 260);
        }
      }, i * staggerMs);
    });
  }

  /** Highlight the active cell; remove highlight from others. */
  function setActiveCell(index) {
    _el.grid.querySelectorAll('.cell--active').forEach(c => {
      c.classList.remove('cell--active');
    });
    const cell = _getCell(index);
    if (cell) {
      cell.classList.add('cell--active');
      cell.setAttribute('aria-selected', 'true');
    }
  }

  /**
   * Flash a cell with a transient animation class.
   * @param {number} index
   * @param {'correct'|'wrong'} type
   */
  function flashCell(index, type) {
    const cell = _getCell(index);
    if (!cell) return;

    const cls = type === 'correct' ? 'cell--flash-correct' : 'cell--flash-wrong';
    cell.classList.add(cls);

    const onEnd = () => {
      cell.classList.remove(cls);
      cell.removeEventListener('animationend', onEnd);
    };
    cell.addEventListener('animationend', onEnd, { once: true });
  }

  /** Mark a cell as done (correct, no longer active). */
  function markCellDone(index) {
    const cell = _getCell(index);
    if (!cell) return;
    cell.classList.remove('cell--active', 'cell--flash-correct');
    cell.classList.add('cell--done');
    cell.querySelector('.cell__symbol').textContent = '✓';
    cell.setAttribute('aria-label', 'correct');
    cell.removeAttribute('aria-selected');
  }

  /* ── Timer ───────────────────────────────────────────────────── */

  /**
   * @param {number} remaining  seconds left
   * @param {number} fraction   remaining / total (0–1)
   */
  function updateTimer(remaining, fraction) {
    if (!_el.timerFill) return;

    // Width
    const pct = Math.max(0, Math.min(100, fraction * 100));
    _el.timerFill.style.width = `${pct}%`;

    // Colour class
    const C = DD.CONFIG;
    _el.timerFill.classList.remove('timer--mid', 'timer--low');
    if (fraction <= C.TIMER_LOW_FRAC) {
      _el.timerFill.classList.add('timer--low');
    } else if (fraction <= C.TIMER_MID_FRAC) {
      _el.timerFill.classList.add('timer--mid');
    }

    // Numeric label
    if (_el.timerLabel) {
      _el.timerLabel.textContent = remaining.toFixed(1);
      _el.timerLabel.style.color = fraction <= C.TIMER_LOW_FRAC ? '#ff3f3f'
                                 : fraction <= C.TIMER_MID_FRAC ? '#ffd700'
                                 : '#00d4ff';
    }
  }

  /* ── HUD stats ───────────────────────────────────────────────── */

  function setDiffLabel(label) {
    if (_el.diffLabel) _el.diffLabel.textContent = label;
  }

  function updateStats(currentIndex, totalCells, wrongCount) {
    if (_el.progress) _el.progress.textContent = `${currentIndex}/${totalCells}`;
    if (_el.errors)   _el.errors.textContent   = wrongCount;
  }

  /* ── Countdown overlay ───────────────────────────────────────── */

  /**
   * Show the countdown overlay with the given text, then call onDone.
   * The animation is driven by CSS; JS just swaps the text and waits.
   */
  function showCountdownStep(text, onDone) {
    if (!_el.countdown) { onDone?.(); return; }

    _el.countdown.classList.remove('hidden');
    _el.countdownNum.textContent = text;

    // Restart animation by cloning
    const old = _el.countdownNum;
    const clone = old.cloneNode(true);
    old.parentNode.replaceChild(clone, old);
    _el.countdownNum = clone;

    setTimeout(() => { onDone?.(); }, DD.CONFIG.COUNTDOWN_STEP_MS);
  }

  function hideCountdown() {
    if (_el.countdown) _el.countdown.classList.add('hidden');
  }

  /* ── Result overlay ──────────────────────────────────────────── */

  /**
   * @param {boolean} win
   * @param {{ completed, total, errors, timeRemaining, score, isHighScore }} stats
   */
  function showResult(win, stats) {
    if (!_el.result) return;

    // Title
    _el.resultTitle.textContent = win ? 'CLEARED!' : "TIME'S UP";
    _el.resultTitle.className   = `result-title result-title--${win ? 'win' : 'lose'}`;

    // Stats rows
    const rows = [
      { label: 'PROGRESS', val: `${stats.completed} / ${stats.total}` },
      { label: 'ERRORS',   val: stats.errors },
    ];
    if (win) {
      rows.push({ label: 'TIME LEFT', val: `${stats.timeRemaining.toFixed(2)}s` });
      rows.push({ label: 'SCORE', val: stats.score, highlight: true });
    }

    _el.resultStats.innerHTML = rows.map(r => `
      <div class="result-row">
        <span class="result-row__label">${r.label}</span>
        <span class="result-row__val${r.highlight ? ' result-row__val--score' : ''}">${r.val}</span>
      </div>
    `).join('') + (stats.isHighScore ? '<div class="result-highscore">★ NEW HIGH SCORE</div>' : '');

    _el.result.classList.remove('hidden');
  }

  function hideResult() {
    if (_el.result) _el.result.classList.add('hidden');
  }

  /* ── Input mode switching ────────────────────────────────────── */

  /**
   * Show/hide the correct control widget for the given mode.
   * @param {'keyboard'|'buttons'|'swipe'} mode
   */
  function setInputMode(mode) {
    const M = DD.CONFIG.MODES;

    // D-pad
    if (_el.dpad) {
      _el.dpad.classList.toggle('hidden', mode !== M.BUTTONS);
    }
    // Keyboard hint
    if (_el.kbHint) {
      _el.kbHint.classList.toggle('hidden', mode !== M.KEYBOARD);
    }
    // Swipe hint
    if (_el.swipeHint) {
      _el.swipeHint.classList.toggle('hidden', mode !== M.SWIPE);
    }
    // Mode toggle button label
    if (_el.modeBtn) {
      _el.modeBtn.textContent = mode === M.SWIPE ? 'BUTTON/KEY MODE' : 'SWIPE MODE';
    }
  }

  /** Briefly highlight a WASD key in the keyboard hint widget. */
  function flashKey(direction) {
    if (!_el.kbHint) return;
    const dirToKey = { up: 'W', down: 'S', left: 'A', right: 'D' };
    const letter = dirToKey[direction];
    if (!letter) return;
    const keyEl = _el.kbHint.querySelector(`kbd`);
    // find the matching key element
    _el.kbHint.querySelectorAll('kbd').forEach(k => {
      if (k.textContent.trim() === letter) {
        k.classList.add('key--active');
        setTimeout(() => k.classList.remove('key--active'), 150);
      }
    });
  }

  /* ── Public API ──────────────────────────────────────────────── */
  DD.Renderer = {
    init,
    buildGrid,
    revealAll,
    setActiveCell,
    flashCell,
    markCellDone,
    updateTimer,
    setDiffLabel,
    updateStats,
    showCountdownStep,
    hideCountdown,
    showResult,
    hideResult,
    setInputMode,
    flashKey,
  };

}(window.DD = window.DD || {}));
