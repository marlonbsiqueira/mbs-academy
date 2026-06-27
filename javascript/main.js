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

  /* ── Course filter buttons (catalog page) ── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Future: implement actual filtering logic here
        // For now, all cards remain visible
      });
    });
  }

  /* ── Module accordion ── */
  document.querySelectorAll('.module-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.module-item-block');
      if (!item) return;
      // Close others (optional — comment out for multi-open behavior)
      // document.querySelectorAll('.module-item-block.open').forEach(openItem => {
      //   if (openItem !== item) openItem.classList.remove('open');
      // });
      item.classList.toggle('open');
    });
  });

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  /* ── Active nav link highlighting ── */
  // Mark the current page's nav link as active based on URL
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && (
      currentPath.endsWith(href) ||
      (href !== '../index.html' && href !== 'index.html' && currentPath.includes(href.replace('../', '').replace('.html', '')))
    )) {
      link.classList.add('active');
    }
  });

});
