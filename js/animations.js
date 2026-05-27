/* ════════════════════════════════════════════════════════════
   TRIPLE A HORSES — shared animation library
   - Scroll-triggered fade-in-up reveals (with stagger)
   - Animated counters for big numbers
   - Subtle parallax on .has-parallax images
   - Cart drawer & wishlist toggles
   - Smooth-scroll anchor links
   ════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  /* ── 1. Scroll-triggered reveals ───────────────────── */
  const revealEls = document.querySelectorAll(
    '[data-reveal], .reveal, .reveal-stagger > *'
  );

  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger children inside a .reveal-stagger parent
          const parent = entry.target.parentElement;
          const isStaggerChild = parent && parent.classList.contains('reveal-stagger');
          const idx = isStaggerChild
            ? Array.prototype.indexOf.call(parent.children, entry.target)
            : 0;
          const delay = isStaggerChild ? idx * 80 : 0;
          setTimeout(() => entry.target.classList.add('is-in'), delay);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }

  /* ── 2. Animated counters ──────────────────────────── */
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.dataset.count);
          const decimals = parseInt(el.dataset.decimals || '0', 10);
          const duration = parseInt(el.dataset.duration || '1600', 10);
          const prefix = el.dataset.prefix || '';
          const suffix = el.dataset.suffix || '';
          const start = performance.now();
          const tick = (now) => {
            const elapsed = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - elapsed, 3);
            const val = target * eased;
            el.textContent = prefix + val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
            if (elapsed < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          co.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(el => co.observe(el));
  }

  /* ── 3. Subtle parallax on hero/feature images ─────── */
  const parallaxEls = document.querySelectorAll('.has-parallax');
  if (parallaxEls.length && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      parallaxEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax || '0.18');
        const rect = el.getBoundingClientRect();
        const inView = rect.bottom > 0 && rect.top < window.innerHeight;
        if (inView) {
          el.style.transform = `translate3d(0, ${y * speed * 0.1}px, 0)`;
        }
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ── 4. Cart drawer + wishlist toggle ──────────────── */
  const cartState = { items: [] };

  const updateCartChip = () => {
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = cartState.items.length;
      el.classList.toggle('has-items', cartState.items.length > 0);
    });
  };

  const renderCart = () => {
    const list = document.querySelector('[data-cart-list]');
    if (!list) return;
    if (!cartState.items.length) {
      list.innerHTML = `<li class="cart-empty">Your enquiry list is empty.<br/><small>Add horses you wish to buy or lease.</small></li>`;
      return;
    }
    list.innerHTML = cartState.items.map(it => `
      <li class="cart-item">
        <span class="cart-item__name">${it.name}</span>
        <span class="cart-item__intent">${it.intent}</span>
        <span class="cart-item__price">${it.price}</span>
        <button class="cart-item__remove" data-cart-remove="${it.id}" aria-label="Remove">×</button>
      </li>
    `).join('');
    list.querySelectorAll('[data-cart-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.cartRemove;
        cartState.items = cartState.items.filter(i => i.id !== id);
        renderCart(); updateCartChip();
      });
    });
  };

  document.body.addEventListener('click', (e) => {
    const buyBtn = e.target.closest('[data-buy]');
    const leaseBtn = e.target.closest('[data-lease]');
    const wishBtn = e.target.closest('[data-wish]');
    if (buyBtn || leaseBtn) {
      e.preventDefault();
      const card = (buyBtn || leaseBtn).closest('[data-horse-id]');
      if (!card) return;
      const id = card.dataset.horseId;
      const name = card.dataset.horseName || 'Horse';
      const price = card.dataset.horsePrice || 'POA';
      const intent = buyBtn ? 'Buy' : 'Lease';
      const exists = cartState.items.find(i => i.id === id && i.intent === intent);
      if (!exists) cartState.items.push({ id, name, price, intent });
      updateCartChip();
      renderCart();
      // open drawer
      const drawer = document.querySelector('[data-cart-drawer]');
      if (drawer) drawer.classList.add('is-open');
      // ripple feedback on button
      (buyBtn || leaseBtn).classList.add('is-added');
      setTimeout(() => (buyBtn || leaseBtn).classList.remove('is-added'), 900);
    }
    if (wishBtn) {
      e.preventDefault();
      wishBtn.classList.toggle('is-on');
    }
    if (e.target.closest('[data-cart-open]')) {
      e.preventDefault();
      document.querySelector('[data-cart-drawer]')?.classList.add('is-open');
    }
    if (e.target.closest('[data-cart-close]') || e.target.matches('[data-cart-backdrop]')) {
      document.querySelector('[data-cart-drawer]')?.classList.remove('is-open');
    }
  });

  /* ── 5. Smooth-scroll for in-page anchors ─────────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length > 1 && document.querySelector(id)) {
        e.preventDefault();
        document.querySelector(id).scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── 6. Hero entrance class hook ──────────────────── */
  document.documentElement.classList.add('js-ready');
  requestAnimationFrame(() => {
    document.querySelectorAll('.hero, .masthead, .nav, .top').forEach(el => el.classList.add('is-in'));
  });

  /* ── 7. Subtle cursor halo on card hover (touchless) */
  if (matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-tilt]').forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--tx', `${x * 4}px`);
        el.style.setProperty('--ty', `${y * 4}px`);
      });
      el.addEventListener('mouseleave', () => {
        el.style.setProperty('--tx', '0px');
        el.style.setProperty('--ty', '0px');
      });
    });
  }

  /* ── 8. Sticky nav shadow on scroll ───────────────── */
  let lastY = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    document.querySelectorAll('.nav, .masthead').forEach(el => {
      el.classList.toggle('is-scrolled', y > 24);
    });
    lastY = y;
  }, { passive: true });

})();
