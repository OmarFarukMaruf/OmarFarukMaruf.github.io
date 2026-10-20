/* ============================================================
   Omar Faruk Maruf — Portfolio interactions
   The dial is an SVG navigation control; GSAP animates its rotor.
   ============================================================ */
(() => {
  'use strict';

  // Guard against accidental duplicate script tags reinitializing scroll and reveal effects.
  if (window.__marufPortfolioInitialized) return;
  window.__marufPortfolioInitialized = true;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', () => {
    if (document.documentElement.dataset.portfolioInitialized === 'true') return;
    document.documentElement.dataset.portfolioInitialized = 'true';
    setCurrentYear();
    initThemeToggle();
    initScrollSpy();
    initReveal();
    initTypewriter();
    animateDialEntrance();
  });

  /* ---------- Persistent light/dark theme toggle ---------- */
  function initThemeToggle() {
    const button = document.getElementById('themeToggle');
    const icon = document.getElementById('themeToggleIcon');
    if (!button) return;

    const root = document.documentElement;

    function syncThemeControl() {
      const isDark = root.dataset.theme === 'dark';
      button.setAttribute('aria-pressed', String(isDark));
      const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      button.title = label;
      button.setAttribute('aria-label', label);
      if (icon) icon.textContent = isDark ? '☀' : '☾';
    }

    button.addEventListener('click', () => {
      const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = nextTheme;
      try {
        localStorage.setItem('portfolio-theme', nextTheme);
      } catch {
        // Theme switching still works in sessions where storage is unavailable.
      }
      syncThemeControl();
    });

    syncThemeControl();
  }

  function setCurrentYear() {
    const year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ---------- Section dial + scroll-spy ---------- */
  function initScrollSpy() {
    const listLinks = Array.from(document.querySelectorAll('.nav-list a[href^="#"]'));
    const allLinks = Array.from(document.querySelectorAll('.nav a[href^="#"]'));
    const rotor = document.getElementById('dialRotor');
    const readoutIndex = document.getElementById('dialReadoutIndex');
    const readoutName = document.getElementById('dialReadoutName');
    if (!listLinks.length) return;

    const sections = listLinks
      .map((link, index) => ({
        link,
        index,
        label: link.textContent.trim(),
        section: document.querySelector(link.getAttribute('href'))
      }))
      .filter(item => item.section);
    if (!sections.length) return;

    // The SVG's first label starts at -90 degrees. A right-facing fixed pointer
    // means the rotor starts at +90 degrees and turns 40 degrees per section.
    const anglePerSection = 360 / sections.length;
    let activeHref = null;
    let rotorRotation = 90;
    let audioContext = null;
    let soundEnabled = false;

    const soundButton = document.getElementById('dialSoundToggle');
    const soundLabel = document.getElementById('dialSoundLabel');

    function playTick() {
      if (!soundEnabled || !audioContext || audioContext.state !== 'running') return;
      const now = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const volume = audioContext.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(1180, now);
      oscillator.frequency.exponentialRampToValueAtTime(610, now + 0.025);
      volume.gain.setValueAtTime(0.0001, now);
      volume.gain.exponentialRampToValueAtTime(0.035, now + 0.003);
      volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      oscillator.connect(volume);
      volume.connect(audioContext.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.04);
    }

    function setRotor(index, shouldAnimate) {
      if (!rotor) return;
      const desired = ((90 - index * anglePerSection) % 360 + 360) % 360;
      const current = ((rotorRotation % 360) + 360) % 360;
      const delta = ((desired - current + 540) % 360) - 180;
      rotorRotation += delta;

      if (window.gsap && shouldAnimate && !reducedMotion) {
        window.gsap.to(rotor, {
          rotation: rotorRotation,
          svgOrigin: '160 160',
          duration: 0.62,
          ease: 'power3.out',
          overwrite: true
        });
      } else {
        if (window.gsap) window.gsap.set(rotor, { rotation: rotorRotation, svgOrigin: '160 160' });
        else rotor.setAttribute('transform', `rotate(${rotorRotation} 160 160)`);
      }
    }

    function setActive(item, { animate = true, sound = true } = {}) {
      if (!item) return;
      const href = item.link.getAttribute('href');
      if (href === activeHref) return;
      const hadActive = activeHref !== null;
      activeHref = href;

      allLinks.forEach(link => {
        const isActive = link.getAttribute('href') === href;
        link.classList.toggle('active', isActive);
        link.classList.toggle('is-active', isActive && link.classList.contains('dial-link'));
        if (isActive) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });

      if (readoutIndex) readoutIndex.textContent = String(item.index + 1).padStart(2, '0');
      if (readoutName) typeReadoutLabel(readoutName, item.label, animate && hadActive);
      setRotor(item.index, animate && hadActive);
      keepNavLinkInView(item.link);
      if (sound && hadActive) playTick();
    }

    function updateActiveFromScroll() {
      const activationLine = window.scrollY + window.innerHeight * 0.3;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 36;
      if (atBottom) {
        setActive(sections[sections.length - 1]);
        return;
      }
      let match = sections[0];
      for (const item of sections) {
        if (item.section.getBoundingClientRect().top + window.scrollY <= activationLine) match = item;
      }
      setActive(match);
    }

    // Use one canonical target per section, while both SVG and mobile links work.
    allLinks.forEach(link => {
      link.addEventListener('click', event => {
        const item = sections.find(section => section.link.getAttribute('href') === link.getAttribute('href'));
        if (!item) return;
        event.preventDefault();
        setActive(item, { animate: true, sound: true });
        const offset = stickyNavOffset();
        const top = item.section.getBoundingClientRect().top + window.scrollY - offset - 8;
        window.scrollTo({ top: Math.max(top, 0), behavior: reducedMotion ? 'auto' : 'smooth' });
        history.replaceState(null, '', link.getAttribute('href'));
      });
    });

    let ticking = false;
    const onScrollOrResize = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        updateActiveFromScroll();
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    initDialSound();
    updateActiveFromScroll();

    function keepNavLinkInView(link) {
      const list = link.closest('.nav-list');
      if (!list || list.scrollWidth <= list.clientWidth) return;
      const linkBox = link.getBoundingClientRect();
      const listBox = list.getBoundingClientRect();
      if (linkBox.left < listBox.left || linkBox.right > listBox.right) {
        list.scrollTo({
          left: list.scrollLeft + (linkBox.left - listBox.left) - 24,
          behavior: reducedMotion ? 'auto' : 'smooth'
        });
      }
    }

    function stickyNavOffset() {
      const nav = document.querySelector('.nav');
      return nav && getComputedStyle(nav).position === 'sticky' ? nav.offsetHeight : 0;
    }

    function initDialSound() {
      if (!soundButton) return;
      soundButton.addEventListener('click', () => {
        const next = soundButton.getAttribute('aria-pressed') !== 'true';
        soundEnabled = next;
        if (next) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            audioContext = audioContext || new AudioContextClass();
            if (audioContext.state === 'suspended') audioContext.resume();
          } else {
            soundEnabled = false;
          }
        }
        soundButton.setAttribute('aria-pressed', String(soundEnabled));
        soundButton.setAttribute('aria-label', soundEnabled ? 'Disable section dial click sound' : 'Enable section dial click sound');
        if (soundLabel) soundLabel.textContent = soundEnabled ? 'Sound On' : 'Sound Off';
      });
    }
  }

  /* ---------- Typewriter text treatment ---------- */
  function initTypewriter() {
    // Keep headings untouched if animation APIs are unavailable or reduced
    // motion is requested; the content must never depend on this effect.
    if (reducedMotion || !window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);

    document.querySelectorAll('.section-title').forEach(title => {
      if (title.dataset.typed === 'true') return;
      const original = title.textContent.trim();
      if (!original) return;

      // Keep a complete, stable accessible name while animating decorative glyphs.
      title.setAttribute('aria-label', original);
      title.dataset.typed = 'true';
      const fragment = document.createDocumentFragment();
      const glyphs = Array.from(original, character => {
        const glyph = document.createElement('span');
        glyph.className = 'type-char';
        glyph.setAttribute('aria-hidden', 'true');
        glyph.textContent = character === ' ' ? '\u00a0' : character;
        fragment.appendChild(glyph);
        return glyph;
      });
      title.replaceChildren(fragment);

      window.gsap.set(glyphs, { autoAlpha: 0, y: 2 });
      window.gsap.to(glyphs, {
        autoAlpha: 1,
        y: 0,
        duration: 0.04,
        stagger: 0.082,
        ease: 'none',
        scrollTrigger: {
          trigger: title,
          start: 'top 88%',
          once: true
        }
      });
    });
  }

  function typeReadoutLabel(element, text, animate) {
    if (!element) return;
    if (!animate || reducedMotion || !window.gsap) {
      element.textContent = text;
      return;
    }

    // A short stepped reveal gives the mechanical tuner a matching typewriter
    // readout without repeatedly rebuilding the rest of the navigation.
    const state = { value: 0 };
    const characters = Array.from(text);
    if (element._typewriterTween) element._typewriterTween.kill();
    element.textContent = '';
    element._typewriterTween = window.gsap.to(state, {
      value: characters.length,
      duration: Math.min(1.25, Math.max(0.45, characters.length * 0.085)),
      ease: `steps(${Math.max(1, characters.length)})`,
      onUpdate: () => {
        element.textContent = characters.slice(0, Math.floor(state.value)).join('');
      },
      onComplete: () => {
        element.textContent = text;
        element._typewriterTween = null;
      }
    });
  }

  /* ---------- Optional GSAP entrance for the dial ---------- */
  function animateDialEntrance() {
    const widget = document.querySelector('.dial-widget');
    if (!widget || reducedMotion || !window.gsap) return;
    window.gsap.fromTo(widget,
      { autoAlpha: 0, y: 12 },
      { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out', clearProps: 'opacity,visibility,transform' }
    );
  }

  /* ---------- Reveal content on scroll ---------- */
  function initReveal() {
    const items = Array.from(document.querySelectorAll('.reveal'));
    if (!items.length) return;
    if (reducedMotion) {
      items.forEach(item => item.classList.add('is-visible'));
      return;
    }

    if (window.gsap && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      items.forEach((item, index) => {
        // Guard against duplicate ScrollTriggers if initReveal is ever called again.
        if (item.dataset.revealInitialized === 'true') return;
        item.dataset.revealInitialized = 'true';
        window.gsap.fromTo(item,
          { autoAlpha: 0, y: 16 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.62,
            delay: Math.min(index % 3, 2) * 0.04,
            ease: 'power2.out',
            scrollTrigger: { trigger: item, start: 'top 88%', once: true, toggleActions: 'play none none none' },
            immediateRender: false,
            onComplete: () => item.classList.add('is-visible')
          }
        );
      });
      return;
    }

    // Fallback if the CDN or ScrollTrigger is unavailable.
    if (!('IntersectionObserver' in window)) {
      items.forEach(item => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        instance.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(item => observer.observe(item));
    window.setTimeout(() => items.forEach(item => item.classList.add('is-visible')), 3000);
  }

  // Footer wordmark entrance
  function initFooterAnimation() {
    const footer = document.querySelector('#site-footer');
    const wordmark = footer?.querySelector('.footer-wordmark');

    if (!footer || !wordmark ) return;
    if (!window.gsap || !window.ScrollTrigger) return;

    // Respect the visitor's motion preference.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }
    
    const gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);

    if (wordmark.dataset.animated === 'true') return;
    wordmark.dataset.animated = 'true';
    
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: footer,
        start: 'top 85%',
        end: 'top 50%',
        scrub: 0.5,
      }
    });

    timeline.fromTo(wordmark, 
      { 
        yPercent: 115, 
        scale: 0.72, 
        autoAlpha: 0 
      },
      { 
        yPercent: -4, 
        scale: 1.12, 
        autoAlpha: 1, 
        duration: 0.48, 
        ease: "bounce.out" }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initFooterAnimation,
      { once: true }
    );
  } else {
    initFooterAnimation();
  }

})();
