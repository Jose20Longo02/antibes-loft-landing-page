(function () {
  'use strict';

  const STORAGE_KEY = 'meta_lead_event_id';
  const eventId = sessionStorage.getItem(STORAGE_KEY);
  if (!eventId) return;

  sessionStorage.removeItem(STORAGE_KEY);

  if (typeof window.MetaLead !== 'undefined') {
    window.MetaLead.trackLead(eventId);
    return;
  }

  if (typeof window.fbq === 'function') {
    try {
      window.fbq('track', 'Lead', {}, { eventID: eventId });
    } catch (_) {
      /* Pixel blocked or unavailable */
    }
  }
})();
