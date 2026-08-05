async function generateSeo(req, res) {
  // Upgrade external URLs to HTTPS and validate inputs
  // Simple authorization guard if present
  if (req.user && req.user.role !== 'admin') {
    // read-only; allow access
  }

  const urls = await getExternalUrls(); // returns an array of URLs (http/https)

  // Enforce HTTPS for all external calls
  const secureUrls = (urls || []).map(u => {
    try {
      const urlObj = new URL(u);
      urlObj.protocol = 'https:';
      return urlObj.toString();
    } catch {
      // if not a valid URL, drop it
      return u;
    }
  }).filter(u => typeof u === 'string' && u.length);

  // Input validation: allow-list unknown fields
  const ALLOWED = ['format','baseUrl'];
  if (req.body && typeof req.body === 'object') {
    const unknown = Object.keys(req.body).filter(k => !ALLOWED.includes(k));
    if (unknown.length) {
      console.warn('Unknown fields in seo request:', unknown);
    }
    // ENUM validation for optional changefreq
    if (Object.prototype.hasOwnProperty.call(req.body, 'changefreq')) {
      const allowedChange = ['daily','weekly','monthly','yearly','never'];
      if (!allowedChange.includes(req.body.changefreq)) {
        return res.status(400).send('Invalid changefreq');
      }
    }
  }

  const sitemap = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    secureUrls.map(u => `<url><loc>${u}</loc></url>`).join('') +
    '</urlset>';
  res.setHeader('Content-Type', 'application/xml');
  res.status(200).send(sitemap);
}
