/* ══════════════════════════════════════════════
   MBS ACADEMY — Main JavaScript
   ══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Sticky header scroll effect ── */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Mobile navigation toggle ── */
  const mobileToggle = document.getElementById('mobile-toggle');
  const navInner = document.querySelector('.nav-inner');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navInner && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navInner.classList.toggle('menu-open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
      mobileToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');

      // Animate hamburger to X
      const spans = mobileToggle.querySelectorAll('span');
      if (isOpen) {
        spans[0].style.transform = 'translateY(6.5px) rotate(45deg)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
      } else {
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });

    // Close menu when a nav link is clicked
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navInner.classList.remove('menu-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        const spans = mobileToggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      });
    });

    // Close with Escape and return focus to the toggle
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !navInner.classList.contains('menu-open')) return;
      mobileToggle.click();
      mobileToggle.focus();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!navInner.contains(e.target) && navInner.classList.contains('menu-open')) {
        navInner.classList.remove('menu-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        const spans = mobileToggle.querySelectorAll('span');
        spans[0].style.transform = '';
        spans[1].style.opacity = '';
        spans[2].style.transform = '';
      }
    });
  }

  /* ── Scroll reveal ── */
  const revealElements = document.querySelectorAll('.reveal');

  if (revealElements.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        // Stagger siblings
        const parent = entry.target.parentElement;
        const siblings = parent ? [...parent.querySelectorAll('.reveal:not(.show)')] : [];
        const idx = siblings.indexOf(entry.target);
        const delay = Math.max(0, Math.min(idx * 80, 320));
        setTimeout(() => {
          entry.target.classList.add('show');
        }, delay);
        obs.unobserve(entry.target);
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    // Fallback: show all immediately
    revealElements.forEach(el => el.classList.add('show'));
  }

  /* ── Course filter buttons (catalog page) ──
     Each button has data-filter; each card lists its areas in data-cat
     (e.g. data-cat="sap finance"). "all" shows every card. */
  const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
  const catalogCards = document.querySelectorAll('[data-cat]');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      filterBtns.forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-pressed', String(b === btn));
      });
      catalogCards.forEach(card => {
        const show = f === 'all' || card.dataset.cat.split(' ').includes(f);
        card.hidden = !show;
        if (show) card.classList.add('show'); // skip the scroll-reveal for re-shown cards
      });
    });
  });

  /* ── Module accordion (keyboard + screen-reader friendly) ── */
  document.querySelectorAll('.module-header').forEach(header => {
    const item = header.closest('.module-item-block');
    if (!item) return;
    header.setAttribute('role', 'button');
    header.tabIndex = 0;
    header.setAttribute('aria-expanded', String(item.classList.contains('open')));
    const toggle = () => {
      const open = item.classList.toggle('open');
      header.setAttribute('aria-expanded', String(open));
    };
    header.addEventListener('click', toggle);
    header.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        history.pushState(null, '', link.getAttribute('href')); // keep the section linkable
      }
    });
  });

  /* ── Image lazy loading fallback ── */
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.opacity = '0';
      img.setAttribute('aria-hidden', 'true');
    });
  });

  /* ── Active nav link highlighting ──
     Compare resolved URLs, so it works from any folder depth. */
  const here = new URL(window.location.href);
  const normalise = p => p.replace(/index\.html$/, '');
  document.querySelectorAll('.nav-link[href]').forEach(link => {
    const target = new URL(link.getAttribute('href'), here);
    if (normalise(target.pathname) === normalise(here.pathname)) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ── Contact form: send in place with a status message ──
     Posts to the Web3Forms API; without JS the normal POST still works. */
  document.querySelectorAll('form.js-ajax-form').forEach(form => {
    if (!window.fetch) return;
    const status = form.querySelector('.form-status');
    const button = form.querySelector('[type="submit"]');
    const pt = document.documentElement.lang === 'pt';
    const MSG = {
      sending: pt ? 'A enviar…' : 'Sending…',
      ok: pt ? 'Obrigado — a sua mensagem foi enviada.' : 'Thank you — your message has been sent.',
      error: pt ? 'Não foi possível enviar. Tente novamente ou escreva para email-removed.'
                : 'Sorry, the message could not be sent. Please try again or email email-removed.',
    };
    const show = (text, isError) => {
      if (!status) return;
      status.hidden = false; status.textContent = text;
      status.classList.toggle('is-error', !!isError);
    };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.elements.botcheck && form.elements.botcheck.checked) return; // bot
      button.disabled = true;
      show(MSG.sending);
      try {
        const res = await fetch(form.action, {
          method: 'POST', headers: { Accept: 'application/json' },
          body: new FormData(form),
          signal: AbortSignal.timeout ? AbortSignal.timeout(20000) : undefined, // never hang on "sending"
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || String(data.success) !== 'true') throw new Error(data.message || res.status);
        form.reset();
        show(MSG.ok);
      } catch (err) {
        show(MSG.error, true);
      } finally {
        button.disabled = false;
      }
    });
  });

  /* ── Course cover photos come from Unsplash. If one fails (CDN down,
       blocked network) drop it so the course's own gradient cover shows,
       instead of a broken-image icon over the alt text. ── */
  document.querySelectorAll('.course-cover img').forEach(img => {
    const drop = () => img.remove();
    if (img.complete && img.naturalWidth === 0) drop();
    else img.addEventListener('error', drop, { once: true });
  });

});
