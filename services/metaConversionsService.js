const crypto = require('crypto');
const { getMetaPixelId } = require('../config/env');

function getMetaAccessToken() {
  return (process.env.META_CONVERSIONS_API_ACCESS_TOKEN || '').trim();
}

function hashMetaValue(value) {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function hashMetaPhone(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return null;
  return crypto.createHash('sha256').update(digits).digest('hex');
}

function isMetaConversionsConfigured() {
  return Boolean(getMetaPixelId() && getMetaAccessToken());
}

async function sendLeadEvent({
  eventId,
  email,
  phone,
  name,
  ip,
  userAgent,
  sourceUrl,
  fbp,
  fbc,
}) {
  const pixelId = getMetaPixelId();
  const accessToken = getMetaAccessToken();
  if (!pixelId || !accessToken || !eventId) return false;

  const userData = {};
  const emailHash = hashMetaValue(email);
  const phoneHash = hashMetaPhone(phone);
  const firstName = name?.trim().split(/\s+/)[0];
  const firstNameHash = hashMetaValue(firstName);

  if (emailHash) userData.em = [emailHash];
  if (phoneHash) userData.ph = [phoneHash];
  if (firstNameHash) userData.fn = [firstNameHash];
  if (ip) userData.client_ip_address = ip;
  if (userAgent) userData.client_user_agent = userAgent;
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const payload = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: sourceUrl || undefined,
        user_data: userData,
      },
    ],
  };

  const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Meta Conversions API ${res.status}: ${detail}`.trim());
  }

  return true;
}

module.exports = {
  isMetaConversionsConfigured,
  sendLeadEvent,
};
