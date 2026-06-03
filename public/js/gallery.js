(function () {
  'use strict';

  const mosaic = document.querySelector('[data-gallery-mosaic]');
  const lightbox = document.getElementById('lightbox');
  if (!mosaic || !lightbox) return;

  const items = [...mosaic.querySelectorAll('[data-gallery-index]')];
  const imgEl = lightbox.querySelector('.lightbox__image');
  const captionEl = lightbox.querySelector('[data-lightbox-caption]');
  const closeBtn = lightbox.querySelector('[data-lightbox-close]');
  const prevBtn = lightbox.querySelector('[data-lightbox-prev]');
  const nextBtn = lightbox.querySelector('[data-lightbox-next]');

  let currentIndex = 0;

  function open(index) {
    currentIndex = index;
    showSlide();
    lightbox.hidden = false;
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lightbox-open');
  }

  function close() {
    lightbox.hidden = true;
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lightbox-open');
  }

  function showSlide() {
    const item = items[currentIndex];
    if (!item) return;
    imgEl.src = item.dataset.src || item.querySelector('img')?.src || '';
    imgEl.alt = item.dataset.alt || '';
    captionEl.textContent = item.dataset.alt || '';
  }

  function step(dir) {
    currentIndex = (currentIndex + dir + items.length) % items.length;
    showSlide();
  }

  items.forEach((item, index) => {
    item.addEventListener('click', () => open(index));
  });

  closeBtn?.addEventListener('click', close);
  prevBtn?.addEventListener('click', () => step(-1));
  nextBtn?.addEventListener('click', () => step(1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
})();
