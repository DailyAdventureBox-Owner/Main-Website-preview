/* DailyAdventureBox — shared behaviour (no frameworks) */
(function () {
  'use strict';
  var d = document, w = window;
  var reduced = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Nav: scrolled state, mobile menu, active link ---- */
  var nav = d.getElementById('nav');
  var mobile = d.getElementById('navMobile');
  function onScroll() {
    if (!nav) return;
    if (w.scrollY > 40) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  var burger = d.getElementById('navBurger');
  if (burger && mobile) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      mobile.classList.toggle('open', open);
      d.body.style.overflow = open ? 'hidden' : '';
    });
    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open'); mobile.classList.remove('open'); d.body.style.overflow = '';
      });
    });
  }
  var here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  d.querySelectorAll('.nav-links a[href], .nav-mobile a[href]').forEach(function (a) {
    var href = (a.getAttribute('href') || '').split('#')[0].split('/').pop().toLowerCase();
    if (href && href === here) a.classList.add('active');
  });

  /* ---- Smooth in-page anchors (inside the iframe, scroll this document) ---- */
  d.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href').slice(1); if (!id) return;
      var el = d.getElementById(id); if (!el) return;
      e.preventDefault();
      var top = el.getBoundingClientRect().top + w.scrollY - 72;
      w.scrollTo({ top: top, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---- Reveal on scroll ---- */
  var io = ('IntersectionObserver' in w) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }) : null;
  d.querySelectorAll('[data-reveal], [data-stagger]').forEach(function (el) {
    if (io) io.observe(el); else el.classList.add('in');
  });

  /* ---- Pinned "how it works": light the step + swap the phone screen ---- */
  var steps = d.querySelectorAll('.step');
  var screens = d.querySelectorAll('.phone-screen .screen');
  function setStep(i) {
    steps.forEach(function (s, k) { s.classList.toggle('active', k === i); });
    screens.forEach(function (s, k) { s.classList.toggle('active', k === i); });
  }
  if (steps.length) {
    setStep(0);
    if ('IntersectionObserver' in w) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) setStep(parseInt(en.target.getAttribute('data-step'), 10) || 0);
        });
      }, { threshold: 0.6 });
      steps.forEach(function (s) { sio.observe(s); });
    }
  }

  /* ---- Statement band: light up words as they pass the middle of the screen ---- */
  var words = d.querySelectorAll('.statement .word');
  if (words.length) {
    var lit = function () {
      var mid = w.innerHeight * 0.62;
      words.forEach(function (wd) {
        var r = wd.getBoundingClientRect();
        wd.classList.toggle('lit', r.top < mid);
      });
    };
    if (reduced) words.forEach(function (wd) { wd.classList.add('lit'); });
    else { w.addEventListener('scroll', lit, { passive: true }); lit(); }
  }

  /* ---- Card glow follows the pointer ---- */
  d.querySelectorAll('.card-glow').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      c.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* ---- Cursor glow (fine pointers only) ---- */
  if (!reduced && w.matchMedia && w.matchMedia('(pointer: fine)').matches) {
    var g = d.createElement('div'); g.className = 'cursor-glow'; d.body.appendChild(g);
    var gx = 0, gy = 0, tx = 0, ty = 0, shown = false;
    w.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; if (!shown) { shown = true; d.body.classList.add('has-pointer'); } }, { passive: true });
    (function loop() { gx += (tx - gx) * 0.12; gy += (ty - gy) * 0.12; g.style.transform = 'translate(' + (gx - 210) + 'px,' + (gy - 210) + 'px)'; requestAnimationFrame(loop); })();
  }

  /* ---- Parallax on elements with data-parallax (speed factor) ---- */
  var px = d.querySelectorAll('[data-parallax]');
  if (px.length && !reduced) {
    var par = function () {
      px.forEach(function (el) {
        var sp = parseFloat(el.getAttribute('data-parallax')) || 0.2;
        var r = el.getBoundingClientRect();
        var off = (r.top + r.height / 2 - w.innerHeight / 2) * sp;
        el.style.transform = 'translate3d(0,' + off.toFixed(1) + 'px,0)';
      });
    };
    w.addEventListener('scroll', par, { passive: true }); par();
  }

  /* ---- Marquee: duplicate the track once so the loop is seamless ---- */
  d.querySelectorAll('.marquee-track').forEach(function (t) {
    if (!t.getAttribute('data-dup')) { t.innerHTML += t.innerHTML; t.setAttribute('data-dup', '1'); }
  });

  /* ---- Hero video: self-hosted silent loop (no captions or YouTube branding).
     The photo shows until the video is actually playing; skipped for reduced motion
     and when the visitor has data saver on. ---- */
  var hv = d.querySelector('.hero-media video.yt');
  var saveData = navigator.connection && navigator.connection.saveData;
  if (hv && !reduced && !saveData) {
    hv.src = (w.matchMedia('(max-width: 700px)').matches ? hv.getAttribute('data-src-sm') : hv.getAttribute('data-src'));
    hv.muted = true;
    hv.addEventListener('playing', function () { hv.parentNode.classList.add('playing'); });
    var p = hv.play(); if (p && p.catch) p.catch(function () {});
  } else if (hv) { hv.parentNode.removeChild(hv); }

  /* ---- Framed on dailyadventurebox.com: send page links to the parent site's routes ---- */
  var framed = false; try { framed = w.self !== w.top; } catch (e) { framed = true; }
  if (framed) {
    var routes = {
      /* Pages with their own Webflow route open at the top level; the rest load inside this frame
         until /gear, /host-a-locker and /our-story exist on Webflow. */
      'index.html': 'https://www.dailyadventurebox.com/',
      'ad-opportunities.html': 'https://www.dailyadventurebox.com/partnership-advertismentopportunities'
    };
    d.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || /^(https?:|mailto:|tel:|#)/.test(href)) return;
      var parts = href.split('#'); var file = parts[0].split('/').pop().toLowerCase(); var hash = parts[1] ? '#' + parts[1] : '';
      if (routes[file]) { a.setAttribute('href', routes[file] + hash); a.setAttribute('target', '_top'); }
    });
  }

  /* ---- Year ---- */
  d.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
