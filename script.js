'use strict';

// Confirms JS is actually running before CSS hides anything behind a
// scroll-reveal animation — see the .reveal / .chip rules in style.css.
document.documentElement.classList.add('js');

/* ------------------------------------------------------------------ *
 * Theme toggle (persisted, respects system preference on first load)
 * ------------------------------------------------------------------ */
(function () {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  const favicon = document.getElementById('favicon');
  const metaTheme = document.getElementById('metaThemeColor');
  if (!btn) return;

  function apply(theme) {
    root.classList.toggle('light', theme === 'light');
    btn.setAttribute('aria-checked', theme === 'light' ? 'true' : 'false');
    btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    if (favicon) favicon.setAttribute('href', theme === 'light' ? 'icon-light.svg' : 'icon.svg');
    if (metaTheme) metaTheme.setAttribute('content', theme === 'light' ? '#f3f4f7' : '#14171f');
  }

  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  // Dark is the intentional default regardless of OS preference; only an
  // explicit prior choice (saved in localStorage) overrides it.
  apply(saved || 'dark');

  btn.addEventListener('click', function () {
    const next = root.classList.contains('light') ? 'dark' : 'light';
    apply(next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
})();

/* ------------------------------------------------------------------ *
 * Mobile drawer — scroll lock + backdrop + focus handling
 * ------------------------------------------------------------------ */
(function () {
  const toggle = document.getElementById('menuToggle');
  const drawer = document.getElementById('drawer');
  const backdrop = document.getElementById('drawerBackdrop');
  if (!toggle || !drawer) return;

  function open() {
    drawer.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('menu-open');
    if (backdrop) { backdrop.hidden = false; requestAnimationFrame(() => backdrop.classList.add('open')); }
    const first = drawer.querySelector('a');
    if (first) setTimeout(() => first.focus(), 60);
  }
  function close() {
    drawer.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('menu-open');
    if (backdrop) { backdrop.classList.remove('open'); setTimeout(() => { backdrop.hidden = true; }, 260); }
  }

  toggle.addEventListener('click', () => drawer.classList.contains('open') ? close() : open());
  if (backdrop) backdrop.addEventListener('click', close);
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('open')) close(); });
})();

/* Body scroll lock while the drawer is open */
(function () {
  const style = document.createElement('style');
  style.textContent = 'html.menu-open, html.menu-open body { overflow:hidden; height:100%; }';
  document.head.appendChild(style);
})();

/* ------------------------------------------------------------------ *
 * Topbar: border on scroll, hide on scroll-down / show on scroll-up
 * ------------------------------------------------------------------ */
(function () {
  const bar = document.getElementById('topbar');
  if (!bar) return;
  let lastY = window.scrollY;
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    bar.classList.toggle('scrolled', y > 8);
    if (!document.documentElement.classList.contains('menu-open')) {
      if (y > lastY && y > 140) bar.classList.add('hide');
      else bar.classList.remove('hide');
    }
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
})();

/* ------------------------------------------------------------------ *
 * Scroll spy — nav-inline, drawer links, dock
 * ------------------------------------------------------------------ */
(function () {
  const sections = document.querySelectorAll('main > section[id]');
  if (!sections.length) return;
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      document.querySelectorAll('[data-nav]').forEach(a => a.classList.remove('active'));
      document.querySelectorAll(`[data-nav="${id}"]`).forEach(a => a.classList.add('active'));
      document.querySelectorAll('[data-dock]').forEach(a => a.classList.remove('active'));
      document.querySelectorAll(`[data-dock="${id}"]`).forEach(a => a.classList.add('active'));
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  sections.forEach(s => spy.observe(s));
})();

