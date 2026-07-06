/* ==========================================================================
   REALCE — León Telecom  (ligero)
   Solo: barra de progreso de scroll, nav "scrolled" y 2 orbes ESTÁTICOS.
   Sin spotlight, sin grano, sin parallax (eso trababa). No toca el HTML.
   ========================================================================== */
(function () {
  'use strict';

  function el(id, cls) {
    var d = document.createElement('div');
    if (id) d.id = id;
    if (cls) d.className = cls;
    return d;
  }

  function init() {
    // Barra de progreso
    var prog = el('lt-progress');
    document.body.appendChild(prog);

    // 2 orbes de color estáticos en el hero (profundidad, casi sin costo)
    var hero = document.querySelector('.hero-section') || document.querySelector('#home');
    if (hero) {
      var orbs = [
        { w: 460, c: '#37d9d9', top: '-6%', left: '-6%', op: 0.32 },
        { w: 360, c: '#4f8ff5', top: '30%', right: '-4%', op: 0.20 },
        { w: 400, c: '#7c5cff', bottom: '-12%', right: '18%', op: 0.22 }
      ];
      orbs.forEach(function (d) {
        var o = el(null, 'lt-orb');
        o.style.width = o.style.height = d.w + 'px';
        o.style.background = d.c;
        o.style.opacity = d.op;
        if (d.top != null) o.style.top = d.top;
        if (d.bottom != null) o.style.bottom = d.bottom;
        if (d.left != null) o.style.left = d.left;
        if (d.right != null) o.style.right = d.right;
        hero.appendChild(o);
      });
    }

    // Scroll: progreso + nav (throttle con rAF, muy barato)
    var nav = document.querySelector('.navbar');
    var ticking = false;
    function onScroll() {
      var y = window.scrollY || window.pageYOffset;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      if (nav) nav.classList.toggle('lt-scrolled', y > 30);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
    }, { passive: true });
    onScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
