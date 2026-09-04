const form = document.getElementById('search-form');
const input = document.getElementById('products-input');
const button = document.getElementById('search-btn');
const statusArea = document.getElementById('status-area');
const resultsEl = document.getElementById('results');

function setStatus(message, type) {
  if (!message) {
    statusArea.hidden = true;
    statusArea.textContent = '';
    statusArea.className = 'status-area';
    return;
  }
  statusArea.hidden = false;
  statusArea.textContent = message;
  statusArea.className = `status-area ${type}`;
}

function formatPrice(price, currency) {
  if (price === null || price === undefined) return null;
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${price} ${currency || ''}`.trim();
  }
}

function renderOffer(offer) {
  const li = document.createElement('li');
  li.className = 'offer';

  const img = document.createElement('img');
  img.src = offer.thumbnail || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="44" height="44"%3E%3Crect width="44" height="44" fill="%23ddd"/%3E%3C/svg%3E';
  img.alt = '';
  img.loading = 'lazy';
  li.appendChild(img);

  const info = document.createElement('div');
  info.className = 'offer-info';

  const title = document.createElement('div');
  title.className = 'offer-title';
  title.textContent = offer.title;
  info.appendChild(title);

  const source = document.createElement('div');
  source.className = 'offer-source';
  source.textContent = offer.source;
  info.appendChild(source);

  if (offer.link) {
    const link = document.createElement('a');
    link.href = offer.link;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Voir l\'offre →';
    info.appendChild(link);
  }

  li.appendChild(info);

  const priceEl = document.createElement('div');
  priceEl.className = 'offer-price';
  priceEl.textContent = formatPrice(offer.price, offer.currency) || offer.priceText || 'Prix inconnu';
  li.appendChild(priceEl);

  return li;
}

function renderProductBlock(result) {
  const block = document.createElement('article');
  block.className = 'product-block';

  const heading = document.createElement('h2');
  heading.textContent = result.query;
  block.appendChild(heading);

  if (result.error) {
    const err = document.createElement('p');
    err.className = 'product-error';
    err.textContent = `Erreur : ${result.error}`;
    block.appendChild(err);
    return block;
  }

  if (!result.offers || result.offers.length === 0) {
    const none = document.createElement('p');
    none.className = 'no-results';
    none.textContent = 'Aucune offre trouvée pour ce produit.';
    block.appendChild(none);
    return block;
  }

  const best = result.offers[0];
  const bestPriceText = formatPrice(best.price, best.currency) || best.priceText;
  if (bestPriceText) {
    const bestPrice = document.createElement('p');
    bestPrice.className = 'best-price';
    bestPrice.textContent = `Meilleur prix trouvé : ${bestPriceText} (${best.source})`;
    block.appendChild(bestPrice);
  }

  const list = document.createElement('ul');
  list.className = 'offer-list';
  result.offers.forEach((offer) => list.appendChild(renderOffer(offer)));
  block.appendChild(list);

  return block;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const products = input.value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (products.length === 0) {
    setStatus('Veuillez saisir au moins un produit.', 'error');
    return;
  }

  button.disabled = true;
  button.textContent = 'Recherche en cours...';
  resultsEl.innerHTML = '';
  setStatus(`Recherche des prix pour ${products.length} produit(s)...`, 'info');

  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.error || 'Une erreur est survenue.', 'error');
      return;
    }

    setStatus(null);
    data.results.forEach((result) => {
      resultsEl.appendChild(renderProductBlock(result));
    });
  } catch (err) {
    setStatus('Impossible de contacter le serveur. Réessayez plus tard.', 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Rechercher les prix';
  }
});
