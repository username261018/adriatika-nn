(function () {
  'use strict';
  var root = document.documentElement;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var layer = document.querySelector('.dust');
  var giant = document.querySelector('.giant');

  /* dust: faint motes rising (DOM spans, CSS animation), paused when tab hidden or page idle */
  var lastAct = performance.now();
  var dust = window.__dust = { running: false };
  (function make() {
    var n = innerWidth < 600 ? 26 : 48, html = '';
    for (var i = 0; i < n; i++) {
      var r = (1.2 + Math.random() * 3).toFixed(1), d = (14 + Math.random() * 22).toFixed(1);
      html += '<i style="left:' + (Math.random() * 100).toFixed(2) + '%;top:' + (15 + Math.random() * 95).toFixed(2) + '%;width:' + r + 'px;height:' + r + 'px;opacity:' + (.15 + Math.random() * .35).toFixed(2) +
        ';--dx:' + (Math.random() * 40 - 20).toFixed(0) + 'px;animation-duration:' + d + 's;animation-delay:-' + (Math.random() * d).toFixed(1) + 's"></i>';
    }
    layer.innerHTML = html;
  })();
  function start() {
    if (still || dust.running || document.hidden) return;
    dust.running = true; layer.classList.add('is-on');
  }
  function stop() { dust.running = false; layer.classList.remove('is-on'); }
  function wake() { lastAct = performance.now(); start(); }
  ['scroll', 'pointermove', 'pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function (ev) { addEventListener(ev, wake, { passive: true }); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else wake(); });
  setInterval(function () { if (dust.running && !root.classList.contains('intro') && performance.now() - lastAct > 8000) stop(); }, 500);
  start();

  /* intro wall */
  var wall = document.querySelector('.wall');
  if (!root.classList.contains('intro')) return;
  wall.hidden = false;
  var digit = wall.querySelector('.wall__digit'), svg = wall.querySelector('.wall__cracks');
  var piecesBox = wall.querySelector('.wall__pieces'), solid = wall.querySelector('.wall__solid');
  var timers = [], done = false;
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }
  function finish() {
    if (done) return; done = true;
    timers.forEach(clearTimeout);
    giant.classList.remove('pulse');
    root.classList.remove('intro');
    wall.hidden = true; wall.innerHTML = '';
    dust.done = true; wake();
  }
  window.__wallSkip = finish;
  wall.addEventListener('click', finish);
  addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(); });

  /* cards: three place shots and one more, falling with a tilt */
  var imgs = [].slice.call(wall.querySelectorAll('.wall__cards img'));
  imgs.forEach(function (im, i) {
    at(250 + i * 650, function () {
      var c = document.createElement('div');
      var r0 = (i % 2 ? 7 : -8), r1 = (i % 2 ? -5 : 6);
      c.style.left = (6 + i * 22 + Math.random() * 2) + '%';
      c.style.setProperty('--r0', r0 + 'deg'); c.style.setProperty('--r1', r1 + 'deg');
      var k = im.cloneNode(); k.removeAttribute('width'); k.removeAttribute('height');
      c.appendChild(k); wall.querySelector('.wall__cards').appendChild(c);
    });
  });

  /* count 3, 2, 1, 0 */
  [3, 2, 1, 0].forEach(function (n, i) {
    at(i * 1000, function () { digit.innerHTML = '<span>' + n + '</span>'; });
  });

  /* geometry for cracks and pieces */
  var R = wall.getBoundingClientRect(), dr = digit.getBoundingClientRect();
  var ox = dr.right - R.left, oy = dr.top - R.top + dr.height * .1;
  var big = Math.hypot(R.width, R.height) * 1.4;
  var N = 10, rings = [0, .16, .34, .58, 1];
  var base = Math.random() * .4;
  var rays = [];
  for (var i = 0; i < N; i++) {
    var a = (i + base + (Math.random() - .5) * .5) / N * Math.PI * 2;
    var pts = rings.map(function (f, k) {
      if (!k) return [ox, oy];
      var aa = a + (Math.random() - .5) * .12, rr = f * big * (0.85 + Math.random() * .3);
      return [ox + Math.cos(aa) * rr, oy + Math.sin(aa) * rr];
    });
    rays.push(pts);
  }
  function pathD(pts) { return 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('L'); }
  function jag(a, b, n) {
    var out = [a];
    for (var j = 1; j < n; j++) {
      var t = j / n, dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, off = (Math.random() - .5) * L * .08;
      out.push([a[0] + dx * t - dy / L * off, a[1] + dy * t + dx / L * off]);
    }
    out.push(b); return out;
  }
  var NS = 'http://www.w3.org/2000/svg';
  svg.setAttribute('viewBox', '0 0 ' + R.width + ' ' + R.height);
  function line(pts, burst, cls) {
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', pathD(pts));
    if (cls) p.setAttribute('class', cls);
    svg.appendChild(p);
    var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    p.dataset.burst = burst; return p;
  }
  var lines = [];
  rays.forEach(function (pts, i) {
    for (var k = 0; k < rings.length - 1; k++) {
      var seg = jag(pts[k], pts[k + 1], 4);
      var burst = k === 0 ? (i % 3 === 0 ? 0 : 1) : (k === 1 ? 1 : 2);
      lines.push(line(seg, burst));
      lines.push(line(seg.map(function (p) { return [p[0] + 1.2, p[1] + 1.2]; }), burst, 'glint'));
    }
  });
  for (var k = 1; k < rings.length - 1; k++) {
    for (var i2 = 0; i2 < N; i2++) {
      if (k === 3 && Math.random() < .25) continue;
      lines.push(line(jag(rays[i2][k], rays[(i2 + 1) % N][k], 3), k === 1 ? 1 : 2));
    }
  }
  /* thin hairlines inside the pieces */
  for (var h = 0; h < 46; h++) {
    var ri = Math.floor(Math.random() * N), kk = 1 + Math.floor(Math.random() * 3);
    var p0 = rays[ri][kk], p1 = rays[(ri + 1) % N][kk + 1];
    var t = .2 + Math.random() * .6, sx = p0[0] + (p1[0] - p0[0]) * t, sy = p0[1] + (p1[1] - p0[1]) * t;
    var an = Math.random() * 6.28, ln = 20 + Math.random() * 60;
    lines.push(line(jag([sx, sy], [sx + Math.cos(an) * ln, sy + Math.sin(an) * ln], 3), 2, 'hl'));
  }
  /* pieces: cells between neighbouring rays and rings */
  var pieces = [];
  for (var c = 0; c < N; c++) {
    for (var k2 = 0; k2 < rings.length - 1; k2++) {
      var A = rays[c], B = rays[(c + 1) % N];
      var poly = k2 === 0 ? [A[0], A[1], B[1]] : [A[k2], A[k2 + 1], B[k2 + 1], B[k2]];
      var el = document.createElement('i');
      el.style.clipPath = 'polygon(' + poly.map(function (p) { return p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px'; }).join(',') + ')';
      var cx = 0, cy = 0; poly.forEach(function (p) { cx += p[0]; cy += p[1]; }); cx /= poly.length; cy /= poly.length;
      el.dataset.wave = k2; el.dataset.dx = ((cx - ox) / big * 18).toFixed(1); el.dataset.dy = ((cy - oy) / big * 18).toFixed(1);
      piecesBox.appendChild(el); pieces.push(el);
    }
  }
  function burst(b, ms) {
    at(ms, function () {
      lines.forEach(function (p) {
        if (p.dataset.burst != b) return;
        p.style.transition = 'stroke-dashoffset ' + (b === 2 ? 220 : 300) + 'ms ease-out ' + Math.round(Math.random() * (b === 2 ? 260 : 120)) + 'ms';
        p.style.strokeDashoffset = 0;
      });
    });
  }
  var T0 = 3400;
  burst(0, T0); burst(1, T0 + 650); burst(2, T0 + 1300);
  at(T0 + 1950, function () { giant.classList.add('is-on'); });
  at(T0 + 2200, function () {
    solid.style.display = 'none'; digit.style.transition = 'opacity .3s'; digit.style.opacity = '0';
    pieces.forEach(function (p) { p.style.transform = 'translate(' + p.dataset.dx + 'px,' + p.dataset.dy + 'px)'; });
    giant.classList.add('pulse');
  });
  at(T0 + 2500, function () {
    svg.style.transition = 'opacity .3s'; svg.style.opacity = '0';
    pieces.forEach(function (p) {
      var w = +p.dataset.wave, d = w * 150 + Math.random() * 120;
      p.style.transition = 'transform 850ms cubic-bezier(.5,0,.75,0) ' + d + 'ms';
      p.style.transform = 'translate(' + (p.dataset.dx * 3) + 'px,' + (R.height * 1.2) + 'px) rotate(' + ((Math.random() - .5) * 30).toFixed(1) + 'deg)';
    });
  });
  at(T0 + 2500 + 4 * 150 + 120 + 900, finish);
})();
