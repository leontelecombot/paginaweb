/* ============================
   INICIALIZACIÓN Y ELEMENTOS DEL DOM
   ============================ */
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeServiceTabs();
    initializeContactForm();
    initializeSchedule();
    initializeSectionNavigation();
    initializeScrollAnimations();
    initializeParallax();
    initialize3DEffects();
});

/* ============================
   HORARIOS E INTERACCIÓN
   ============================ */
function initializeSchedule() {
    const scheduleMap = {
        0: [['10:00','14:00']], // Domingo
        1: [['10:00','15:00'], ['16:00','20:00']], // Lunes
        2: [['10:00','15:00'], ['16:00','20:00']], // Martes
        3: [['10:00','15:00'], ['16:00','20:00']], // Miércoles
        4: [['10:00','15:00'], ['16:00','20:00']], // Jueves
        5: [['10:00','15:00'], ['16:00','20:00']], // Viernes
        6: [['10:00','15:00'], ['16:00','18:00']]  // Sábado
    };

    const toggleBtn = document.getElementById('toggleSchedule');
    const scheduleList = document.getElementById('scheduleList');
    const scheduleCard = document.getElementById('scheduleCard');
    const openNow = document.getElementById('openNow');
    const todayHoursEl = document.getElementById('todayHours');

    if (!toggleBtn || !scheduleList || !scheduleCard || !openNow) return;

    toggleBtn.addEventListener('click', function() {
        // On small screens open a modal instead of toggling inline list
        if (isMobile()) {
            openScheduleModal();
            return;
        }

        const expanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', String(!expanded));
        scheduleList.setAttribute('aria-hidden', String(expanded));
        scheduleCard.classList.toggle('open');
        this.textContent = expanded ? 'Ver Horarios' : 'Ocultar Horarios';
    });

    // Marca el día actual y calcula si está abierto ahora
    function timeToMinutes(t) {
        const [hh, mm] = t.split(':').map(Number);
        return hh * 60 + mm;
    }

    function isOpenNowForDay(day, map) {
        const ranges = map[day] || [];
        const now = new Date();
        const minutesNow = now.getHours() * 60 + now.getMinutes();
        return ranges.some(range => {
            const start = timeToMinutes(range[0]);
            const end = timeToMinutes(range[1]);
            return minutesNow >= start && minutesNow <= end;
        });
    }

    function updateOpenNow() {
        const today = new Date().getDay();
        const lis = scheduleList.querySelectorAll('li');
        lis.forEach(li => li.classList.remove('today'));
        const todayLi = scheduleList.querySelector(`li[data-day="${today}"]`);
        if (todayLi) todayLi.classList.add('today');

        const open = isOpenNowForDay(today, scheduleMap);
        openNow.textContent = open ? 'Abierto ahora' : 'Cerrado ahora';
        openNow.classList.toggle('closed', !open);
        openNow.classList.toggle('open', open);
        // Update today's hours display
        if (todayHoursEl) {
            const ranges = scheduleMap[today] || [];
            if (!ranges || ranges.length === 0) {
                todayHoursEl.textContent = 'Horario de hoy: Sin horario';
            } else {
                const parts = ranges.map(r => `${r[0]} - ${r[1]}`);
                todayHoursEl.textContent = `Horario hoy: ${parts.join(', ')}`;
            }
        }
    }

    // Calcula la siguiente apertura si está cerrado
    function findNextOpening(map, fromDay, minutesNow) {
        for (let offset = 0; offset < 7; offset++) {
            const day = (fromDay + offset) % 7;
            const ranges = map[day] || [];
            if (!ranges || ranges.length === 0) continue;

            if (offset === 0) {
                // buscar un rango hoy que comience después de ahora
                for (let i = 0; i < ranges.length; i++) {
                    const start = timeToMinutes(ranges[i][0]);
                    if (start > minutesNow) {
                        return { day, time: ranges[i][0], offset };
                    }
                }
                // si no hay más rangos hoy, seguir buscando en días siguientes
            } else {
                // devolver la primera apertura de ese día
                return { day, time: ranges[0][0], offset };
            }
        }
        return null;
    }

    const nextOpenEl = document.getElementById('nextOpen');
    function updateNextOpening() {
        if (!nextOpenEl) return;
        const now = new Date();
        const minutesNow = now.getHours() * 60 + now.getMinutes();
        const today = now.getDay();
        const open = isOpenNowForDay(today, scheduleMap);
        if (open) {
            nextOpenEl.textContent = '';
            return;
        }

        const next = findNextOpening(scheduleMap, today, minutesNow);
        if (!next) {
            nextOpenEl.textContent = 'Horario no disponible';
            return;
        }

        const weekdayNames = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
        let label = '';
        if (next.offset === 0) {
            label = `Abre hoy a las ${next.time}`;
        } else if (next.offset === 1) {
            label = `Abre mañana a las ${next.time}`;
        } else {
            const dayName = weekdayNames[next.day];
            label = `Abre el ${dayName} a las ${next.time}`;
        }
        nextOpenEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    }

    /* Modal helpers */
    const scheduleModal = document.getElementById('scheduleModal');
    const modalScheduleList = document.getElementById('modalScheduleList');
    const closeScheduleModalBtn = document.getElementById('closeScheduleModal');
    const scheduleModalBackdrop = document.getElementById('scheduleModalBackdrop');

    function openScheduleModal() {
        if (!scheduleModal || !modalScheduleList) return;
        // Clone schedule list items into modal
        modalScheduleList.innerHTML = '';
        const lis = scheduleList.querySelectorAll('li');
        lis.forEach(li => {
            const clone = li.cloneNode(true);
            clone.classList.remove('today'); // will reapply
            modalScheduleList.appendChild(clone);
        });
        // mark today in modal
        const today = new Date().getDay();
        const modalLis = modalScheduleList.querySelectorAll('li');
        modalLis.forEach(li => {
            if (li.getAttribute('data-day') === String(today)) li.classList.add('today');
        });

        scheduleModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeScheduleModal() {
        if (!scheduleModal) return;
        scheduleModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (closeScheduleModalBtn) closeScheduleModalBtn.addEventListener('click', closeScheduleModal);
    if (scheduleModalBackdrop) scheduleModalBackdrop.addEventListener('click', closeScheduleModal);
    // ESC to close
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeScheduleModal();
    });

    // Initial update + interval check cada 30 segundos
    updateOpenNow();
    updateNextOpening();
    setInterval(() => {
        updateOpenNow();
        updateNextOpening();
    }, 30000);
}

