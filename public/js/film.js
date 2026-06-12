(function () {
  'use strict';

  const figure = document.querySelector('[data-film]');
  if (!figure) return;

  const video = figure.querySelector('.film__video');
  const playBtn = figure.querySelector('[data-film-play]');
  const muteBtn = figure.querySelector('[data-film-mute]');
  const frame = figure.querySelector('.film__frame');
  const poster = figure.querySelector('.film__poster');

  if (!video || !playBtn) return;

  const labels = {
    play: playBtn.getAttribute('aria-label') || 'Play',
    pause: playBtn.dataset.pauseLabel || 'Pause',
    mute: muteBtn?.dataset.muteLabel || 'Mute',
    unmute: muteBtn?.getAttribute('aria-label') || 'Unmute',
  };

  if (muteBtn) {
    muteBtn.dataset.unmuteLabel = labels.unmute;
    muteBtn.dataset.muteLabel = labels.mute;
  }

  let loaded = false;
  let playing = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function pickSrc() {
    const sd = video.dataset.sd;
    const hd = video.dataset.hd;
    if (!sd) return '';

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = conn?.saveData;
    const slow =
      conn?.effectiveType === 'slow-2g' ||
      conn?.effectiveType === '2g' ||
      conn?.effectiveType === '3g';

    const wantsHd =
      window.matchMedia('(min-width: 900px)').matches && !saveData && !slow && hd;

    return wantsHd ? hd : sd;
  }

  function loadVideo() {
    if (loaded) return;
    const src = pickSrc();
    if (!src) return;
    video.src = src;
    video.load();
    loaded = true;
  }

  function setPlaying(next) {
    playing = next;
    frame.classList.toggle('is-playing', playing);
    playBtn.hidden = playing;
    if (muteBtn) muteBtn.hidden = !playing;
    playBtn.setAttribute('aria-label', playing ? labels.pause : labels.play);
  }

  function waitForFrame() {
    if (video.readyState >= 2) return Promise.resolve();
    return new Promise((resolve) => {
      video.addEventListener('loadeddata', resolve, { once: true });
    });
  }

  function setMuted(muted) {
    video.muted = muted;
    if (!muteBtn) return;
    muteBtn.setAttribute('aria-pressed', String(muted));
    muteBtn.setAttribute(
      'aria-label',
      muted ? muteBtn.dataset.unmuteLabel || labels.unmute : muteBtn.dataset.muteLabel || labels.mute
    );
    muteBtn.classList.toggle('is-unmuted', !muted);
  }

  async function play() {
    loadVideo();
    try {
      await waitForFrame();
      await video.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  function pause() {
    video.pause();
    setPlaying(false);
  }

  playBtn.addEventListener('click', () => {
    if (playing) {
      pause();
    } else {
      play();
    }
  });

  muteBtn?.addEventListener('click', () => {
    setMuted(!video.muted);
  });

  video.addEventListener('click', () => {
    if (playing) pause();
    else play();
  });

  video.addEventListener('play', () => setPlaying(true));
  video.addEventListener('pause', () => setPlaying(false));

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            if (playing) pause();
            return;
          }
          loadVideo();
        });
      },
      { rootMargin: '120px 0px', threshold: 0.2 }
    );
    observer.observe(figure);
  }

  setMuted(true);
})();

(function () {
  'use strict';

  const root = document.querySelector('[data-film-specs]');
  if (!root) return;

  const tabs = [...root.querySelectorAll('[data-spec-tab]')];
  const stage = root.querySelector('.film__specs-stage');
  const stageLabel = root.querySelector('[data-spec-stage-label]');
  const stageValue = root.querySelector('[data-spec-stage-value]');
  const panel = document.getElementById('film-spec-panel');
  const progress = root.querySelector('[data-spec-progress]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!tabs.length || !stageLabel || !stageValue) return;

  const interval = Number(root.dataset.interval) || 5200;
  let index = 0;
  let timer = null;
  let paused = false;

  function runProgress() {
    if (!progress || reducedMotion) return;
    progress.classList.remove('is-animating');
    void progress.offsetWidth;
    progress.classList.add('is-animating');
  }

  function setActive(nextIndex) {
    index = nextIndex;
    const tab = tabs[index];

    stage?.classList.add('is-changing');
    window.setTimeout(() => {
      stageLabel.textContent = tab.dataset.label || '';
      stageValue.textContent = tab.dataset.value || '';
      if (panel) panel.textContent = `${tab.dataset.label}: ${tab.dataset.value}`;
      stage?.classList.remove('is-changing');
    }, reducedMotion ? 0 : 180);

    tabs.forEach((item, i) => {
      const active = i === index;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
    });

    runProgress();
  }

  function schedule() {
    clearInterval(timer);
    if (reducedMotion || paused) return;
    timer = window.setInterval(() => {
      setActive((index + 1) % tabs.length);
    }, interval);
  }

  function activate(nextIndex) {
    setActive(nextIndex);
    schedule();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => activate(i));
  });

  root.addEventListener('mouseenter', () => {
    paused = true;
    root.classList.add('is-paused');
    clearInterval(timer);
  });

  root.addEventListener('mouseleave', () => {
    paused = false;
    root.classList.remove('is-paused');
    schedule();
  });

  root.addEventListener('focusin', () => {
    paused = true;
    clearInterval(timer);
  });

  root.addEventListener('focusout', () => {
    if (!root.contains(document.activeElement)) {
      paused = false;
      root.classList.remove('is-paused');
      schedule();
    }
  });

  if (panel && tabs[0]) {
    panel.textContent = `${tabs[0].dataset.label}: ${tabs[0].dataset.value}`;
  }

  runProgress();
  schedule();
})();
