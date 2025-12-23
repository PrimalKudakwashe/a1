// enhancements.js
// Handles form submission to Formspree and small UI helpers.
// Works with updated index.html that uses:
//   <form id="contactForm" ...>
//   <input id="email" name="email" type="email" required>
// Provides fallback for legacy name="_replyto".

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const formNote = form ? form.querySelector('.form-note') : null;

  // Utility to show user-facing messages
  function showNote(text, isError = false) {
    if (formNote) {
      formNote.textContent = text;
      formNote.style.color = isError ? 'crimson' : 'green';
    } else {
      // fallback to console
      console[isError ? 'error' : 'log'](text);
    }
  }

  if (!form) {
    console.warn('enhancements.js: contact form (#contactForm) not found.');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // we handle submission

    // Collect form data
    const data = new FormData(form);

    // Compatibility: Formspree used to commonly accept _replyto.
    // If the current index.html uses name="email" (recommended), prefer that.
    const emailValue = data.get('email') || data.get('_replyto') || '';
    if (!emailValue.trim()) {
      showNote('Please enter your email address.', true);
      // Set focus to the email field if possible
      const emailEl = form.querySelector('[name="email"], [name="_replyto"]');
      if (emailEl) emailEl.focus();
      return;
    }

    // Log payload for debugging (open DevTools to inspect)
    console.log('Submitting form to', form.action);
    for (const [k, v] of data.entries()) {
      console.log(k + ':', v);
    }

    // Send to Formspree
    try {
      // Note: Do NOT set the Content-Type header when sending FormData.
      const resp = await fetch(form.action, {
        method: form.method || 'POST',
        body: data,
        headers: {
          // Request JSON response from Formspree when available
          'Accept': 'application/json'
        }
      });

      // Formspree returns JSON for Accept: application/json; handle both JSON and non-JSON
      let json;
      const contentType = resp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        json = await resp.json();
      } else {
        // fallback - try text
        const text = await resp.text();
        try { json = JSON.parse(text); } catch (_) { json = null; }
      }

      if (resp.ok) {
        showNote('Message sent. Thank you!');
        // If the form contains a _next hidden field, redirect to it (Formspree uses this)
        const next = data.get('_next');
        if (next) {
          // small delay so user can see the success message
          setTimeout(() => { window.location.href = next; }, 600);
          return;
        }

        // Otherwise, optionally reset the form
        form.reset();
      } else {
        // resp not ok: try to show helpful message from Formspree response
        const errorMessage =
          json?.error ||
          (Array.isArray(json?.errors) && json.errors.map(e => e.message).join('; ')) ||
          `Submission failed (status ${resp.status}).`;
        showNote(errorMessage, true);
        console.error('Formspree error response:', json || await resp.text());
      }
    } catch (err) {
      showNote('Network error — please try again later.', true);
      console.error('Form submission error:', err);
    }
  });

  // Optional extras: back-to-top button and theme toggle wiring if present
  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem('site-theme');
    const dark = saved ? saved === 'dark' : prefersDark;
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    themeToggle.setAttribute('aria-pressed', String(dark));
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.dataset.theme === 'dark';
      document.documentElement.dataset.theme = isDark ? 'light' : 'dark';
      localStorage.setItem('site-theme', isDark ? 'light' : 'dark');
      themeToggle.setAttribute('aria-pressed', String(!isDark));
    });
  }
});
