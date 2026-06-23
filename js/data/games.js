var GAMES_REGISTRY = [
  {
    id: 'direction-dash',
    title: 'Direction Dash',
    subtitle: '',
    thumbnail: 'assets/images/direction-dash.svg',
    url: 'games/direction-dash/game.html',
    accent: '#00d4ff',
    locked: false,
    tip: 'Match each glowing arrow before time runs out. Wrong move \u2212\u20091 second.',
    lsKey: 'miniverse_dd_scores_v1',
    difficulties: [
      { key: 'ezpz', label: 'EZPZ', meta: '3\u00d73 \u00b7 9s', color: '#00d4ff' },
      { key: 'whatever', label: 'WHATEVER', meta: '4\u00d74 \u00b7 9s', color: '#9d4eff' },
      { key: 'master', label: 'MASTER', meta: '5\u00d75 \u00b7 9s', color: '#ff2d8b' }
    ]
  },
  {
    id: 'coming-soon-1',
    title: 'Coming Soon',
    subtitle: '',
    thumbnail: 'assets/images/coming-soon.svg',
    url: null,
    accent: '#ff2d8b',
    locked: true
  },
  {
    id: 'coming-soon-2',
    title: 'Coming Soon',
    subtitle: '',
    thumbnail: 'assets/images/coming-soon.svg',
    url: null,
    accent: '#9d4eff',
    locked: true
  }
];