/* ============================
   NAVEGACIÓN PRINCIPAL
   ============================ */
function initializeNavigation() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Toggle menú mobile
    menuToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });

    // Cerrar menú al hacer click en un link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });

    // Cerrar menú al hacer scroll
    window.addEventListener('scroll', function() {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
    });
}

/* ============================
   NAVEGACIÓN DE SECCIONES
   ============================ */
function initializeSectionNavigation() {
    const navLinks = document.querySelectorAll('[data-section]');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const sectionId = this.getAttribute('data-section');
            navigateToSection(sectionId);
        });
    });
}

function navigateToSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    
    // Desactivar todas las secciones
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Activar la nueva sección
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Scroll suave
        setTimeout(() => {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = targetSection.offsetTop - navHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }, 100);
    }
}

/* ============================
   TABS DE SERVICIOS
   ============================ */
function initializeServiceTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remover clase active de todos los botones y contenidos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Añadir clase active al botón y contenido clickeado
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
            
            // Animación de planes
            const planCards = document.querySelectorAll('.plan-card');
            planCards.forEach((card, index) => {
                card.style.animation = 'none';
                setTimeout(() => {
                    card.style.animation = `fadeInSection 0.6s ease-out ${index * 0.1}s forwards`;
                }, 10);
            });
        });
    });
}

/* ============================
   FORMULARIO DE CONTACTO
   ============================ */
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Obtener datos del formulario
            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const telefono = document.getElementById('telefono').value;
            const asunto = document.getElementById('asunto').value;
            const mensaje = document.getElementById('mensaje').value;
            
            // Validar campos
            if (!nombre || !email || !asunto || !mensaje) {
                showNotification('Por favor completa todos los campos requeridos', 'error');
                return;
            }
            
            // Crear mensaje para WhatsApp
            const mensaje_whatsapp = `*Nuevo contacto desde la web:*\n\n*Nombre:* ${nombre}\n*Email:* ${email}\n*Teléfono:* ${telefono}\n*Asunto:* ${asunto}\n*Mensaje:* ${mensaje}`;
            const encoded_message = encodeURIComponent(mensaje_whatsapp);

            // Enviar por WhatsApp al número real de León Telecom
            const whatsapp_url = `https://wa.me/529511697346?text=${encoded_message}`;

            // Avisar y abrir WhatsApp con el mensaje ya escrito
            showNotification('Te llevamos a WhatsApp para enviar tu mensaje…', 'success');
            window.open(whatsapp_url, '_blank');

            // Limpiar formulario
            contactForm.reset();
        });
    }
}

/* ============================
   NOTIFICACIONES
   ============================ */
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#00d4d4' : type === 'error' ? '#ff6b6b' : '#0066cc'};
        color: ${type === 'success' ? '#001a4d' : '#ffffff'};
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    document.body.appendChild(notification);
    
    // Remover notificación después de 5 segundos
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

