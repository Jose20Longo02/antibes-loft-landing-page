/**
 * Hidden field trap — bots that fill it receive a silent success (no email, no DB).
 */
function honeypot(fieldName = 'website') {
  return (req, res, next) => {
    const value = req.body?.[fieldName];
    if (value && String(value).trim() !== '') {
      return res.status(201).json({ success: true, data: { id: null } });
    }
    next();
  };
}

module.exports = { honeypot };
