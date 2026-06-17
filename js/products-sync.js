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
  var WA = '529511697346';
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

  document.addEventListener('DOMContentLoaded', function () {
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
