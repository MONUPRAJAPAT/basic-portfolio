function toggleMenu() {
  const menu = document.querySelector(".menu-links");
  const icon = document.querySelector(".hamburger-icon");
  menu.classList.toggle("open");
  icon.classList.toggle("open");
}

// Update current year in footer
document.addEventListener("DOMContentLoaded", function() {
  const yearElement = document.getElementById("current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // (Anchor smooth-scroll is handled by initSmoothScroll() below — Lenis-aware.)

  // Nav scroll effect
  const nav = document.querySelector('nav');
  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });

  // Add data-level attributes to skill articles
  document.querySelectorAll('article p').forEach(p => {
    const text = p.textContent.toLowerCase().trim();
    if (text.includes('expert')) {
      p.setAttribute('data-level', 'expert');
    } else if (text.includes('advanced')) {
      p.setAttribute('data-level', 'advanced');
    } else if (text.includes('intermediate')) {
      p.setAttribute('data-level', 'intermediate');
    }
  });

  // (Section reveals are handled by initReveals() below — IntersectionObserver based.)

  // Initial load animation
  setTimeout(() => {
    document.body.style.opacity = '1';
  }, 100);

  // Contact form submission handler
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      // Don't prevent default - let the form submit naturally to FormSubmit
      const submitButton = contactForm.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span>Sending...</span>';
        
        // Re-enable after 5 seconds in case of error
        setTimeout(() => {
          submitButton.disabled = false;
          submitButton.innerHTML = `
            <span>Send Message</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.3334 1.66666L9.16669 10.8333M18.3334 1.66666L12.5001 18.3333L9.16669 10.8333M18.3334 1.66666L1.66669 7.49999L9.16669 10.8333" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
        }, 5000);
      }
    });
  }

  // ----- Preferences -----
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none)').matches;

  // ----- Theme toggle (dark default, persisted) -----
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
    if (window.__heroUpdateColors) window.__heroUpdateColors();
  }
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }
  document.querySelectorAll('#theme-toggle, #theme-toggle-mobile').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });

  // ----- 3D tilt on project cards -----
  if (!reduceMotion && !isTouch) {
    const MAX_TILT = 9;
    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const ry = (px - 0.5) * 2 * MAX_TILT;
        const rx = -(py - 0.5) * 2 * MAX_TILT;
        card.style.transform =
          `translateY(-12px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ----- Shared scroll progress (0..1 across the whole page) -----
  let scrollProgress = 0;
  function computeScrollProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  computeScrollProgress();
  window.addEventListener('scroll', computeScrollProgress, { passive: true });
  window.addEventListener('resize', computeScrollProgress);

  // ----- Global Three.js background: a tunnel the camera flies through on scroll -----
  function initScene3D() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || !window.THREE || reduceMotion) return;
    const THREE = window.THREE;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1200);
    camera.position.z = 60;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !isTouch });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouch ? 1.5 : 2));

    // Particle tunnel — distributed across a long Z volume, recycled around the camera
    const LEN = 600;
    const SPREAD = 95;
    const COUNT = isTouch ? 900 : 2600;
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * SPREAD * 2;
      pos[i * 3 + 1] = (Math.random() - 0.5) * SPREAD * 2;
      pos[i * 3 + 2] = 60 - Math.random() * LEN;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const ptMat = new THREE.PointsMaterial({ size: 0.75, transparent: true, opacity: 0.85, depthWrite: false });
    const points = new THREE.Points(geo, ptMat);
    scene.add(points);

    // Morphing wireframe object that always floats ahead of the camera
    const iso = new THREE.Mesh(
      new THREE.IcosahedronGeometry(16, 1),
      new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.4 })
    );
    scene.add(iso);

    // Palette (theme-aware); hue is lerped across the page in the render loop
    let pPal = {}, iPal = {};
    function updateColors() {
      const dark = document.documentElement.getAttribute('data-theme') !== 'light';
      if (dark) {
        pPal = { h0: 0.52, h1: 0.80, s: 0.85, l: 0.62, op: 0.85 };
        iPal = { h0: 0.80, h1: 0.52, s: 0.70, l: 0.62, op: 0.40 };
      } else {
        pPal = { h0: 0.58, h1: 0.72, s: 0.70, l: 0.55, op: 0.5 };
        iPal = { h0: 0.62, h1: 0.55, s: 0.55, l: 0.5, op: 0.22 };
      }
      ptMat.opacity = pPal.op;
      iso.material.opacity = iPal.op;
    }
    updateColors();
    window.__heroUpdateColors = updateColors;

    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    let mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    });

    let camZ = camera.position.z;
    const attr = geo.attributes.position;
    let raf = null, running = true;
    function animate() {
      raf = requestAnimationFrame(animate);
      const p = scrollProgress;

      // Fly forward through the tunnel as the page scrolls
      const targetZ = 60 - p * (LEN - 80);
      camZ += (targetZ - camZ) * 0.06;
      camera.position.z = camZ;

      // Recycle particles to stay wrapped around the camera (works both scroll directions)
      const front = camZ + 60, back = camZ - (LEN - 60);
      for (let i = 0; i < COUNT; i++) {
        let z = pos[i * 3 + 2];
        if (z > front) z -= LEN; else if (z < back) z += LEN;
        pos[i * 3 + 2] = z;
      }
      attr.needsUpdate = true;
      points.rotation.z += 0.0004;

      // Hero object floats ahead of the camera, rotating + pulsing
      iso.position.set(Math.sin(p * 6.28) * 6, Math.cos(p * 6.28) * 4, camZ - 95);
      iso.rotation.x += 0.0016;
      iso.rotation.y += 0.0022;
      const s = 1 + Math.sin(p * Math.PI * 2) * 0.28;
      iso.scale.setScalar(s);

      // Hue shift across the page
      ptMat.color.setHSL(THREE.MathUtils.lerp(pPal.h0, pPal.h1, p), pPal.s, pPal.l);
      iso.material.color.setHSL(THREE.MathUtils.lerp(iPal.h0, iPal.h1, p), iPal.s, iPal.l);

      // Mouse parallax
      camera.position.x += (mx * 16 - camera.position.x) * 0.04;
      camera.position.y += (-my * 16 - camera.position.y) * 0.04;
      camera.lookAt(camera.position.x * 0.5, camera.position.y * 0.5, camZ - 200);

      renderer.render(scene, camera);
    }
    animate();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        running = false;
        if (raf) cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        animate();
      }
    });
  }

  // ----- Smooth scroll (Lenis) + Lenis-aware anchor links -----
  function initSmoothScroll() {
    let lenis = null;
    if (window.Lenis && !isTouch && !reduceMotion) {
      lenis = new Lenis({ duration: 1.1, smoothWheel: true });
      if (window.gsap) {
        gsap.ticker.add((t) => lenis.raf(t * 1000));
        gsap.ticker.lagSmoothing(0);
      } else {
        const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
        requestAnimationFrame(raf);
      }
      if (window.ScrollTrigger) lenis.on('scroll', window.ScrollTrigger.update);
      lenis.on('scroll', computeScrollProgress);
      window.__lenis = lenis;
    }

    const navH = () => (document.querySelector('nav') ? document.querySelector('nav').offsetHeight : 80);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (!id || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: -navH() });
        } else {
          const y = target.getBoundingClientRect().top + window.scrollY - navH();
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      });
    });
  }

  // ----- 3D scroll reveals (IntersectionObserver — robust, no scroll-lib dependency) -----
  function initReveals() {
    // If reduced-motion or no IO support, leave everything visible (never hide).
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const selector = [
      '#about .section__text__p1', '#about .title', '#about .details-container', '#about .text-container',
      '#experience .section__text__p1', '#experience .title', '#experience .experience-sub-title', '#experience article',
      '#projects .section__text__p1', '#projects .title', '#projects .project-card',
      '#contact .section__text__p1', '#contact .title', '#contact .contact-info-container', '#contact .contact-form-section'
    ].join(', ');

    const items = Array.from(document.querySelectorAll(selector));
    if (!items.length) return;
    items.forEach((el) => el.classList.add('reveal-3d'));

    const reveal = (el) => {
      // Stagger items that share a parent (cards in a grid, etc.)
      const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains('reveal-3d'));
      const idx = Math.max(0, sibs.indexOf(el));
      el.style.transitionDelay = Math.min(idx * 0.07, 0.42) + 's';
      el.classList.add('is-visible');
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    items.forEach((el) => io.observe(el));

    // Failsafe: nothing may ever stay hidden — reveal all after a few seconds.
    setTimeout(() => items.forEach((el) => el.classList.add('is-visible')), 4000);
  }

  // ----- Subtle hero parallax (manual, desktop only) -----
  function initHeroParallax() {
    if (reduceMotion || window.innerWidth < 992) return;
    const text = document.querySelector('#profile .section__text');
    const pic = document.querySelector('#profile .section__pic-container');
    if (!text && !pic) return;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      if (y <= window.innerHeight) {
        if (text) text.style.transform = 'translateY(' + (y * -0.12).toFixed(1) + 'px)';
        if (pic) pic.style.transform = 'translateY(' + (y * 0.08).toFixed(1) + 'px)';
      }
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  initSmoothScroll();
  initReveals();
  initHeroParallax();
  initScene3D();
});
