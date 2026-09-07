/* ============================================================
   Omar Faruk Maruf — Portfolio
   ============================================================ */
(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    setCurrentYear();
    initScrollSpy();
    initReveal();
  });

  /* ---------- Footer year ---------- */
  function setCurrentYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- Scroll-spy + smooth scrolling ---------- */
  function initScrollSpy() {
    const links = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
    if (!links.length) return;

    const targets = links
      .map(link => ({ link, section: document.querySelector(link.getAttribute('href')) }))
      .filter(t => t.section);

    let current = null;

    const setActive = entry => {
      if (!entry || entry.link === current) return;
      links.forEach(l => {
        l.classList.remove('active');
        l.removeAttribute('aria-current');
      });
      entry.link.classList.add('active');
      entry.link.setAttribute('aria-current', 'true');
      current = entry.link;
      keepNavLinkInView(entry.link);
    };

    const update = () => {
      // Activation line sits ~30% down the viewport.
      const line = window.scrollY + window.innerHeight * 0.3;
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 40;

      if (atBottom) {
        setActive(targets[targets.length - 1]);
        return;
      }

      let match = targets[0];
      for (const t of targets) {
        if (t.section.offsetTop <= line) match = t;
      }
      setActive(match);
    };

    // rAF-throttled scroll handler
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    // Smooth scroll that respects the sticky mobile nav offset
    targets.forEach(({ link, section }) => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const offset = stickyNavOffset();
        const top = section.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
          top: Math.max(top, 0),
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });

        // Keep the URL shareable without triggering a jump
        history.replaceState(null, '', link.getAttribute('href'));
      });
    });
  }

  /* The nav is only sticky (overlaying content) on narrow viewports. */
  function stickyNavOffset() {
    const nav = document.querySelector('.nav');
    if (!nav) return 0;
    return getComputedStyle(nav).position === 'sticky' ? nav.offsetHeight : 0;
  }

  /* Scroll the active pill into view in the horizontal mobile nav. */
  function keepNavLinkInView(link) {
    const list = link.closest('ul');
    if (!list || list.scrollWidth <= list.clientWidth) return;

    const linkBox = link.getBoundingClientRect();
    const listBox = list.getBoundingClientRect();

    if (linkBox.left < listBox.left || linkBox.right > listBox.right) {
      list.scrollTo({
        left: list.scrollLeft + (linkBox.left - listBox.left) - 24,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    }
  }

  /* ---------- Reveal on scroll ---------- */
  function initReveal() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );

    items.forEach(el => observer.observe(el));

    // Safety net: never leave content hidden if something goes wrong.
    window.setTimeout(() => {
      items.forEach(el => el.classList.add('is-visible'));
    }, 3000);
  }
})();
