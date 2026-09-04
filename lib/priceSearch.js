const { detectLocationAndQuery } = require('./locationDetect');

const SERPER_ENDPOINT = 'https://google.serper.dev/shopping';

// Nombre d'offres renvoyées par produit recherché.
const MAX_OFFERS = 8;

/**
 * Construit une erreur avec un code stable (pour traduction côté client)
 * en plus du message anglais (utilisé en repli si le code est inconnu).
 */
function apiError(code, message, meta) {
  const err = new Error(message);
  err.code = code;
  if (meta) err.meta = meta;
  return err;
}

const CURRENCY_SYMBOLS = {
  '€': 'EUR',
  '$': 'USD',
  '£': 'GBP',
  '¥': 'JPY',
};

// Codes/abréviations textuels de devises (utilisés quand Serper ne renvoie
// pas de symbole, ex: "719,00 MAD" ou "719,00 DH" pour le Maroc).
const CURRENCY_CODE_ALIASES = {
  dhs: 'MAD',
  dh: 'MAD',
  mad: 'MAD',
  usd: 'USD',
  eur: 'EUR',
  gbp: 'GBP',
  cad: 'CAD',
  aed: 'AED',
  sar: 'SAR',
  qar: 'QAR',
  tnd: 'TND',
  dzd: 'DZD',
  xof: 'XOF',
  xaf: 'XAF',
  try: 'TRY',
  jpy: 'JPY',
  cny: 'CNY',
  inr: 'INR',
  brl: 'BRL',
  mxn: 'MXN',
  aud: 'AUD',
  sek: 'SEK',
  pln: 'PLN',
  krw: 'KRW',
  sgd: 'SGD',
  chf: 'CHF',
  egp: 'EGP',
};
const CURRENCY_CODE_PATTERN = new RegExp(`\\b(${Object.keys(CURRENCY_CODE_ALIASES).join('|')})\\b`, 'i');

/**
 * Extrait un montant numérique et une devise à partir d'une chaîne de prix
 * telle que renvoyée par Serper (ex: "719,00 €", "$799.00", "1.234,56 €",
 * "719,00 MAD", "719,00 DH").
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

  if (!currency) {
    const codeMatch = raw.match(CURRENCY_CODE_PATTERN);
    if (codeMatch) currency = CURRENCY_CODE_ALIASES[codeMatch[1].toLowerCase()];
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
 * Interroge Serper (Google Shopping) pour un produit donné et renvoie une
 * liste d'offres normalisées (titre, prix, marchand, lien, image), ainsi
 * que le pays ciblé par la recherche.
 *
 * Si la requête mentionne un pays (ex: "Samsung A23 au Maroc"), la
 * recherche est ciblée sur ce pays (gl/hl Google) et la mention du pays est
 * retirée du texte envoyé à Serper. Sinon, la recherche reste
 * "internationale" (gl=us, hl=en) plutôt que centrée par défaut sur un pays.
 *
 * @param {string} query - Le nom du produit à rechercher (peut mentionner un pays).
 * @param {string} apiKey - La clé Serper à utiliser.
 * @returns {Promise<{
 *   offers: Array<{title: string, price: number|null, priceText: string, currency: string|null, source: string, link: string|null, thumbnail: string|null}>,
 *   location: { code: string|null, gl: string, hl: string }
 * }>}
 */
async function searchProductPrices(query, apiKey) {
  const { code, gl, hl, currency: defaultCurrency, cleanedQuery } = detectLocationAndQuery(query);

  let response;
  try {
    response = await fetch(SERPER_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: cleanedQuery, gl, hl }),
    });
  } catch (err) {
    throw apiError('FETCH_FAILED', 'Could not reach the price search service.');
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw apiError('INVALID_KEY', 'Invalid or expired Serper key.');
    }
    throw apiError(
      'SEARCH_SERVICE_ERROR',
      `The search service responded with an error (${response.status}).`,
      { status: response.status }
    );
  }

  const data = await response.json();

  if (data.message || data.error) {
    // Message renvoyé tel quel par Serper (contenu dynamique, non traduisible côté client).
    throw apiError('UPSTREAM_ERROR', data.message || data.error);
  }

  const shoppingResults = Array.isArray(data.shopping) ? data.shopping : [];

  const offers = shoppingResults.slice(0, MAX_OFFERS).map((item) => {
    const { amount, currency } = parsePrice(item.price);
    return {
      title: item.title || cleanedQuery,
      price: amount,
      priceText: item.price || null,
      // Repli sur la devise par défaut du pays ciblé si le texte du prix
      // n'indique pas explicitement de symbole/code monétaire.
      currency: currency || defaultCurrency,
      source: item.source || 'Unknown merchant',
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

  return { offers, location: { code, gl, hl } };
}

module.exports = { searchProductPrices, parsePrice };
