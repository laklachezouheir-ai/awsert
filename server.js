require('dotenv').config();

const fs = require('fs');
const express = require('express');
const path = require('path');

const { searchProductPrices } = require('./lib/priceSearch');
const config = require('./lib/config');
const adminAuth = require('./lib/adminAuth');
const { isValidHexColor, escapeHtml, getInitial } = require('./lib/color');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Maximum number of products a user can submit in a single request.
const MAX_PRODUCTS = 10;

/**
 * Serves an HTML page from public/, injecting the brand customization
 * (site name, accent color) directly server-side: no flash of default
 * content, and it works even without JavaScript.
 */
function renderBrandedPage(res, fileName) {
  const branding = config.getBranding();
  const siteName = escapeHtml(branding.siteName);
  const initial = getInitial(branding.siteName);

  let html = fs.readFileSync(path.join(__dirname, 'public', fileName), 'utf8');
  html = html
    .replaceAll('{{SITE_NAME}}', siteName)
    .replaceAll('{{SITE_INITIAL}}', initial)
    .replaceAll('{{ACCENT_COLOR}}', branding.accentColor)
    .replaceAll('{{ACCENT_HOVER}}', branding.accentHover)
    .replaceAll('{{ACCENT_SOFT}}', branding.accentSoft)
    .replaceAll('{{ACCENT_BORDER}}', branding.accentBorder);

  res.type('html').send(html);
}

app.get('/', (_req, res) => renderBrandedPage(res, 'index.html'));
app.get('/index.html', (_req, res) => renderBrandedPage(res, 'index.html'));
app.get('/admin', (_req, res) => renderBrandedPage(res, 'admin.html'));
app.get('/admin.html', (_req, res) => renderBrandedPage(res, 'admin.html'));

app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/search', async (req, res) => {
  const rawProducts = Array.isArray(req.body?.products) ? req.body.products : [];

  const products = rawProducts
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter((p) => p.length > 0)
    .slice(0, MAX_PRODUCTS);

  if (products.length === 0) {
    return res
      .status(400)
      .json({ code: 'NO_PRODUCTS', error: 'Please enter at least one product to search.' });
  }

  const apiKey = config.getSerperApiKey();

  if (!apiKey) {
    return res.status(503).json({
      code: 'NO_API_KEY',
      error: 'No Serper key configured. Go to /admin to add your key and enable price search.',
    });
  }

  try {
    const results = await Promise.all(
      products.map(async (query) => {
        try {
          const { offers, location } = await searchProductPrices(query, apiKey);
          return { query, offers, location, error: null, code: null };
        } catch (err) {
          return {
            query,
            offers: [],
            location: null,
            error: err.message || 'Unknown error during search.',
            code: err.code || null,
          };
        }
      })
    );

    res.json({ results });
  } catch (err) {
    console.error('Erreur de recherche:', err);
    res
      .status(500)
      .json({ code: 'SEARCH_ERROR', error: 'An error occurred while searching for prices.' });
  }
});

// Simple health route, useful for monitoring and diagnostics.
app.get('/api/health', (_req, res) => {
  const { source: adminPasswordSource } = config.getAdminPassword();
  res.json({
    status: 'ok',
    hasApiKey: Boolean(config.getSerperApiKey()),
    adminPasswordSource, // 'env' if ADMIN_PASSWORD is set, 'generated' otherwise
  });
});

// --- Administration: login + Serper key configuration ---

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  const { password: expected } = config.getAdminPassword();

  const submitted = typeof password === 'string' ? password.trim() : '';

  if (!submitted || !adminAuth.timingSafeEqualStrings(submitted, expected)) {
    return res.status(401).json({ code: 'INVALID_PASSWORD', error: 'Incorrect password.' });
  }

  const token = adminAuth.createSession();
  res.setHeader(
    'Set-Cookie',
    `${adminAuth.COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`
  );
  res.json({ ok: true });
});

app.post('/api/admin/logout', (req, res) => {
  const cookies = adminAuth.parseCookies(req.headers.cookie);
  adminAuth.destroySession(cookies[adminAuth.COOKIE_NAME]);
  res.setHeader('Set-Cookie', `${adminAuth.COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0`);
  res.json({ ok: true });
});

app.get('/api/admin/config', adminAuth.requireAdmin, (_req, res) => {
  const key = config.getSerperApiKey();
  const maskedKey = key ? `${'•'.repeat(Math.max(key.length - 4, 0))}${key.slice(-4)}` : null;
  res.json({
    hasKey: Boolean(key),
    maskedKey,
    keySource: process.env.SERPER_API_KEY ? 'env' : 'admin',
  });
});

app.post('/api/admin/config', adminAuth.requireAdmin, (req, res) => {
  const { serperApiKey } = req.body || {};

  if (typeof serperApiKey !== 'string' || serperApiKey.trim().length === 0) {
    return res.status(400).json({ code: 'INVALID_KEY', error: 'Please enter a valid Serper key.' });
  }

  if (process.env.SERPER_API_KEY) {
    return res.status(409).json({
      code: 'KEY_ENV_LOCKED',
      error:
        'The Serper key is currently set via the SERPER_API_KEY environment variable, which takes priority. Remove it from .env to manage it from this page.',
    });
  }

  config.setSerperApiKey(serperApiKey.trim());
  res.json({ ok: true });
});

// --- Customization: site name and accent color ---

// Public: lets the frontend (i18n, dynamic text) know the site name
// without being authenticated.
app.get('/api/branding', (_req, res) => {
  const { siteName, accentColor } = config.getBranding();
  res.json({ siteName, accentColor });
});

app.get('/api/admin/branding', adminAuth.requireAdmin, (_req, res) => {
  const { siteName, accentColor } = config.getBranding();
  res.json({ siteName, accentColor });
});

app.post('/api/admin/branding', adminAuth.requireAdmin, (req, res) => {
  const { siteName, accentColor } = req.body || {};
  const updates = {};

  if (siteName !== undefined) {
    const trimmed = typeof siteName === 'string' ? siteName.trim() : '';
    if (!trimmed || trimmed.length > 40) {
      return res.status(400).json({
        code: 'INVALID_SITE_NAME',
        error: 'Site name must be between 1 and 40 characters.',
      });
    }
    updates.siteName = trimmed;
  }

  if (accentColor !== undefined) {
    if (!isValidHexColor(accentColor)) {
      return res.status(400).json({
        code: 'INVALID_COLOR',
        error: 'Accent color must be a hex value like #5b7c99.',
      });
    }
    updates.accentColor = accentColor;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ code: 'NO_CHANGES', error: 'Nothing to update.' });
  }

  config.setBranding(updates);
  const { siteName: newSiteName, accentColor: newAccentColor } = config.getBranding();
  res.json({ ok: true, siteName: newSiteName, accentColor: newAccentColor });
});

app.listen(PORT, () => {
  const { siteName } = config.getBranding();
  console.log(`${siteName} is running on http://localhost:${PORT}`);

  const { password, generated } = config.getAdminPassword();
  if (generated) {
    console.log('');
    console.log('========================================================');
    console.log(' Auto-generated admin password:');
    console.log(` ${password}`);
    console.log(' Log in at /admin to configure your Serper key and branding.');
    console.log(' (Set ADMIN_PASSWORD in .env to choose your own.)');
    console.log('========================================================');
    console.log('');
  } else {
    console.log('Admin panel available at /admin.');
  }
});
