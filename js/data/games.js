/* =====================================================================
   js/data/games.js  —  central game registry
   Add new games by pushing an entry to GAMES_REGISTRY.
   ===================================================================== */

const GAMES_REGISTRY = [
  {
    id:          'direction-dash',
    title:       'Direction Dash',
    subtitle:    'Stellar Impulse',
    description: 'Navigate a randomized direction grid before the clock runs out. Wrong inputs cost time.',
    thumbnail:   'assets/images/direction-dash.svg',
    url:         'games/direction-dash/index.html',
    tags:        ['action', 'reflex', 'grid'],
    accent:      '#00d4ff',
  },
  /* ── Placeholder slots so the grid never looks empty ─── */
  {
    id:          'coming-soon-1',
    title:       'Coming Soon',
    subtitle:    '???',
    description: '',
    thumbnail:   'assets/images/coming-soon.svg',
    url:         null,
    tags:        [],
    accent:      '#ff2d8b',
  },
  {
    id:          'coming-soon-2',
    title:       'Coming Soon',
    subtitle:    '???',
    description: '',
    thumbnail:   'assets/images/coming-soon.svg',
    url:         null,
    tags:        [],
    accent:      '#9d4eff',
  },
];
