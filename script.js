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
});
