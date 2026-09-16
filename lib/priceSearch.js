const { detectLocationAndQuery } = require('./locationDetect');

const SERPER_ENDPOINT = 'https://google.serper.dev/shopping';

// Number of offers returned per searched product.
const MAX_OFFERS = 8;

/**
 * Builds an error with a stable code (for client-side translation)
 * in addition to the English message (used as a fallback if the code
 * is unknown).
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

// Textual currency codes/abbreviations (used when Serper doesn't return
// a symbol, e.g. "719.00 MAD" or "719.00 DH" for Morocco).
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
 * Extracts a numeric amount and a currency from a price string as
 * returned by Serper (e.g. "719,00 €", "$799.00", "1.234,56 €",
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
    // The comma is the decimal separator, dots are thousands separators.
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else {
    // The dot is the decimal separator (or no separator), commas are thousands.
    cleaned = cleaned.replace(/,/g, '');
  }

  const amount = parseFloat(cleaned);
  return { amount: Number.isFinite(amount) ? amount : null, currency };
}

/**
 * Queries Serper (Google Shopping) for a given product and returns a
 * normalized list of offers (title, price, merchant, link, image), along
 * with the country the search targeted.
 *
 * If the query mentions a country (e.g. "Samsung A23 in Morocco"), the
 * search is targeted at that country (Google gl/hl) and the country
 * mention is removed from the text sent to Serper. Otherwise, the search
 * stays "international" (gl=us, hl=en) rather than defaulting to a
 * specific country.
 *
 * @param {string} query - The product name to search for (may mention a country).
 * @param {string} apiKey - The Serper key to use.
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
    // Message passed through as-is from Serper (dynamic content, not translatable client-side).
    throw apiError('UPSTREAM_ERROR', data.message || data.error);
  }

  const shoppingResults = Array.isArray(data.shopping) ? data.shopping : [];

  const offers = shoppingResults.slice(0, MAX_OFFERS).map((item) => {
    const { amount, currency } = parsePrice(item.price);
    return {
      title: item.title || cleanedQuery,
      price: amount,
      priceText: item.price || null,
      // Fall back to the targeted country's default currency if the price
      // text doesn't explicitly indicate a currency symbol/code.
      currency: currency || defaultCurrency,
      source: item.source || 'Unknown merchant',
      link: item.link || null,
      thumbnail: item.imageUrl || null,
    };
  });

  // Sort by ascending price (offers with no known price go to the end of the list).
  offers.sort((a, b) => {
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });

  return { offers, location: { code, gl, hl } };
}

module.exports = { searchProductPrices, parsePrice };
