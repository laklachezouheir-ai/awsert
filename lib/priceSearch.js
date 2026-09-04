const SERPER_ENDPOINT = 'https://google.serper.dev/shopping';

// Nombre d'offres renvoyées par produit recherché.
const MAX_OFFERS = 8;

const CURRENCY_SYMBOLS = {
  '€': 'EUR',
  '$': 'USD',
  '£': 'GBP',
  '¥': 'JPY',
};

/**
 * Extrait un montant numérique et une devise à partir d'une chaîne de prix
 * telle que renvoyée par Serper (ex: "719,00 €", "$799.00", "1.234,56 €").
 */
function parsePrice(raw) {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { amount: null, currency: null };
  }

  let currency = null;
  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (raw.includes(symbol)) {
      currency = code;
      break;
    }
  }

  let cleaned = raw.replace(/[^0-9.,]/g, '');
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > lastDot) {
    // La virgule est le séparateur décimal, les points sont des séparateurs de milliers.
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // Le point est le séparateur décimal (ou aucun séparateur), les virgules sont des milliers.
    cleaned = cleaned.replace(/,/g, '');
  }

  const amount = parseFloat(cleaned);
  return { amount: Number.isFinite(amount) ? amount : null, currency };
}

/**
 * Interroge Serper (Google Shopping) pour un produit donné et renvoie
 * une liste d'offres normalisées (titre, prix, marchand, lien, image).
 *
 * @param {string} query - Le nom du produit à rechercher.
 * @param {string} apiKey - La clé Serper à utiliser.
 * @returns {Promise<Array<{title: string, price: number|null, priceText: string, currency: string|null, source: string, link: string|null, thumbnail: string|null}>>}
 */
async function searchProductPrices(query, apiKey) {
  let response;
  try {
    response = await fetch(SERPER_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, gl: 'fr', hl: 'fr' }),
    });
  } catch (err) {
    throw new Error('Impossible de contacter le service de recherche de prix.');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Clé Serper invalide ou expirée.');
    }
    throw new Error(`Le service de recherche a répondu avec une erreur (${response.status}).`);
  }

  const data = await response.json();

  if (data.message || data.error) {
    throw new Error(data.message || data.error);
  }

  const shoppingResults = Array.isArray(data.shopping) ? data.shopping : [];

  const offers = shoppingResults.slice(0, MAX_OFFERS).map((item) => {
    const { amount, currency } = parsePrice(item.price);
    return {
      title: item.title || query,
      price: amount,
      priceText: item.price || null,
      currency,
      source: item.source || 'Marchand inconnu',
      link: item.link || null,
      thumbnail: item.imageUrl || null,
    };
  });

  // Trie par prix croissant (les offres sans prix connu sont placées en fin de liste).
  offers.sort((a, b) => {
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });

  return offers;
}

module.exports = { searchProductPrices, parsePrice };
