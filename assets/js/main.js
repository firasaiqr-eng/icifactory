/* =====================================
   ICI · main.js
   ===================================== */

(function() {
  'use strict';

  // ───────── LANGUAGE TOGGLE ─────────
  const STORAGE_KEY = 'ici_lang';

  function setLanguage(lang) {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

    // Toggle all elements with data-ar / data-en attributes
    document.querySelectorAll('[data-ar][data-en]').forEach(el => {
      el.textContent = el.getAttribute('data-' + lang);
    });

    // Toggle placeholder attributes
    document.querySelectorAll('[data-ar-placeholder][data-en-placeholder]').forEach(el => {
      el.setAttribute('placeholder', el.getAttribute('data-' + lang + '-placeholder'));
    });

    // Update toggle button text
    const toggle = document.querySelector('.lang-toggle');
    if (toggle) toggle.textContent = lang === 'ar' ? 'EN' : 'العربية';

    localStorage.setItem(STORAGE_KEY, lang);
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  function initLanguage() {
    const saved = localStorage.getItem(STORAGE_KEY) || 'ar';
    setLanguage(saved);

    const toggle = document.querySelector('.lang-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('lang');
        setLanguage(current === 'ar' ? 'en' : 'ar');
      });
    }
  }

  // ───────── NAVBAR SCROLL EFFECT ─────────
  function initNavScroll() {
    const nav = document.querySelector('nav');
    if (!nav) return;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    });
  }

  // ───────── MOBILE NAV TOGGLE ─────────
  function initMobileNav() {
    const toggle = document.querySelector('.mobile-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', () => {
      links.classList.toggle('mobile-open');
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
      link.addEventListener('click', () => links.classList.remove('mobile-open'));
    });
  }

  // ───────── SCROLL ANIMATIONS ─────────
  function initScrollAnimations() {
    const els = document.querySelectorAll('[data-animate]');
    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('fade-in'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    els.forEach(el => observer.observe(el));
  }

  // ───────── CONTACT FORM ─────────
  function initContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    // WhatsApp number used as fallback if email delivery fails
    const WHATSAPP_NUMBER = '97455465513';

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      const isAr = document.documentElement.lang === 'ar';
      const btn = form.querySelector('.btn-submit');
      const originalText = btn ? btn.textContent : '';
      if (btn) { btn.textContent = isAr ? 'جارٍ الإرسال…' : 'Sending…'; btn.disabled = true; }

      const data = {
        name: (form.querySelector('[name="name"]') || {}).value || '',
        company: (form.querySelector('[name="company"]') || {}).value || '',
        phone: (form.querySelector('[name="phone"]') || {}).value || '',
        email: (form.querySelector('[name="email"]') || {}).value || '',
        product: (form.querySelector('[name="product"]') || {}).value || '',
        message: (form.querySelector('[name="message"]') || {}).value || '',
      };

      // Build WhatsApp fallback link with all details pre-filled
      const lines = isAr ? [
        '🧾 طلب عرض سعر جديد من الموقع', '',
        '👤 الاسم: ' + data.name,
        data.company ? '🏢 الشركة: ' + data.company : '',
        '📞 الهاتف: ' + data.phone,
        data.email ? '📧 البريد: ' + data.email : '',
        '📦 المنتج: ' + data.product,
        data.message ? '📝 الرسالة: ' + data.message : '',
      ] : [
        '🧾 New quote request from website', '',
        '👤 Name: ' + data.name,
        data.company ? '🏢 Company: ' + data.company : '',
        '📞 Phone: ' + data.phone,
        data.email ? '📧 Email: ' + data.email : '',
        '📦 Product: ' + data.product,
        data.message ? '📝 Message: ' + data.message : '',
      ];
      const waURL = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' +
                    encodeURIComponent(lines.filter(Boolean).join('\n'));

      const formspreeId = form.getAttribute('data-formspree');
      try {
        if (formspreeId && formspreeId !== 'YOUR_FORMSPREE_ID') {
          const res = await fetch('https://formspree.io/f/' + formspreeId, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data)
          });
          if (res.ok) {
            window.location.href = 'thanks.html';
            return;
          }
        }
        // Formspree not configured or returned an error → WhatsApp fallback
        window.open(waURL, '_blank');
        setTimeout(() => { window.location.href = 'thanks.html'; }, 600);
      } catch (err) {
        // Network error → WhatsApp fallback
        window.open(waURL, '_blank');
        if (btn) { btn.textContent = originalText; btn.disabled = false; }
      }
    });
  }

  // ───────── IMAGE CAROUSEL ─────────
  function initCarousels() {
    document.querySelectorAll('.carousel').forEach((carousel) => {
      const slides = carousel.querySelectorAll('.carousel-slide');
      const dots = carousel.querySelectorAll('.carousel-dot');
      const prev = carousel.querySelector('.carousel-arrow.prev');
      const next = carousel.querySelector('.carousel-arrow.next');
      if (slides.length < 2) return;

      let current = 0;
      let timer = null;
      const INTERVAL = 4000;

      function show(index) {
        current = (index + slides.length) % slides.length;
        slides.forEach((s, i) => s.classList.toggle('active', i === current));
        dots.forEach((d, i) => d.classList.toggle('active', i === current));
      }
      function startAuto() { stopAuto(); timer = setInterval(() => show(current + 1), INTERVAL); }
      function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
      function manual(index) { show(index); startAuto(); }

      dots.forEach((dot, i) => dot.addEventListener('click', (e) => { e.preventDefault(); manual(i); }));
      if (prev) prev.addEventListener('click', (e) => { e.preventDefault(); manual(current - 1); });
      if (next) next.addEventListener('click', (e) => { e.preventDefault(); manual(current + 1); });

      // Pause auto-rotation on hover
      carousel.addEventListener('mouseenter', stopAuto);
      carousel.addEventListener('mouseleave', startAuto);

      startAuto();
    });
  }

  // ───────── INIT ─────────
  document.addEventListener('DOMContentLoaded', () => {
    initLanguage();
    initNavScroll();
    initMobileNav();
    initScrollAnimations();
    initContactForm();
    initCarousels();
  });
})();
