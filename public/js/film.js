(function () {
  'use strict';

  const figure = document.querySelector('[data-film]');
  if (!figure) return;

  const video = figure.querySelector('.film__video');
  const playBtn = figure.querySelector('[data-film-play]');
  const muteBtn = figure.querySelector('[data-film-mute]');
  const frame = figure.querySelector('.film__frame');

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
