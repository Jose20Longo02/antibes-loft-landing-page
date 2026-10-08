(function () {
  'use strict';

  const header = document.getElementById('site-header');
  const hero = document.getElementById('hero') || document.querySelector('.thank-you__hero');
  const navToggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');

  /* Header: transparent on hero, solid on scroll */
  function updateHeader() {
    if (!header || !hero) return;
    const heroBottom = hero.offsetTop + hero.offsetHeight;
    const scrolled = window.scrollY > 80;
    const pastHero = window.scrollY > heroBottom - 120;

    header.classList.toggle('site-header--solid', scrolled);
    header.classList.toggle('site-header--hero', !pastHero);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  /* Mobile shortcut to the form. Hidden over the hero, the open menu, and the form itself. */
  const mobileCta = document.querySelector('[data-mobile-cta]');
  const presentation = document.getElementById('presentation-form') || document.getElementById('presentation');
  let presentationVisible = false;

  function updateMobileCta() {
    if (!mobileCta || !hero) return;
    const menuOpen = nav && nav.classList.contains('is-open');
    const pastHero = window.scrollY > hero.offsetHeight * 0.72;
    mobileCta.classList.toggle('is-hidden', menuOpen || presentationVisible || !pastHero);
  }

  if (mobileCta && presentation && 'IntersectionObserver' in window) {
    const presentationObserver = new IntersectionObserver((entries) => {
      presentationVisible = entries.some((entry) => entry.isIntersecting);
      updateMobileCta();
    }, { rootMargin: '0px 0px 88px 0px', threshold: 0 });
    presentationObserver.observe(presentation);
  }

  updateMobileCta();
  window.addEventListener('scroll', updateMobileCta, { passive: true });

  /* Mobile nav */
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      if (typeof updateMobileCta === 'function') updateMobileCta();
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        updateMobileCta();
      });
    });
  }

  /* Smooth in-page navigation, including ?intent=dossier#presentation */
  document.querySelectorAll('a[href*="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http')) return;
      const hashIndex = href.indexOf('#');
      const id = href.slice(hashIndex + 1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const query = href.slice(0, hashIndex);
      if (query.startsWith('?')) {
        const url = new URL(window.location.href);
        new URLSearchParams(query).forEach((value, key) => url.searchParams.set(key, value));
        url.hash = href.slice(hashIndex);
        history.replaceState(null, '', url);
        window.dispatchEvent(new Event('inquiry-intent'));
      }
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* Scroll reveal */
  function revealOnIntersect(elements, options) {
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        requestAnimationFrame(() => {
          el.classList.add('is-visible');
        });
        observer.unobserve(el);
      });
    }, options);

    elements.forEach((el) => observer.observe(el));
  }

  const experienceSection = document.getElementById('experience');
  const experienceItems = experienceSection
    ? [...experienceSection.querySelectorAll('.experience-item.reveal')]
    : [];
  const experienceIntro = experienceSection?.querySelector('.section__intro.reveal');

  const generalReveals = [...document.querySelectorAll('.reveal')].filter(
    (el) => !el.classList.contains('experience-item')
  );

  revealOnIntersect(generalReveals, {
    rootMargin: '0px 0px -5% 0px',
    threshold: 0.1,
  });

  revealOnIntersect([experienceIntro, ...experienceItems].filter(Boolean), {
    rootMargin: '0px 0px 0px 0px',
    threshold: 0.06,
  });

  if (header && document.querySelector('.thank-you__hero, #hero')) {
    header.classList.add('site-header--hero');
  }
})();
