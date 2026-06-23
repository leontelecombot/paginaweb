/* ============================================================
   PLANES DINÁMICOS — León Telecom
   Trae los planes de internet desde el panel (servidor del bot) y
   reconstruye las tarjetas de Fibra / Inalámbrico (y Negocios).
   Si la API falla, NO toca nada: se queda el HTML estático como
   respaldo (la web nunca se rompe ni se queda sin planes).
   ============================================================ */
(function () {
  'use strict';

  var API = 'https://leontelecom-server.onrender.com/api/plans';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // Reconstruye una tarjeta de plan con EXACTAMENTE el mismo markup/clases
  // que el sitio, para no romper el diseño.
  function cardHtml(p) {
    var icon = p.tipo === 'inalambrico' ? 'fa-signal' : 'fa-bolt';
    var feats = (p.features || []).map(function (f) {
      return '<li><i class="fas fa-check"></i> ' + esc(f) + '</li>';
    }).join('');
    var ribbon = p.badge
      ? '<div class="ribbon-box"><span class="badge">' + esc(p.badge) + '</span></div>'
      : '';
    return '' +
      '<div class="plan-card' + (p.badge ? ' featured' : '') + '">' +
        ribbon +
        '<div class="plan-header">' +
          '<i class="fas ' + icon + '"></i>' +
          '<h3>' + esc(p.mbps) + ' Mbps</h3>' +
        '</div>' +
        '<p class="plan-subtitle">' + esc(p.label || '') + '</p>' +
        '<div class="plan-price">' + esc(p.price) + '</div>' +
        '<p class="plan-period">' + esc(p.period || '/mes') + '</p>' +
        '<ul class="plan-features">' + feats + '</ul>' +
        '<a href="' + esc(p.wa) + '" class="btn btn-plan" target="_blank" rel="noopener noreferrer">Contratar Ahora</a>' +
      '</div>';
  }

  function fill(selector, list) {
    var grid = document.querySelector(selector);
    if (grid && list.length) grid.innerHTML = list.map(cardHtml).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Solo actúa si existe la sección de planes
    if (!document.querySelector('#fibra .planes-grid')) return;
    fetch(API, { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (d) {
        var plans = (d && d.plans) || [];
        if (!plans.length) return; // vacío → deja el HTML estático

        var hogar = plans.filter(function (p) { return (p.segmento || 'hogar') !== 'negocio'; });
        var negocio = plans.filter(function (p) { return p.segmento === 'negocio'; });
        var fibra = hogar.filter(function (p) { return p.tipo !== 'inalambrico'; });
        var inalam = hogar.filter(function (p) { return p.tipo === 'inalambrico'; });

        fill('#fibra .planes-grid', fibra);
        fill('#inalambrico .planes-grid', inalam);

        // Negocios: si hay planes de negocio, muéstralos y oculta el "Próximamente".
        var grid = document.getElementById('negociosGrid');
        var ph = document.getElementById('negociosPlaceholder');
        if (negocio.length && grid) {
          grid.innerHTML = negocio.map(cardHtml).join('');
          grid.style.display = '';
          if (ph) ph.style.display = 'none';
        }
      })
      .catch(function () { /* sin API → se quedan las tarjetas estáticas */ });
  });
})();
