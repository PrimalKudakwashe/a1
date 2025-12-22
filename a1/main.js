// Small enhancements: year, theme toggle, active nav highlighting, back-to-top, and contact form feedback.
(() => {
  // Insert current year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Theme toggle: respects stored preference, then system preference
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const stored = localStorage.getItem('theme'); // "dark" or "light"
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(name) {
    if (name === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(name === 'dark'));
  }

  applyTheme(stored || (prefersDark ? 'dark' : 'light'));

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = root.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      themeToggle.setAttribute('aria-pressed', String(isDark));
    });
  }

  // Active nav link highlighting using IntersectionObserver
  const navLinks = document.querySelectorAll('.nav a');
  const sections = Array.from(navLinks).map(a => document.getElementById(a.getAttribute('data-target')));
  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const link = document.querySelector(`.nav a[data-target="${id}"]`);
        if (link) link.classList.toggle('active', entry.isIntersecting);
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

    sections.forEach(s => { if (s) observer.observe(s); });
  }

  // Back to top button visibility and behavior
  const topBtn = document.getElementById('backToTop');
  const showOffset = 300;
  function checkScroll() {
    if (!topBtn) return;
    topBtn.style.display = window.scrollY > showOffset ? 'inline-block' : 'none';
  }
  checkScroll();
  window.addEventListener('scroll', checkScroll, { passive: true });
  if (topBtn) topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Contact form: simple success/fail message (no client-side sending)
  const form = document.getElementById('contactForm');
  if (form) {
    const note = form.querySelector('.form-note');
    form.addEventListener('submit', (e) => {
      // Let the browser submit the form to the configured action.
      // Show immediate feedback while the request completes.
      if (note) note.textContent = 'Sending…';
      // After submit the page might reload (Formspree redirects or responds),
      // so this is just an inline UX improvement.
    });
  }
})();