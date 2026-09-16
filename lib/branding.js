// Système de marque : permet de déployer le même produit sous plusieurs
// noms/identités visuelles (même code, même moteur de recherche) — utile
// pour tester plusieurs positionnements/marchés sans dupliquer le code.
// Le service Render déployé choisit sa marque via la variable
// d'environnement BRAND_ID ; chaque variante peut avoir son propre nom de
// domaine, son propre service Render, tout en partageant ce même dépôt.
const PRESETS = {
  awsert: {
    id: 'awsert',
    name: 'Awsert',
    logoInitial: 'A',
    colors: { accent: '#5b7c99', accentHover: '#4d6c86', accentSoft: '#e7edf3', accentBorder: '#cddae5' },
    title: { en: 'Awsert — Smart Price Comparison', fr: 'Awsert — Comparateur de prix intelligent' },
    description: {
      en: 'Search one or more products, Awsert scans the web and compares prices for you.',
      fr: 'Saisissez un ou plusieurs produits, Awsert scanne le web et compare les prix pour vous.',
    },
  },
  dealscout: {
    id: 'dealscout',
    name: 'DealScout',
    logoInitial: 'D',
    colors: { accent: '#d5641c', accentHover: '#b34f12', accentSoft: '#fdf1e4', accentBorder: '#f0d4b8' },
    title: { en: 'DealScout — Find the Best Deal, Fast', fr: 'DealScout — Trouvez la meilleure offre, vite' },
    description: {
      en: 'Stop overpaying. DealScout scans the web and finds you the lowest price in seconds.',
      fr: 'Arrêtez de payer trop cher. DealScout scanne le web et trouve le prix le plus bas en quelques secondes.',
    },
  },
  pricezen: {
    id: 'pricezen',
    name: 'PriceZen',
    logoInitial: 'P',
    colors: { accent: '#2e7d4f', accentHover: '#256640', accentSoft: '#e6f2ea', accentBorder: '#bfe0cc' },
    title: { en: 'PriceZen — Shop With Peace of Mind', fr: 'PriceZen — Achetez l’esprit tranquille' },
    description: {
      en: 'One search, every price compared — buy with confidence, every time.',
      fr: 'Une recherche, tous les prix comparés — achetez en toute confiance, à chaque fois.',
    },
  },
};

const DEFAULT_BRAND_ID = 'awsert';

function getBrand() {
  const id = (process.env.BRAND_ID || DEFAULT_BRAND_ID).toLowerCase();
  return PRESETS[id] || PRESETS[DEFAULT_BRAND_ID];
}

function listBrandIds() {
  return Object.keys(PRESETS);
}

module.exports = { getBrand, listBrandIds, PRESETS, DEFAULT_BRAND_ID };
