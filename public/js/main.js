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

  /* Mobile nav */
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Smooth in-page navigation */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
