(function () {
  'use strict';

  const form = document.getElementById('presentation-form');
  const statusEl = document.getElementById('presentation-status');

  if (!form || !statusEl) return;

  const msgRequired = form.dataset.msgRequired || 'Please provide your full name and email.';
  const msgError = form.dataset.msgError || 'Something went wrong. Please try again.';
  const thankYouUrl = form.dataset.thankYouUrl || '/en/thank-you';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';
    statusEl.className = 'presentation-form__status';

    const eventId =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim() || undefined,
      country: form.country.value.trim() || undefined,
      purchase_timeline: form.purchase_timeline.value || undefined,
      message: form.message.value.trim() || undefined,
      language: form.language?.value || document.body.dataset.locale || 'en',
      website: form.website?.value || '',
      meta_event_id: eventId,
    };

    if (!payload.name || !payload.email) {
      statusEl.textContent = msgRequired;
      statusEl.classList.add('presentation-form__status--error');
      statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
    }

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || msgError);
      }

      const leadEventId = data.eventId || eventId;
      let redirected = false;
      const redirect = () => {
        if (redirected) return;
        redirected = true;
        window.location.assign(thankYouUrl);
      };

      try {
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'Lead', {}, {
            eventID: leadEventId,
            event_callback: redirect,
          });
        }
      } catch (_) {
        /* Pixel blocked or unavailable — still redirect */
      }

      window.setTimeout(redirect, typeof window.fbq === 'function' ? 1500 : 0);
    } catch (err) {
      statusEl.textContent = err.message || msgError;
      statusEl.classList.add('presentation-form__status--error');
      statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute('aria-busy');
      }
    }
  });
})();
