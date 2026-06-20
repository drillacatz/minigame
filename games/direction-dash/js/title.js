/* =====================================================================
   js/title.js  —  Direction Dash title screen helpers
   Reads localStorage scores and injects them into the DOM.
   No DD namespace needed — this file is standalone.
   ===================================================================== */

(function () {
  'use strict';

  const LS_KEY      = 'miniverse_dd_scores_v1';
  const DIFF_KEYS   = ['ezpz', 'whatever', 'master'];
  const DIFF_LABELS = { ezpz: 'EZPZ', whatever: 'WHATEVER', master: 'MASTER' };

  function loadScores() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function renderScoreBadges() {
    const row = document.getElementById('js-scores-row');
    if (!row) return;

    const scores = loadScores();
    const html   = DIFF_KEYS.map(key => {
      const entry    = scores[key];
      const hasScore = entry && typeof entry.score === 'number';
      return `
        <div class="score-badge${hasScore ? '' : ' score-badge--no-score'}">
          <span class="score-badge__diff">${DIFF_LABELS[key]}</span>
          <span class="score-badge__score">${hasScore ? entry.score : '—'}</span>
        </div>`;
    }).join('');

    row.innerHTML = html;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderScoreBadges);
  } else {
    renderScoreBadges();
  }
})();
