/* ============================================================
   LEÓN TELECOM · CAPA PREMIUM (JS)
   - Revelados al scroll (cortes / aperturas)
   - Slider "liquid glass" reutilizable
   - Barra de progreso de scroll
   - Botones flotantes (WhatsApp + volver arriba)
   - Contadores animados
   Independiente del bot. No modifica js/script.js.
   ============================================================ */
(function () {
    'use strict';

    var prefersReduced = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('DOMContentLoaded', function () {
        initReveals();
        initGlassSliders();
        initScrollProgress();
        initFloatingButtons();
        initCounters();
        initProductFilters();
    });

    /* ============================
       1. REVELADOS AL SCROLL
       ============================
       Marca los [data-reveal] con .reveal-init (estado oculto via CSS)
       y los muestra al entrar en viewport. Si no hay JS, nada se oculta.
    */
    function initReveals() {
        var els = document.querySelectorAll('[data-reveal], .curtain');
        if (!els.length) return;

        if (prefersReduced || !('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        els.forEach(function (el) {
            if (el.hasAttribute('data-reveal')) el.classList.add('reveal-init');
            // stagger automático dentro de un grupo
            var delay = el.getAttribute('data-reveal-delay');
            if (delay) el.style.setProperty('--reveal-delay', delay);
        });

        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

        els.forEach(function (el) { io.observe(el); });

        // Failsafe: nada debe quedar oculto. Si por cualquier motivo el
        // observer no dispara (layout raro, navegador antiguo), revelamos
        // todo lo que siga sin mostrarse tras unos segundos.
        window.setTimeout(function () {
            els.forEach(function (el) {
                if (!el.classList.contains('is-visible')) {
                    el.classList.add('is-visible');
                    io.unobserve(el);
                }
            });
        }, 2600);
    }

    /* ============================
       2. SLIDER LIQUID GLASS
       ============================ */
    function initGlassSliders() {
        document.querySelectorAll('.glass-slider').forEach(function (slider) {
            var slides = Array.prototype.slice.call(
                slider.querySelectorAll('.glass-slide'));
            if (slides.length === 0) return;

            var dotsWrap = slider.querySelector('.glass-slider-dots');
            var progress = slider.querySelector('.glass-slider-progress');
            var prevBtn = slider.querySelector('.glass-slider-arrow.prev');
            var nextBtn = slider.querySelector('.glass-slider-arrow.next');
            var interval = parseInt(slider.getAttribute('data-autoplay'), 10);
            if (isNaN(interval)) interval = 6000;

            var current = 0;
            var timer = null;

            // Construir dots
            var dots = [];
            if (dotsWrap) {
                slides.forEach(function (_, i) {
                    var d = document.createElement('button');
                    d.className = 'glass-dot' + (i === 0 ? ' active' : '');
                    d.type = 'button';
                    d.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1));
                    d.addEventListener('click', function () { go(i, true); });
                    dotsWrap.appendChild(d);
                    dots.push(d);
                });
            }

            function setProgress() {
                if (!progress || prefersReduced) return;
                progress.classList.remove('run');
                progress.style.setProperty('--autoplay-ms', interval + 'ms');
                // reinicia la animación
                void progress.offsetWidth;
                progress.classList.add('run');
            }

            function go(index, userAction) {
                if (index === current) return;
                var total = slides.length;
                index = (index + total) % total;

                var outgoing = slides[current];
                var incoming = slides[index];

                outgoing.classList.remove('active');
                outgoing.classList.add('leaving');
                incoming.classList.remove('leaving');
                incoming.classList.add('active');

                // limpia la clase de salida al terminar
                window.setTimeout(function () {
                    outgoing.classList.remove('leaving');
                }, 900);

                if (dots.length) {
                    dots[current].classList.remove('active');
                    dots[index].classList.add('active');
                }
                current = index;
                setProgress();
                if (userAction) restart();
            }

            function next() { go(current + 1); }
            function prev() { go(current - 1); }

            function start() {
                if (prefersReduced || slides.length < 2) return;
                stop();
                timer = window.setInterval(next, interval);
                setProgress();
            }
            function stop() {
                if (timer) { window.clearInterval(timer); timer = null; }
            }
            function restart() { stop(); start(); }

            if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });
            if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });

            // Pausa al pasar el mouse / foco
            slider.addEventListener('mouseenter', stop);
            slider.addEventListener('mouseleave', start);
            slider.addEventListener('focusin', stop);
            slider.addEventListener('focusout', start);

            // Teclado (cuando el slider tiene foco)
            slider.setAttribute('tabindex', '0');
            slider.addEventListener('keydown', function (e) {
                if (e.key === 'ArrowRight') { next(); restart(); }
                else if (e.key === 'ArrowLeft') { prev(); restart(); }
            });

            // Swipe táctil
            var startX = 0, dx = 0, dragging = false;
            slider.addEventListener('touchstart', function (e) {
                startX = e.touches[0].clientX; dx = 0; dragging = true; stop();
            }, { passive: true });
            slider.addEventListener('touchmove', function (e) {
                if (dragging) dx = e.touches[0].clientX - startX;
            }, { passive: true });
            slider.addEventListener('touchend', function () {
                if (dragging && Math.abs(dx) > 45) { dx < 0 ? next() : prev(); }
                dragging = false; start();
            });

            // Pausa cuando la pestaña no está visible
            document.addEventListener('visibilitychange', function () {
                document.hidden ? stop() : start();
            });

            // Pausa si el slider sale de pantalla (ahorra batería)
            if ('IntersectionObserver' in window) {
                new IntersectionObserver(function (ents) {
                    ents.forEach(function (en) { en.isIntersecting ? start() : stop(); });
                }, { threshold: 0.25 }).observe(slider);
            } else {
                start();
            }
        });
    }

    /* ============================
       3. BARRA DE PROGRESO SCROLL
       ============================ */
    function initScrollProgress() {
        var bar = document.querySelector('.scroll-progress');
        if (!bar) return;
        var ticking = false;
        function update() {
            var h = document.documentElement;
            var max = h.scrollHeight - h.clientHeight;
            var ratio = max > 0 ? h.scrollTop / max : 0;
            bar.style.transform = 'scaleX(' + ratio + ')';
            ticking = false;
        }
        window.addEventListener('scroll', function () {
            if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
        }, { passive: true });
        update();
    }

    /* ============================
       4. BOTONES FLOTANTES
       ============================ */
    function initFloatingButtons() {
        var top = document.querySelector('.fab-top');
        var stack = document.querySelector('.fab-stack');

        // Mientras se hace scroll, el stack se atenúa para no chocar
        // con el contenido que pasa debajo (botones, badges, etc.);
        // al detenerse, recupera su opacidad normal.
        if (stack && !prefersReduced) {
            var fadeTimer = null;
            window.addEventListener('scroll', function () {
                stack.classList.add('is-scrolling');
                window.clearTimeout(fadeTimer);
                fadeTimer = window.setTimeout(function () {
                    stack.classList.remove('is-scrolling');
                }, 550);
            }, { passive: true });
            stack.addEventListener('mouseenter', function () { stack.classList.remove('is-scrolling'); });
            stack.addEventListener('focusin', function () { stack.classList.remove('is-scrolling'); });

            // Al entrar el footer en pantalla, esconde el stack para
            // que no se encime con los datos de contacto del footer.
            var footer = document.querySelector('.footer');
            if (footer && 'IntersectionObserver' in window) {
                new IntersectionObserver(function (entries) {
                    entries.forEach(function (en) {
                        stack.classList.toggle('at-footer', en.isIntersecting);
                    });
                }, { threshold: 0.01 }).observe(footer);
            }
        }

        if (top) {
            top.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
            });
            var ticking = false;
            window.addEventListener('scroll', function () {
                if (!ticking) {
                    window.requestAnimationFrame(function () {
                        top.classList.toggle('show', window.scrollY > 600);
                        ticking = false;
                    });
                    ticking = true;
                }
            }, { passive: true });
        }
    }

    /* ============================
       5. CONTADORES ANIMADOS
       ============================ */
    function initCounters() {
        var nums = document.querySelectorAll('[data-count]');
        if (!nums.length) return;

        function run(el) {
            var target = parseFloat(el.getAttribute('data-count'));
            var suffix = el.getAttribute('data-suffix') || '';
            var decimals = (String(target).split('.')[1] || '').length;
            if (prefersReduced) {
                el.textContent = target.toFixed(decimals) + suffix;
                return;
            }
            var start = null, dur = 1800;
            function step(ts) {
                if (!start) start = ts;
                var p = Math.min((ts - start) / dur, 1);
                var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
                el.textContent = (eased * target).toFixed(decimals) + suffix;
                if (p < 1) window.requestAnimationFrame(step);
            }
            window.requestAnimationFrame(step);
        }

        if (!('IntersectionObserver' in window)) {
            nums.forEach(run);
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) { run(e.target); io.unobserve(e.target); }
            });
        }, { threshold: 0.5 });
        nums.forEach(function (n) { io.observe(n); });
    }

    /* ============================
       6. FILTRO DE PRODUCTOS
       ============================
       Muestra/oculta las tarjetas por categoría según el chip activo. */
    function initProductFilters() {
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
})();
