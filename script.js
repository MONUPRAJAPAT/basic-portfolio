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

  // Smooth scroll for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const navHeight = document.querySelector('nav').offsetHeight;
        const targetPosition = target.offsetTop - navHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

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

  // Intersection Observer for fade-in animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe sections
  document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
  });

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

  // ----- Three.js animated hero background -----
  function initHero3D() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas || !window.THREE || reduceMotion) return;
    const THREE = window.THREE;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1000);
    camera.position.z = 60;
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Drifting particle field
    const COUNT = 1300;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT * 3; i++) positions[i] = (Math.random() - 0.5) * 140;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const ptMat = new THREE.PointsMaterial({ size: 0.7, transparent: true, opacity: 0.85 });
    const points = new THREE.Points(geo, ptMat);
    scene.add(points);

    // Floating wireframe icosahedron
    const iso = new THREE.Mesh(
      new THREE.IcosahedronGeometry(16, 1),
      new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.35 })
    );
    scene.add(iso);

    function updateColors() {
      const dark = document.documentElement.getAttribute('data-theme') !== 'light';
      ptMat.color = new THREE.Color(dark ? 0x22d3ee : 0x3182ce);
      iso.material.color = new THREE.Color(dark ? 0x8b5cf6 : 0x2c5282);
      ptMat.opacity = dark ? 0.85 : 0.5;
      iso.material.opacity = dark ? 0.35 : 0.22;
    }
    updateColors();
    window.__heroUpdateColors = updateColors;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / Math.max(rect.height, 1);
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    let mx = 0, my = 0;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    });

    let raf = null, running = true;
    function animate() {
      raf = requestAnimationFrame(animate);
      points.rotation.y += 0.0008;
      points.rotation.x += 0.0003;
      iso.rotation.y += 0.0015;
      iso.rotation.x += 0.0010;
      camera.position.x += (mx * 14 - camera.position.x) * 0.04;
      camera.position.y += (-my * 14 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    }
    animate();

    // Pause when tab is hidden to save resources
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
  initHero3D();
});