/* ============================
   ANIMACIONES AL SCROLL
   ============================ */
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animar elementos cuando entran al viewport
                if (entry.target.classList.contains('plan-card')) {
                    entry.target.style.animation = 'slideInUp 0.6s ease-out forwards';
                }
                if (entry.target.classList.contains('value-card')) {
                    entry.target.style.animation = 'slideInUp 0.6s ease-out forwards';
                }
                if (entry.target.classList.contains('feature-item')) {
                    entry.target.style.animation = 'slideInLeft 0.6s ease-out forwards';
                }
                if (entry.target.classList.contains('info-card')) {
                    entry.target.style.animation = 'slideInUp 0.6s ease-out forwards';
                }
            }
        });
    }, observerOptions);
    
    // Observar elementos
    document.querySelectorAll('.plan-card, .value-card, .feature-item, .info-card').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
}

/* ============================
   EFECTO PARALLAX
   ============================ */
function initializeParallax() {
    window.addEventListener('scroll', function() {
        const scrollPosition = window.scrollY;
        const heroSection = document.querySelector('.hero-section');
        
        if (heroSection && scrollPosition < window.innerHeight) {
            const parallaxElements = heroSection.querySelectorAll('.floating-element');
            parallaxElements.forEach((element, index) => {
                const speed = 0.5 + (index * 0.1);
                element.style.transform = `translateY(${scrollPosition * speed}px)`;
            });
        }
    });
}

/* ============================
   EFECTOS 3D Y TILT (mousemove)
   ============================ */
function initialize3DEffects() {
    // 3D hero effect removed (optimized for mobile/tablet)
    // Tilt effect for plan cards
    const cards = document.querySelectorAll('.plan-card');
    cards.forEach(card => {
        // wrap inner content for depth layering if not present
        if (!card.querySelector('.card-inner')) {
            const inner = document.createElement('div');
            inner.className = 'card-inner';
            while (card.firstChild) inner.appendChild(card.firstChild);
            card.appendChild(inner);
        }
        const inner = card.querySelector('.card-inner');
        let cardRaf = null;
        const cstate = { rx: 0, ry: 0 };

        function applyCardTransform() {
            card.style.transform = `rotateX(${cstate.rx}deg) rotateY(${cstate.ry}deg)`;
            inner.style.transform = `translateZ(18px)`;
            cardRaf = null;
        }

        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const dx = (x - 0.5) * 2;
            const dy = (y - 0.5) * 2;
            cstate.ry = dx * 6;
            cstate.rx = -dy * 6;
            if (!cardRaf) cardRaf = requestAnimationFrame(applyCardTransform);
        });

        card.addEventListener('mouseleave', function() {
            cstate.rx = 0; cstate.ry = 0;
            inner.style.transform = '';
            if (!cardRaf) cardRaf = requestAnimationFrame(applyCardTransform);
        });
    });
}

/* ============================
   SMOOTH SCROLL
   ============================ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        
        if (target) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

/* ============================
   CONTADOR DE NÚMEROS (OPCIONAL)
   ============================ */
function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current) + '+';
    }, 16);
}

/* ============================
   DETECCIÓN DE DISPOSITIVO
   ============================ */
function isMobile() {
    return window.innerWidth <= 768;
}

/* ============================
   MANEJO DE REDIMENSIONAMIENTO
   ============================ */
window.addEventListener('resize', function() {
    // Cerrar menú mobile si se expande la ventana
    if (!isMobile()) {
        const navMenu = document.getElementById('navMenu');
        const menuToggle = document.getElementById('menuToggle');
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
    }
});

/* ============================
   FUNCIÓN DE UTILIDAD PARA AÑADIR CLASE
   ============================ */
function addClassToElements(selector, className, delay = 0) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add(className);
        }, delay * index);
    });
}

/* ============================
   MEJORA DE ACCESIBILIDAD
   ============================ */
document.querySelectorAll('button, a').forEach(element => {
    if (!element.getAttribute('aria-label')) {
        const text = element.textContent.trim();
        if (text) {
            element.setAttribute('aria-label', text);
        }
    }
});

/* ============================
   LAZY LOADING PARA IMÁGENES
   ============================ */
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
}

/* ============================
   MANEJO DE ERRORES DE RED
   ============================ */
window.addEventListener('offline', function() {
    showNotification('Conexión perdida. Por favor verifica tu conexión a internet.', 'error');
});

window.addEventListener('online', function() {
    showNotification('Conexión restaurada.', 'success');
});

/* ============================
   FUNCIONES AUXILIARES PARA PRODUCCIÓN
   ============================ */

