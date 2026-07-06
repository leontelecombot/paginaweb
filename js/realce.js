/* ==========================================================================
   REALCE — León Telecom  (efectos nivel OBEX, inyectados sin tocar el HTML)
   Crea: barra de progreso, spotlight, grano, orbes+rejilla del hero,
   nav "scrolled" y parallax. No modifica la estructura existente.
   ========================================================================== */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  function el(id, cls) {
    var d = document.createElement('div');
    if (id) d.id = id;
    if (cls) d.className = cls;
    return d;
  }

  function init() {
    // --- overlays globales ---
    var prog = el('lt-progress');
    var grain = el('lt-grain');
    document.body.appendChild(prog);
    document.body.appendChild(grain);

    var spot = null;
    if (fine && !reduce) {
      spot = el('lt-spotlight');
      document.body.appendChild(spot);
    }

    // --- hero: rejilla + orbes de color ---
    var hero = document.querySelector('.hero-section') || document.querySelector('#home');
    var parallaxOrbs = [];
    if (hero) {
      hero.appendChild(el(null, 'lt-grid'));
      var defs = [
        { w: 520, c: '#37d9d9', top: '-8%',  left: '-8%',  op: 0.30, anim: false, speed: -0.14 },
        { w: 440, c: '#5b8cff', bottom: '-14%', right: '-8%', op: 0.26, anim: true,  speed: 0.10 },
        { w: 360, c: '#9c7bff', top: '12%',  right: '6%',  op: 0.18, anim: true,  speed: 0.06 },
        { w: 300, c: '#2fe6c8', bottom: '6%', left: '12%', op: 0.16, anim: false, speed: -0.08 }
      ];
      defs.forEach(function (d, i) {
        var o = el(null, 'lt-orb');
        o.style.width = o.style.height = d.w + 'px';
        o.style.background = d.c;
        o.style.opacity = d.op;
        if (d.top != null) o.style.top = d.top;
        if (d.bottom != null) o.style.bottom = d.bottom;
        if (d.left != null) o.style.left = d.left;
        if (d.right != null) o.style.right = d.right;
        if (d.anim && !reduce) {
          o.style.animation = 'lt-floatOrb ' + (15 + i * 2) + 's ease-in-out infinite';
        } else {
          o.dataset.speed = d.speed;      // solo los que no flotan hacen parallax
          parallaxOrbs.push(o);
        }
        hero.appendChild(o);
      });
    }

    // --- scroll: progreso + nav + parallax de orbes ---
    var nav = document.querySelector('.navbar');
    var ticking = false;
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      if (nav) nav.classList.toggle('lt-scrolled', y > 30);
      if (!reduce) {
        for (var i = 0; i < parallaxOrbs.length; i++) {
          var o = parallaxOrbs[i];
          o.style.transform = 'translateY(' + (y * parseFloat(o.dataset.speed)) + 'px)';
        }
      }
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();

    // --- spotlight que sigue el cursor (suavizado) ---
    if (spot) {
      var sx = -300, sy = -300, tx = -300, ty = -300;
      window.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
      (function loop() {
        sx += (tx - sx) * 0.12;
        sy += (ty - sy) * 0.12;
        spot.style.setProperty('--sx', sx + 'px');
        spot.style.setProperty('--sy', sy + 'px');
        window.requestAnimationFrame(loop);
      })();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
