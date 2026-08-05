import { Router } from 'express';
const router = Router();

function ensureHttps(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') {
      u.protocol = 'https:';
      return u.toString();
    }
    return url;
  } catch {
    return url;
  }
}

router.get('/sitemap', async (req, res) => {
  // Unknown fields detection (non-blocking)
  const ALLOWED: string[] = [];
  const bodyObj = req.body || {};
  const unknownFields = Object.keys(bodyObj).filter((k) => !Object.prototype.hasOwnProperty.call(bodyObj, k) || !ALLOWED.includes(k));
  if (unknownFields.length) {
    console.warn('Unknown fields in request body:', unknownFields);
  }

  const rawUrls = [
    'http://example.com/page1',
    'http://example.org/page2',
  ];
  const urls = rawUrls.map(ensureHttps);

  const locs = urls.map((u) => `<loc>${u}</loc>`).join('');
  const sitemap = `<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">${locs}</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(sitemap);
});

export default router;