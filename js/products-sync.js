/* ============================================================
   PRODUCTOS DINÁMICOS — León Telecom
   Trae el catálogo desde el panel (servidor del bot) y reconstruye
   la grilla de #productos. Si la API falla, NO toca nada y se queda
   el HTML estático como respaldo (la web nunca se rompe).
   ============================================================ */
(function () {
  'use strict';

  // Servidor del bot/panel (mismo valor que SERVER_BASE_URL en Render).
  var API = 'https://leontelecom-server.onrender.com/api/products';
  // Número de WhatsApp para los botones "Cotizar" (igual que el resto del sitio).
  var WA = '529512172814';
  // Orden preferido de las categorías en los filtros; lo nuevo se agrega al final.
  var PREFERRED = ['Streaming', 'Internet', 'Cómputo', 'TV', 'Cables', 'Iluminación', 'Limpieza'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function waLink(name, price) {
    var t = 'Hola, me interesa: ' + name + (price ? ' (' + price + ')' : '') + '. ¿Está disponible?';
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t);
  }

  function cardHtml(p) {
    var cat = p.cat || 'Otros';
    return '' +
      '<article class="product-card" data-cat="' + esc(cat) + '">' +
        '<div class="product-img">' +
          '<img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy">' +
          '<span class="product-cat">' + esc(cat) + '</span>' +
        '</div>' +
        '<div class="product-body">' +
          '<h3 class="product-name">' + esc(p.name) + '</h3>' +
          '<div class="product-foot">' +
            '<span class="product-price">' + esc(p.price) + '</span>' +
            '<a href="' + waLink(p.name, p.price) + '" class="btn-product" target="_blank" rel="noopener noreferrer" aria-label="Cotizar ' + esc(p.name) + ' por WhatsApp">' +
              '<i class="fab fa-whatsapp" aria-hidden="true"></i> Cotizar' +
            '</a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function orderedCats(products) {
    var present = [];
    products.forEach(function (p) {
      var c = p.cat || 'Otros';
      if (present.indexOf(c) < 0) present.push(c);
    });
    var ordered = PREFERRED.filter(function (c) { return present.indexOf(c) >= 0; });
    present.forEach(function (c) { if (ordered.indexOf(c) < 0) ordered.push(c); });
    return ordered;
  }

  function buildFilters(cats) {
    var wrap = document.querySelector('.product-filters');
    if (!wrap) return;
    var html = '<button class="prod-filter active" type="button" data-cat="all">Todos</button>';
    cats.forEach(function (c) {
      html += '<button class="prod-filter" type="button" data-cat="' + esc(c) + '">' + esc(c) + '</button>';
    });
    wrap.innerHTML = html;
  }

  // Vuelve a enlazar el filtrado por categoría sobre las tarjetas nuevas.
  function bindFilters() {
    var filters = document.querySelectorAll('.prod-filter');
    var cards = document.querySelectorAll('.product-card');
    if (!filters.length || !cards.length) return;
    filters.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-cat');
        filters.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        cards.forEach(function (card) {
          var show = cat === 'all' || card.getAttribute('data-cat') === cat;
          card.classList.toggle('is-hidden', !show);
        });
      });
    });
  }

  function render(products) {
    var grid = document.querySelector('.products-grid');
    if (!grid || !products.length) return;
    grid.innerHTML = products.map(cardHtml).join('');
    buildFilters(orderedCats(products));
    bindFilters();
  }

  // Banner de promoción (editable desde el panel) — barra fija arriba.
  var PROMO = 'https://leontelecom-server.onrender.com/api/promo';
  function showPromo(d) {
    if (!d || !d.active || !d.text || document.getElementById('lt-promo-bar')) return;
    var bar = document.createElement('div');
    bar.id = 'lt-promo-bar';
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:3000;background:linear-gradient(120deg,#2c0a6b,#5e23c4);color:#fff;text-align:center;padding:9px 40px;font-size:.92em;font-weight:600;line-height:1.3;box-shadow:0 3px 16px rgba(44,10,107,.25)';
    bar.innerHTML = (d.link ? '<a href="' + esc(d.link) + '" target="_blank" rel="noopener noreferrer" style="color:#fff;text-decoration:underline">' + esc(d.text) + '</a>' : esc(d.text)) +
      '<span id="lt-promo-x" style="position:absolute;right:13px;top:50%;transform:translateY(-50%);cursor:pointer;opacity:.85;font-size:1.15em" title="Cerrar">✕</span>';
    document.body.appendChild(bar);
    var h = bar.offsetHeight;
    var nav = document.querySelector('.navbar');
    var bodyPad = parseFloat(getComputedStyle(document.body).paddingTop) || 0;
    document.body.style.paddingTop = (bodyPad + h) + 'px';
    var navTop = 0;
    if (nav) { navTop = parseFloat(getComputedStyle(nav).top) || 0; nav.style.top = (navTop + h) + 'px'; }
    document.getElementById('lt-promo-x').onclick = function () {
      bar.remove();
      document.body.style.paddingTop = bodyPad ? bodyPad + 'px' : '';
      if (nav) nav.style.top = navTop ? navTop + 'px' : '';
    };
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Banner de promoción (independiente de los productos)
    fetch(PROMO, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) showPromo(d); })
      .catch(function () {});
    // Productos dinámicos
    if (!document.querySelector('.products-grid')) return;
    fetch(API, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (d) {
        var ps = (d && d.products) || [];
        if (ps.length) render(ps);   // si viene vacío, deja el HTML estático
      })
      .catch(function () { /* sin conexión a la API → se queda el catálogo estático */ });
  });
})();
