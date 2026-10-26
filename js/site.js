(function () {
  'use strict';
  var root = document.documentElement;
  var still = matchMedia('(prefers-reduced-motion: reduce)');
  var top = document.getElementById('top');
  function setTop() { root.style.setProperty('--top-h', top.offsetHeight + 'px'); root.style.setProperty('--strip-h', top.querySelector('.demo').offsetHeight + 'px'); }
  setTop(); addEventListener('resize', setTop);
  if (window.ResizeObserver) new ResizeObserver(setTop).observe(top);

  /* burger menu */
  var btn = document.querySelector('.menu-btn'), menu = document.getElementById('menu');
  function setMenu(open) {
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.hidden = !open;
  }
  btn.addEventListener('click', function () { setMenu(btn.getAttribute('aria-expanded') !== 'true'); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); btn.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (!menu.hidden && !e.target.closest('.hd')) setMenu(false);
  });

  /* reels */
  document.querySelectorAll('.reel').forEach(function (reel) {
    var track = reel.querySelector('.reel__track');
    var slides = [].slice.call(track.children);
    var prev = reel.querySelector('.reel__prev'), next = reel.querySelector('.reel__next');
    var dotsBox = reel.querySelector('.reel__dots'), ctl = reel.querySelector('.reel__ctl');
    var dots = [], index = 0, positions = 1, timer = 0;
    function per() {
      var w = slides[0].offsetWidth, gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return Math.max(1, Math.round((track.clientWidth + gap) / (w + gap)));
    }
    function maxScroll() { return track.scrollWidth - track.clientWidth; }
    function offsetOf(i) {
      var x = slides[i].offsetLeft - slides[0].offsetLeft;
      return Math.min(x, maxScroll());
    }
    function build() {
      var p = per();
      positions = slides.length - p + 1;
      if (p === 1) positions = slides.length;
      if (dots.length !== positions) {
        dotsBox.innerHTML = ''; dots = [];
        for (var i = 0; i < positions; i++) {
          var d = document.createElement('button');
          d.type = 'button'; d.className = 'reel__dot';
          d.setAttribute('aria-label', 'Фото ' + (i + 1) + ' из ' + positions);
          d.addEventListener('click', go.bind(null, i));
          dotsBox.appendChild(d); dots.push(d);
        }
      }
      ctl.hidden = positions <= 1;
      if (index > positions - 1) index = positions - 1;
      paint();
    }
    function paint() {
      reel.dataset.index = String(index);
      prev.disabled = index <= 0; next.disabled = index >= positions - 1;
      dots.forEach(function (d, i) { d.setAttribute('aria-current', i === index ? 'true' : 'false'); });
      var tl = track.getBoundingClientRect();
      var left = track.scrollLeft;
      slides.forEach(function (s, i) {
        var x = s.offsetLeft - slides[0].offsetLeft - left;
        var vis = x >= -2 && x + s.offsetWidth <= track.clientWidth + 2;
        s.setAttribute('aria-hidden', vis ? 'false' : 'true');
        s.inert = !vis;
      });
    }
    function go(i) {
      index = Math.max(0, Math.min(positions - 1, i));
      track.scrollTo({ left: offsetOf(index), behavior: still.matches ? 'auto' : 'smooth' });
      paint();
      clearTimeout(timer); timer = setTimeout(paint, 700);
    }
    prev.addEventListener('click', function () { go(index - 1); });
    next.addEventListener('click', function () { go(index + 1); });
    track.addEventListener('keydown', function (e) {
      var k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); go(index + k); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); go(positions - 1); }
    });
    var st = 0;
    track.addEventListener('scroll', function () {
      clearTimeout(st);
      st = setTimeout(function () {
        var left = track.scrollLeft, best = 0, bd = 1e9;
        for (var i = 0; i < positions; i++) { var d = Math.abs(offsetOf(i) - left); if (d < bd) { bd = d; best = i; } }
        index = best; paint();
      }, 120);
    }, { passive: true });
    build();
    addEventListener('resize', build);
  });

  /* v2: circle reveal for section shots */
  if (document.body.classList.contains('v2') && !still.matches && 'IntersectionObserver' in window) {
    var shots = document.querySelectorAll('.sec .shot');
    shots.forEach(function (s) { s.classList.add('circ'); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var box = en.target, s = box.__shot; io.unobserve(box);
        s.addEventListener('transitionend', function done(ev) {
          if (ev.propertyName !== 'clip-path') return;
          s.removeEventListener('transitionend', done);
          s.classList.add('circ--done');
        });
        s.classList.add('circ--in');
        setTimeout(function () { s.classList.add('circ--done'); }, 1600);
      });
    }, { threshold: .15 });
    shots.forEach(function (s) { var box = s.parentNode; box.__shot = s; io.observe(box); });
  }

  /* v2: map on click */
  document.querySelectorAll('.map__load').forEach(function (b) {
    b.addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = b.dataset.src; f.title = '«Адриатика» на Яндекс Картах'; f.setAttribute('allowfullscreen', '');
      var box = b.parentElement, alt = box.querySelector('.map__alt'); box.classList.add('map--on'); box.innerHTML = ''; box.appendChild(f);
      if (alt) { alt.classList.add('map__alt--below'); box.parentNode.insertBefore(alt, box.nextSibling); }
    });
  });
})();