/* ------------------------------------------------------------------ *
 * Nav link text scramble — desktop hover only
 * ------------------------------------------------------------------ */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(pointer: coarse)').matches) return;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@#$%&*';

  function scrambleOn(el, hoverTarget) {
    const orig = el.textContent.trim();
    let timer = null;
    hoverTarget.addEventListener('mouseenter', () => {
      let iter = 0;
      clearInterval(timer);
      timer = setInterval(() => {
        el.textContent = orig.split('').map((c, i) => {
          if (c === ' ') return ' ';
          if (i < iter) return orig[i];
          return chars[Math.floor(Math.random() * chars.length)];
        }).join('');
        iter += 0.6;
        if (iter >= orig.length) { el.textContent = orig; clearInterval(timer); }
      }, 28);
    });
    hoverTarget.addEventListener('mouseleave', () => { clearInterval(timer); el.textContent = orig; });
  }

  // Nav links — text scrambles directly (no icon inside)
  document.querySelectorAll('.nav-inline a').forEach(link => scrambleOn(link, link));

  // Hero CTA buttons — scramble only the label span so icons stay intact,
  // but trigger on hovering the whole button
  document.querySelectorAll('.hero-cta .btn').forEach(btn => {
    const label = btn.querySelector('.btn-text');
    if (label) scrambleOn(label, btn);
  });
})();

/* ------------------------------------------------------------------ *
 * Skill chip stagger entrance — per cluster, on scroll into view
 * ------------------------------------------------------------------ */
(function () {
  const rows = document.querySelectorAll('.chip-row');
  if (!rows.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    rows.forEach(r => r.querySelectorAll('.chip').forEach(c => c.classList.add('stagger-in')));
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);
      const chips = entry.target.querySelectorAll('.chip');
      chips.forEach((chip, i) => setTimeout(() => chip.classList.add('stagger-in'), i * 60));
    });
  }, { threshold: 0.2 });
  rows.forEach(r => io.observe(r));
})();

/* ------------------------------------------------------------------ *
 * Reveal on scroll — one entrance per section, respects reduced motion
 * ------------------------------------------------------------------ */
(function () {
  const items = document.querySelectorAll('.reveal');
  if (!items.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { items.forEach(el => el.classList.add('in')); return; }

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  items.forEach(el => io.observe(el));
})();

/* ------------------------------------------------------------------ *
 * Timeline connector — draws in once visible
 * ------------------------------------------------------------------ */
(function () {
  const tl = document.querySelector('.timeline');
  if (!tl) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { tl.classList.add('in'); io.unobserve(tl); }
    });
  }, { threshold: 0.05 });
  io.observe(tl);
})();

/* ------------------------------------------------------------------ *
 * Capability matrix — animate bar fill once visible
 * ------------------------------------------------------------------ */
(function () {
  const bars = document.querySelectorAll('.matrix-fill');
  if (!bars.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const pct = el.getAttribute('data-fill') || '0';
        requestAnimationFrame(() => { el.style.width = pct + '%'; });
        io.unobserve(el);
      }
    });
  }, { threshold: 0.4 });
  bars.forEach(b => io.observe(b));
})();

/* ------------------------------------------------------------------ *
 * Status panel — live Pakistan clock + rotating focus ticker
 * ------------------------------------------------------------------ */
(function () {
  const clock = document.getElementById('pkClock');
  if (clock) {
    function tick() {
      const fmt = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      });
      clock.textContent = fmt.format(new Date()) + ' PKT';
    }
    tick();
    setInterval(tick, 1000);
  }

  const ticker = document.getElementById('focusTicker');
  if (ticker) {
    const words = ['Incident Response', 'Cyber Threat Intelligence', 'SOC Operations', 'Risk & Compliance'];
    let i = 0;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      setInterval(() => {
        i = (i + 1) % words.length;
        ticker.style.opacity = '0';
        setTimeout(() => { ticker.textContent = words[i]; ticker.style.opacity = '1'; }, 220);
      }, 3200);
      ticker.style.transition = 'opacity 220ms ease';
    }
  }
})();

/* ------------------------------------------------------------------ *
 * Hero background — animated network graph (canvas)
 * ------------------------------------------------------------------ */
(function () {
  const canvas = document.getElementById('heroCanvas');
  const hero = document.getElementById('hero');
  if (!canvas || !hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let w, h, nodes, raf;
  const isLight = () => document.documentElement.classList.contains('light');

  function sizeToParent() {
    const rect = hero.getBoundingClientRect();
    w = canvas.width = rect.width * devicePixelRatio;
    h = canvas.height = rect.height * devicePixelRatio;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
  }

  function makeNodes() {
    const count = Math.max(18, Math.min(46, Math.round((w * h) / (26000 * devicePixelRatio * devicePixelRatio))));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
      vy: (Math.random() - 0.5) * 0.25 * devicePixelRatio,
    }));
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    const linkColor = isLight() ? '12,143,132' : '44,206,190';
    const dotColor = isLight() ? '24,114,105' : '92,214,202';
    const maxDist = 150 * devicePixelRatio;

    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    });

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          ctx.strokeStyle = `rgba(${linkColor},${0.16 * (1 - dist / maxDist)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    nodes.forEach(n => {
      ctx.fillStyle = `rgba(${dotColor},0.8)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 1.6 * devicePixelRatio, 0, Math.PI * 2);
      ctx.fill();
    });
    raf = requestAnimationFrame(step);
  }

  function init() {
    sizeToParent();
    makeNodes();
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 200);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else { cancelAnimationFrame(raf); raf = requestAnimationFrame(step); }
  });

  init();
  raf = requestAnimationFrame(step);
})();

