(function () {
  'use strict';

  const form = document.getElementById('presentation-form');
  const statusEl = document.getElementById('presentation-status');

  if (!form || !statusEl) return;

  const msgRequired = form.dataset.msgRequired || 'Please provide your full name and email.';
  const msgError = form.dataset.msgError || 'Something went wrong. Please try again.';
  const thankYouUrl = form.dataset.thankYouUrl || '/en/thank-you';
  const submitBtn = form.querySelector('[type="submit"]');
  const defaultBtnLabel = submitBtn?.textContent?.trim() || 'Submit';

  function fieldValue(id) {
    const el = document.getElementById(id);
    return el && 'value' in el ? String(el.value).trim() : '';
  }

  function setSubmitting(isSubmitting) {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    if (isSubmitting) {
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.textContent = submitBtn.dataset.loadingLabel || 'Sending…';
    } else {
      submitBtn.removeAttribute('aria-busy');
      submitBtn.textContent = defaultBtnLabel;
    }
  }

  function showError(message) {
    statusEl.textContent = message;
    statusEl.className = 'presentation-form__status presentation-form__status--error';
    statusEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = '';
    statusEl.className = 'presentation-form__status';

    const eventId =
      typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `lead-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const metaCookies =
      typeof window.MetaLead !== 'undefined' ? window.MetaLead.getMetaCookies() : { fbp: '', fbc: '' };

    const payload = {
      name: fieldValue('full-name'),
      email: fieldValue('email'),
      phone: fieldValue('phone') || undefined,
      country: fieldValue('country') || undefined,
      purchase_timeline: fieldValue('timeline') || undefined,
      message: fieldValue('message') || undefined,
      language: fieldValue('language') || document.body.dataset.locale || 'en',
      website: fieldValue('website') || '',
      meta_event_id: eventId,
      meta_fbp: metaCookies.fbp || undefined,
      meta_fbc: metaCookies.fbc || undefined,
    };

    if (!payload.name || !payload.email) {
      showError(msgRequired);
      return;
    }

    setSubmitting(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const serverError =
          res.status === 502 || res.status === 504
            ? 'The server is temporarily unavailable. Please try again in a moment.'
            : data.error || msgError;
        throw new Error(serverError);
      }

      const leadEventId = data.eventId || eventId;

      try {
        sessionStorage.setItem('meta_lead_event_id', leadEventId);
      } catch (_) {
        /* Private browsing may block storage */
      }

      let redirected = false;
      const redirect = () => {
        if (redirected) return;
        redirected = true;
        window.location.assign(thankYouUrl);
      };

      if (typeof window.MetaLead !== 'undefined') {
        window.MetaLead.trackLead(leadEventId);
      } else if (typeof window.fbq === 'function') {
        try {
          window.fbq('track', 'Lead', {}, {
            eventID: leadEventId,
            event_callback: redirect,
          });
          window.setTimeout(redirect, 1500);
          return;
        } catch (_) {
          /* Pixel blocked or unavailable — still redirect */
        }
      }

      redirect();
    } catch (err) {
      const message =
        err.name === 'AbortError'
          ? 'The request timed out. Please check your connection and try again.'
          : err.message || msgError;
      showError(message);
      setSubmitting(false);
    } finally {
      window.clearTimeout(timeoutId);
    }
  });
})();
