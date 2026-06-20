# MINIVERSE 🎮

A growing collection of browser mini-games — no frameworks, no bundlers, pure HTML / CSS / JS.

---

## 🗂️ Project Structure

```
miniverse/
├── index.html                      # Homepage (game card grid)
├── css/
│   ├── variables.css               # Design tokens (colours, spacing, fonts)
│   ├── reset.css                   # CSS baseline reset
│   ├── layout.css                  # Page skeleton + game-card grid
│   ├── components.css              # Header, footer, hero, game cards
│   ├── responsive.css              # 5-col desktop → 2-col mobile breakpoints
│   └── extras.css                  # Misc overrides (locked cards, etc.)
├── js/
│   ├── data/games.js               # ← ADD NEW GAMES HERE
│   └── main.js                     # Homepage card renderer
├── games/
│   └── direction-dash/
│       ├── index.html              # Title / difficulty select screen
│       ├── game.html               # Gameplay screen
│       ├── css/
│       │   ├── title.css           # Title screen styles
│       │   └── game.css            # Game screen styles
│       └── js/
│           ├── config.js           # All constants (tweak difficulty here)
│           ├── state.js            # Pure game state class
│           ├── renderer.js         # All DOM updates
│           ├── timer.js            # RAF countdown with penalty support
│           ├── input.js            # Keyboard / button / swipe handlers
│           ├── game.js             # Main controller (wires everything)
│           └── title.js            # Title screen high-score loader
└── assets/
    └── images/
        ├── direction-dash.svg      # Game card thumbnail
        └── coming-soon.svg         # Placeholder for future games
```

---

## 🚀 Hosting on GitHub Pages — Step-by-Step

### Step 1 — Create a GitHub account
Go to [github.com](https://github.com) and sign up (free).

### Step 2 — Create a new repository
1. Click the **+** icon → **New repository**
2. Name it `miniverse` (or anything you like — affects the URL)
3. Set visibility to **Public**
4. Leave everything else blank → click **Create repository**

### Step 3 — Upload the project files

**Option A — GitHub web UI (easiest)**
1. In your new empty repo, click **uploading an existing file**
2. Drag and drop the entire `miniverse/` folder contents
3. Scroll down, write a commit message like `Initial commit`
4. Click **Commit changes**

**Option B — Git CLI (recommended for ongoing work)**
```bash
# Inside the miniverse/ folder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/miniverse.git
git push -u origin main
```

### Step 4 — Enable GitHub Pages
1. In your repository, click **Settings** (top nav)
2. Scroll down to **Pages** in the left sidebar
3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**
5. Wait ~60 seconds. GitHub will show a green banner:
   > ✅ Your site is published at `https://YOUR_USERNAME.github.io/miniverse/`

### Step 5 — Visit your site
Open `https://YOUR_USERNAME.github.io/miniverse/` in your browser.

> **Tip:** First deployment can take 1–2 minutes. Hard-refresh (`Ctrl+Shift+R`) if you see a 404.

---

## 🎮 Direction Dash — Game Guide

### How to play
1. Select a difficulty on the title screen
2. A countdown appears (READY → 3 → 2 → 1 → GO!)
3. The direction grid reveals — all arrows visible at once
4. Input the **highlighted** cell's direction, left-to-right, row-by-row
5. Clear all cells before the timer hits 0

### Difficulty
| Name      | Grid | Cells | Time |
|-----------|------|-------|------|
| EZPZ      | 3×3  | 9     | 9 s  |
| WHATEVER  | 4×4  | 16    | 9 s  |
| MASTER    | 5×5  | 25    | 9 s  |

### Input modes
| Mode       | Desktop              | Mobile        |
|------------|----------------------|---------------|
| **Default**| WASD / Arrow keys    | D-pad buttons |
| **Swipe**  | Mouse drag           | Touch swipe   |

Toggle via the **SWIPE MODE** button in the top-right HUD.

### Penalty
Each wrong input deducts **1 second** from the remaining time.

### Scoring (win only)
```
Score = floor(timeRemaining × 100 × accuracyMultiplier)
accuracyMultiplier = 1.5 if 0 errors, else 1 / (1 + errors × 0.25)
```

High scores are saved per-difficulty in `localStorage` and shown on the title screen.

---

## ➕ Adding a New Game

1. **Register it** — open `js/data/games.js` and add an entry:
   ```js
   {
     id:        'my-new-game',
     title:     'My Game',
     subtitle:  'A tagline',
     thumbnail: 'assets/images/my-game.svg',  // or .png
     url:       'games/my-new-game/index.html',
     accent:    '#ff9900',
   }
   ```

2. **Create the folder** — `games/my-new-game/` with your `index.html`, `game.html`, `css/`, `js/`.

3. **Add a thumbnail** — drop a 300×400px image into `assets/images/`.

4. Commit and push — GitHub Pages auto-deploys on every push to `main`.

---

## 🛠️ Tweaking Direction Dash

All constants live in `games/direction-dash/js/config.js`:

```js
// Change time limit per difficulty
DIFFICULTIES: {
  ezpz: { ..., timeLimit: 12 },   // easier — more time
  master: { ..., timeLimit: 7 },  // harder — less time
}

// Change penalty per wrong input
PENALTY_SEC: 2,                    // −2 seconds instead of −1

// Change swipe sensitivity
SWIPE_THRESHOLD_PX: 60,            // need a longer drag to register
```

---

## 📱 Browser support
Tested on Chrome 120+, Firefox 121+, Safari 17+, Edge 120+.
Requires: CSS Grid, CSS Custom Properties, `requestAnimationFrame`, Pointer Events API, `localStorage`.

---

## 📄 License
MIT — do whatever you like.