/* ------------------------------------------------------------------ *
 * Hero — rotating word ("I secure networks / systems / endpoints…")
 * ------------------------------------------------------------------ */
(function () {
  const wrap = document.getElementById('wordRotate');
  const inner = document.getElementById('wordRotateInner');
  if (!wrap || !inner) return;
  const words = ['networks', 'systems', 'endpoints', 'identities', 'critical infra', 'enterprise'];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  let i = 0;
  setInterval(() => {
    inner.classList.add('swap');
    setTimeout(() => {
      i = (i + 1) % words.length;
      inner.textContent = words[i];
      inner.classList.remove('swap');
    }, 320);
  }, 2600);
})();

/* ------------------------------------------------------------------ *
 * Animated stat counters — count up once visible
 * ------------------------------------------------------------------ */
(function () {
  const nums = document.querySelectorAll('.hero-meta-item .num[data-count]');
  if (!nums.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function animate(el) {
    const target = parseInt(el.getAttribute('data-count'), 10) || 0;
    const suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target + suffix; return; }
    const duration = 1100;
    const start = performance.now();
    function frame(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (p < 1) requestAnimationFrame(frame);
      else { el.textContent = target + suffix; el.classList.add('counted'); }
    }
    requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
    });
  }, { threshold: 0.6 });
  nums.forEach(n => io.observe(n));
})();

/* ------------------------------------------------------------------ *
 * Back to top
 * ------------------------------------------------------------------ */
(function () {
  const btn = document.getElementById('toTop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 640);
  }, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
})();

/* ------------------------------------------------------------------ *
 * Contact form — basic client-side handling for Formspree
 * ------------------------------------------------------------------ */
(function () {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const submitBtn = document.getElementById('formSubmit');
  if (!form) return;

  form.querySelectorAll('input, textarea').forEach(field => {
    function validateField() {
      const ok = field.checkValidity() && field.value.trim() !== '';
      field.classList.toggle('valid', ok);
      field.classList.toggle('invalid', !ok && field.value.trim() !== '');
    }
    field.addEventListener('blur', validateField);
    field.addEventListener('input', () => {
      if (field.classList.contains('invalid')) validateField();
    });
  });

  form.addEventListener('submit', async function (e) {
   // e.preventDefault();
    if (!form.checkValidity()) {
      form.querySelectorAll('input, textarea').forEach(field => {
        field.classList.toggle('invalid', !field.checkValidity());
        field.classList.toggle('valid', field.checkValidity());
      });
      status.textContent = 'Please fill in all fields with a valid email.';
      status.className = 'form-status err';
      form.reportValidity();
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    status.textContent = '';
    status.className = 'form-status';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        status.textContent = 'Message sent — thanks, I\u2019ll reply soon.';
        status.className = 'form-status ok';
        form.reset();
      } else {
        throw new Error('Request failed');
      }
    } catch (err) {
      status.textContent = 'Something went wrong. Please email myaqoobjunejo@hotmail.com directly.';
      status.className = 'form-status err';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
    }
  });
})();

/* ------------------------------------------------------------------ *
 * Scroll progress bar
 * ------------------------------------------------------------------ */
(function () {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  function update() {
    const h = document.documentElement;
    const scrolled = h.scrollTop;
    const height = h.scrollHeight - h.clientHeight;
    bar.style.width = (height > 0 ? (scrolled / height) * 100 : 0) + '%';
  }
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* ------------------------------------------------------------------ *
 * Footer year
 * ------------------------------------------------------------------ */
(function () {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

/* ------------------------------------------------------------------ *
 * Service worker registration
 * ------------------------------------------------------------------ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
