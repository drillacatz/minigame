/* =====================================================================
   js/audio.js  —  Miniverse shared audio manager
   One tiny module, included on every page (homepage + every game),
   that handles:
     • one-shot SFX        MiniverseAudio.playSfx('correct')
     • looping BGM          MiniverseAudio.playBgm('lobby')
     • a site-wide mute     MiniverseAudio.toggleMute()  (saved to localStorage)
     • automatic click-sfx  add  data-sfx="click"  to any button/link

   HOW TO ADD YOUR OWN SOUNDS
   ---------------------------------------------------------------
   1. Drop your .mp3 or .wav file into assets/audio/sfx/ or .../bgm/
   2. Add it to the MANIFEST below (or just overwrite one of the
      existing placeholder filenames — zero code changes needed).
   3. Call MiniverseAudio.playSfx('yourKey') / .playBgm('yourKey').

   Browsers block audio with sound until the user has interacted with
   the page at least once. This module already handles that: if
   playBgm() is blocked, it auto-retries on the next click/keypress/tap.
   ===================================================================== */
(function (root) {
  'use strict';

  var LS_MUTE_KEY = 'miniverse_audio_muted_v1';

  /* Filenames are relative to the audio folder — resolved against
     `basePath` passed into init() (pages nested under /games/.. need
     a basePath like '../../' to reach the project root). */
  var MANIFEST = {
    sfx: {
      correct: 'assets/audio/sfx/correct.wav',
      wrong:   'assets/audio/sfx/wrong.wav',
      click:   'assets/audio/sfx/click.wav',
    },
    bgm: {
      lobby: 'assets/audio/bgm/lobby.wav',
    },
  };

  var state = {
    basePath:  '',
    muted:     localStorage.getItem(LS_MUTE_KEY) === '1',
    sfxVolume: 0.55,
    bgmVolume: 0.32,
    bgmKey:    null,
    bgmEl:     null,
    pools:     {},   // name -> { items:[Audio], idx:0 }
    ready:     false,
  };

  function resolve(relPath) {
    return state.basePath + relPath;
  }

  /* Pool a few <audio> instances per SFX so rapid repeats
     (e.g. mashing the D-pad) can overlap instead of cutting off. */
  function preloadSfx(name, path, poolSize) {
    var items = [];
    for (var i = 0; i < poolSize; i++) {
      var a = new Audio(resolve(path));
      a.preload = 'auto';
      items.push(a);
    }
    state.pools[name] = { items: items, idx: 0 };
  }

  function playSfx(name) {
    if (state.muted) return;
    var entry = state.pools[name];
    if (!entry) {
      console.warn('[MiniverseAudio] Unknown sfx key:', name);
      return;
    }
    var a = entry.items[entry.idx];
    entry.idx = (entry.idx + 1) % entry.items.length;
    try {
      a.currentTime = 0;
      a.volume = state.sfxVolume;
      var p = a.play();
      if (p && p.catch) p.catch(function () { /* needs a user gesture first — ignore */ });
    } catch (e) { /* ignore */ }
  }

  function armAutoplayRetry(audioEl) {
    var resume = function () {
      audioEl.play().catch(function () {});
      document.removeEventListener('click', resume);
      document.removeEventListener('keydown', resume);
      document.removeEventListener('touchstart', resume);
    };
    document.addEventListener('click', resume, { once: true });
    document.addEventListener('keydown', resume, { once: true });
    document.addEventListener('touchstart', resume, { once: true });
  }

  function playBgm(name, opts) {
    opts = opts || {};
    var path = MANIFEST.bgm[name];
    if (!path) {
      console.warn('[MiniverseAudio] Unknown bgm key:', name);
      return;
    }
    if (state.bgmKey === name && state.bgmEl) return; // already playing this track
    stopBgm();

    var audio = new Audio(resolve(path));
    audio.loop   = opts.loop !== false;
    audio.volume = state.muted ? 0 : (opts.volume != null ? opts.volume : state.bgmVolume);
    state.bgmEl  = audio;
    state.bgmKey = name;

    var p = audio.play();
    if (p && p.catch) p.catch(function () { armAutoplayRetry(audio); });
  }

  function stopBgm() {
    if (state.bgmEl) {
      state.bgmEl.pause();
      state.bgmEl = null;
      state.bgmKey = null;
    }
  }

  function setMuted(muted) {
    state.muted = muted;
    try { localStorage.setItem(LS_MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
    if (state.bgmEl) state.bgmEl.volume = muted ? 0 : state.bgmVolume;
    document.dispatchEvent(new CustomEvent('miniverse-audio-mute', { detail: { muted: muted } }));
  }

  function toggleMute() {
    setMuted(!state.muted);
    return state.muted;
  }

  /* Delegated listener: any element with data-sfx="click" (or any other
     sfx key) plays that sound on click. Add the attribute to a button
     or link and it Just Works — no per-button JS needed. */
  function bindDelegatedClicks() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest('[data-sfx]');
      if (!el) return;
      playSfx(el.getAttribute('data-sfx'));
    });
  }

  function init(opts) {
    if (state.ready) return; // safe to call init() more than once per page
    opts = opts || {};
    state.basePath = opts.basePath || '';
    Object.keys(MANIFEST.sfx).forEach(function (name) {
      preloadSfx(name, MANIFEST.sfx[name], 3);
    });
    bindDelegatedClicks();
    state.ready = true;
  }

  root.MiniverseAudio = {
    init:       init,
    playSfx:    playSfx,
    playBgm:    playBgm,
    stopBgm:    stopBgm,
    toggleMute: toggleMute,
    isMuted:    function () { return state.muted; },
  };

}(window));
