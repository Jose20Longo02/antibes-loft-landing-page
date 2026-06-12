(function () {
  'use strict';

  function readCookie(name) {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function getMetaCookies() {
    return {
      fbp: readCookie('_fbp'),
      fbc: readCookie('_fbc'),
    };
  }

  function trackLead(eventId) {
    if (!eventId || typeof window.fbq !== 'function') return;
    try {
      window.fbq('track', 'Lead', {}, { eventID: eventId });
    } catch (_) {
      /* Pixel blocked or unavailable */
    }
  }

  window.MetaLead = { trackLead, getMetaCookies };
})();
