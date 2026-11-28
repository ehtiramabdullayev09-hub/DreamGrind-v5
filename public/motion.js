/* DreamGrind motion system: lightweight, progressive enhancement only. */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const root = document.documentElement;

  // Keep content visible by default. Only add the reveal state when observation is supported.
  if (!reducedMotion && 'IntersectionObserver' in window) {
    root.classList.add('dg-motion-ready');

    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      });
    }, {
      root: null,
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.12
    });

    document.querySelectorAll([
      '.section-heading',
      '.category-card',
      '.product-card',
      '.dg-edit-heading',
      '.dg-edit-collection',
      '.about-points > div',
      '.contact-option',
      '.track-card',
      '.newsletter-card'
    ].join(',')).forEach((element, index) => {
      // Small stagger, capped to avoid long waits on large catalogues.
      element.style.setProperty('--dg-reveal-delay', Math.min(index % 4, 3) * 55 + 'ms');
      element.classList.add('dg-reveal');
      observer.observe(element);
    });
  }

  // The pointer response is decorative and deliberately limited to the desktop hero.
  const hero = document.querySelector('.hero-brand-art');
  const canHover = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;
  if (hero && canHover && !reducedMotion) {
    let frame = 0;
    hero.addEventListener('pointermove', (event) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
        hero.style.setProperty('--dg-pointer-x', (x * 3).toFixed(2) + 'px');
        hero.style.setProperty('--dg-pointer-y', (y * 3).toFixed(2) + 'px');
        frame = 0;
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      hero.style.setProperty('--dg-pointer-x', '0px');
      hero.style.setProperty('--dg-pointer-y', '0px');
    }, { passive: true });
  }

  // Native scroll-driven reveal is progressive enhancement, not a dependency.
  if (!reducedMotion && CSS.supports?.('(animation-timeline: view()) and (animation-range: entry)')) {
    root.classList.add('dg-native-scroll-motion');
  }

  // Optional viral-motion layer. Keep the existing reveal/hero effects independent.
  if (!reducedMotion) {
    const addonVersion = '20261128-viral-motion-v2';
    const addonCss = document.createElement('link');
    addonCss.rel = 'stylesheet';
    addonCss.href = '/viral-motion.css?v=' + addonVersion;
    document.head.appendChild(addonCss);

    const addonJs = document.createElement('script');
    addonJs.src = '/viral-motion.js?v=' + addonVersion;
    addonJs.async = true;
    document.body.appendChild(addonJs);
  }
})();
