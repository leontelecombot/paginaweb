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

    // (Los orbes con filter:blur se quitaron por rendimiento; el color del hero
    //  lo dan los degradados radiales del fondo, que son mucho más baratos.)

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