// Función para obtener datos de los planes (útil para API)
function getPlanes() {
    return {
        inalambrico: [
            { velocidad: 15, precio: 290, caracteristicas: ['Internet Ilimitado', 'Con Antena', 'Velocidad hasta 15 Mbps', 'Soporte 24/7'] },
            { velocidad: 20, precio: 340, caracteristicas: ['Internet Ilimitado', 'Con Antena', 'Velocidad hasta 20 Mbps', 'Soporte Prioritario'] },
            { velocidad: 30, precio: 440, caracteristicas: ['Internet Ilimitado', 'Con Antena', 'Velocidad hasta 30 Mbps', 'Soporte VIP'] }
        ],
        fibra: [
            { velocidad: 30, tipo: 'LITE', precio: 289, caracteristicas: ['Fibra Óptica Dedicada', 'Velocidad hasta 30 Mbps', 'Router Incluido', 'Soporte 24/7'] },
            { velocidad: 80, tipo: 'BÁSICO', precio: 320, caracteristicas: ['Fibra Óptica Dedicada', 'Velocidad hasta 80 Mbps', 'Router Premium', 'Soporte Prioritario'] },
            { velocidad: 150, tipo: 'MEDIO', precio: 440, caracteristicas: ['Fibra Óptica Dedicada', 'Velocidad hasta 150 Mbps', 'Router Premium', 'Soporte VIP'] },
            { velocidad: 200, tipo: 'AVANZADO', precio: 560, caracteristicas: ['Fibra Óptica Dedicada', 'Velocidad hasta 200 Mbps', 'Router Premium', 'Soporte Premium'] },
            { velocidad: 300, tipo: 'ULTRA', precio: 680, caracteristicas: ['Fibra Óptica Dedicada', 'Velocidad hasta 300 Mbps', 'Router Premium', 'Soporte Dedicado'] }
        ]
    };
}

// Función para trackear eventos
function trackEvent(eventName, eventData) {
    console.log(`Event: ${eventName}`, eventData);
    // Aquí puedes integrar con servicios como Google Analytics
}

// Función para validar email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Función para validar teléfono
function isValidPhone(phone) {
    const re = /^[\d\s\-\+\(\)]+$/;
    return re.length >= 7 && re.test(phone);
}

console.log('León Telecom - Página Web Cargada Exitosamente');

/* ============================
   ANIMACIONES MEJORADAS - ENHANCED
   ============================ */

// Agregar clases de animación a elementos específicos
document.addEventListener('DOMContentLoaded', function() {
    // Animar icons flotantes
    document.querySelectorAll('.plan-header i, .value-card i, .info-card i, .feature-item i').forEach(el => {
        el.classList.add('animate-liquid-float');
    });
    
    // Animar precios con glow
    document.querySelectorAll('.plan-price').forEach(el => {
        el.classList.add('animate-text-glow');
    });
    
    // Hover avanzado en tarjetas
    document.querySelectorAll('.plan-card').forEach(card => {
        card.classList.add('hover-lift-advanced');
    });
    
    document.querySelectorAll('.value-card').forEach(card => {
        card.classList.add('hover-lift-advanced');
    });
    
    document.querySelectorAll('.info-card').forEach(card => {
        card.classList.add('hover-lift-advanced');
    });
    
    // Efecto de brillo en botones
    document.querySelectorAll('.btn').forEach(btn => {
        btn.classList.add('glow-border');
    });
});

// Animación de scroll parallax mejorada
window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    const heroSection = document.querySelector('.hero-section');
    
    if (heroSection) {
        const parallaxElements = heroSection.querySelectorAll('.floating-element');
        parallaxElements.forEach((element, index) => {
            const speed = 0.3 + (index * 0.2);
            const rotation = scrollPosition * 0.5;
            element.style.transform = `translateY(${scrollPosition * speed}px) rotate(${rotation}deg)`;
        });
    }
});

// Función para agregar animación de entrada staggered
function staggerAnimation(selector, animationClass, delay = 0.1) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el, index) => {
        el.style.animation = `cascade-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay * index}s both`;
        el.classList.add(animationClass, `stagger-${(index % 6) + 1}`);
    });
}

// Efecto de hover mejorado para todos los elementos interactivos
document.querySelectorAll('a, button, .plan-card, .value-card, .info-card').forEach(el => {
    el.addEventListener('mouseenter', function() {
        this.style.filter = 'drop-shadow(0 0 15px rgba(0, 212, 212, 0.5))';
    });
    el.addEventListener('mouseleave', function() {
        this.style.filter = 'drop-shadow(0 0 0px rgba(0, 212, 212, 0))';
    });
});

// Animaciones de elementos hero mejoradas
const heroTitle = document.querySelector('.hero-title');
const heroSubtitle = document.querySelector('.hero-subtitle');

if (heroTitle) {
    heroTitle.classList.add('glow-text');
}

if (heroSubtitle) {
    heroSubtitle.classList.add('animate-liquid-float');
}

console.log('Animaciones avanzadas cargadas con éxito');
