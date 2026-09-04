require('dotenv').config();

const express = require('express');
const path = require('path');

const { searchProductPrices } = require('./lib/priceSearch');
const config = require('./lib/config');
const adminAuth = require('./lib/adminAuth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Nombre maximum de produits qu'un utilisateur peut soumettre en une seule requête.
const MAX_PRODUCTS = 10;

app.post('/api/search', async (req, res) => {
  const rawProducts = Array.isArray(req.body?.products) ? req.body.products : [];

  const products = rawProducts
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter((p) => p.length > 0)
    .slice(0, MAX_PRODUCTS);

  if (products.length === 0) {
    return res.status(400).json({ error: 'Veuillez saisir au moins un produit à rechercher.' });
  }

  const apiKey = config.getSerperApiKey();

  if (!apiKey) {
    return res.status(503).json({
      error:
        "Aucune clé Serper configurée. Rendez-vous sur /admin pour renseigner votre clé et activer la recherche de prix.",
    });
  }

  try {
    const results = await Promise.all(
      products.map(async (query) => {
        try {
          const offers = await searchProductPrices(query, apiKey);
          return { query, offers, error: null };
        } catch (err) {
          return { query, offers: [], error: err.message || 'Erreur inconnue lors de la recherche.' };
        }
      })
    );

    res.json({ results });
  } catch (err) {
    console.error('Erreur de recherche:', err);
    res.status(500).json({ error: "Une erreur est survenue pendant la recherche des prix." });
  }
});

// Route de santé simple, utile pour le monitoring et le diagnostic.
app.get('/api/health', (_req, res) => {
  const { source: adminPasswordSource } = config.getAdminPassword();
  res.json({
    status: 'ok',
    hasApiKey: Boolean(config.getSerperApiKey()),
    adminPasswordSource, // 'env' si ADMIN_PASSWORD est définie, 'generated' sinon
  });
});

// --- Administration : connexion + configuration de la clé Serper ---

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  const { password: expected } = config.getAdminPassword();

  const submitted = typeof password === 'string' ? password.trim() : '';

  if (!submitted || !adminAuth.timingSafeEqualStrings(submitted, expected)) {
    return res.status(401).json({ error: 'Mot de passe incorrect.' });
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
    return res.status(400).json({ error: 'Veuillez saisir une clé Serper valide.' });
  }

  if (process.env.SERPER_API_KEY) {
    return res.status(409).json({
      error:
        "La clé Serper est actuellement définie via la variable d'environnement SERPER_API_KEY, qui est prioritaire. Retirez-la du fichier .env pour pouvoir la gérer depuis cette page.",
    });
  }

  config.setSerperApiKey(serperApiKey.trim());
  res.json({ ok: true });
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.listen(PORT, () => {
  console.log(`Awsert est lancé sur http://localhost:${PORT}`);

  const { password, generated } = config.getAdminPassword();
  if (generated) {
    console.log('');
    console.log('========================================================');
    console.log(' Mot de passe administrateur généré automatiquement :');
    console.log(` ${password}`);
    console.log(' Connectez-vous sur /admin pour configurer votre clé Serper.');
    console.log(' (Définissez ADMIN_PASSWORD dans .env pour choisir le vôtre.)');
    console.log('========================================================');
    console.log('');
  } else {
    console.log('Page d\'administration disponible sur /admin.');
  }
});
