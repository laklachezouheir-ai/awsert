require('dotenv').config();

const express = require('express');
const path = require('path');

const { searchProductPrices } = require('./lib/priceSearch');

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

  if (!process.env.SERPAPI_KEY) {
    return res.status(503).json({
      error:
        "Aucune clé SerpApi configurée sur le serveur. Ajoutez SERPAPI_KEY dans le fichier .env (voir .env.example) pour activer la recherche de prix.",
    });
  }

  try {
    const results = await Promise.all(
      products.map(async (query) => {
        try {
          const offers = await searchProductPrices(query);
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

// Route de santé simple, utile pour le monitoring.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasApiKey: Boolean(process.env.SERPAPI_KEY) });
});

app.listen(PORT, () => {
  console.log(`Awsert est lancé sur http://localhost:${PORT}`);
});
