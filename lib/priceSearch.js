const SERPAPI_ENDPOINT = 'https://serpapi.com/search.json';

// Nombre d'offres renvoyées par produit recherché.
const MAX_OFFERS = 8;

/**
 * Interroge Google Shopping via SerpApi pour un produit donné et renvoie
 * une liste d'offres normalisées (titre, prix, marchand, lien, image).
 *
 * @param {string} query - Le nom du produit à rechercher.
 * @param {string} apiKey - La clé SerpApi à utiliser.
 * @returns {Promise<Array<{title: string, price: number|null, priceText: string, currency: string|null, source: string, link: string|null, thumbnail: string|null}>>}
 */
async function searchProductPrices(query, apiKey) {
  const url = new URL(SERPAPI_ENDPOINT);
  url.searchParams.set('engine', 'google_shopping');
  url.searchParams.set('q', query);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('hl', 'fr');
  url.searchParams.set('gl', 'fr');

  let response;
  try {
    response = await fetch(url.toString());
  } catch (err) {
    throw new Error("Impossible de contacter le service de recherche de prix.");
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Clé SerpApi invalide ou expirée.');
    }
    throw new Error(`Le service de recherche a répondu avec une erreur (${response.status}).`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  const shoppingResults = Array.isArray(data.shopping_results) ? data.shopping_results : [];

  const offers = shoppingResults.slice(0, MAX_OFFERS).map((item) => ({
    title: item.title || query,
    price: typeof item.extracted_price === 'number' ? item.extracted_price : null,
    priceText: item.price || null,
    currency: item.currency || null,
    source: item.source || 'Marchand inconnu',
    link: item.product_link || item.link || null,
    thumbnail: item.thumbnail || null,
  }));

  // Trie par prix croissant (les offres sans prix connu sont placées en fin de liste).
  offers.sort((a, b) => {
    if (a.price === null) return 1;
    if (b.price === null) return -1;
    return a.price - b.price;
  });

  return offers;
}

module.exports = { searchProductPrices };
