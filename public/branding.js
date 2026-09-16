/**
 * Applique l'identité de marque active (nom, logo, couleurs) sur la page.
 * Doit être chargé AVANT i18n.js : expose window.BRAND (valeurs par
 * défaut immédiatement, "Awsert") et window.BRAND_READY (promesse résolue
 * une fois les vraies valeurs récupérées depuis /api/brand), qu'i18n.js
 * utilise pour interpoler {brand} dans les textes traduits.
 */
(function () {
  const FALLBACK = {
    id: 'awsert',
    name: 'Awsert',
    logoInitial: 'A',
    colors: { accent: '#5b7c99', accentHover: '#4d6c86', accentSoft: '#e7edf3', accentBorder: '#cddae5' },
    title: {},
    description: {},
  };

  window.BRAND = FALLBACK;

  function currentLocale() {
    try {
      const stored = localStorage.getItem('awsert_locale');
      if (stored === 'en' || stored === 'fr') return stored;
    } catch {
      // localStorage indisponible : on retombe sur l'anglais.
    }
    return 'en';
  }

  function faviconDataUri(letter, color) {
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'>` +
      `<rect width='32' height='32' rx='9' fill='${color}'/>` +
      `<text x='16' y='22' font-family='Arial, sans-serif' font-weight='700' font-size='17' fill='white' text-anchor='middle'>${letter}</text>` +
      `</svg>`;
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  }

  function applyBrand(brand) {
    window.BRAND = brand;
    const locale = currentLocale();

    const title = brand.title && (brand.title[locale] || brand.title.en);
    if (title) document.title = title;

    const desc = brand.description && (brand.description[locale] || brand.description.en);
    const descEl = document.querySelector('meta[name="description"]');
    if (desc && descEl) descEl.setAttribute('content', desc);

    const c = brand.colors || FALLBACK.colors;
    const root = document.documentElement.style;
    root.setProperty('--accent', c.accent);
    root.setProperty('--accent-hover', c.accentHover);
    root.setProperty('--accent-soft', c.accentSoft);
    root.setProperty('--accent-border', c.accentBorder);

    document.querySelectorAll('.logo-text').forEach((el) => { el.textContent = brand.name; });
    document.querySelectorAll('.logo-mark').forEach((el) => { el.textContent = brand.logoInitial; });

    let iconLink = document.querySelector("link[rel='icon']");
    if (!iconLink) {
      iconLink = document.createElement('link');
      iconLink.rel = 'icon';
      document.head.appendChild(iconLink);
    }
    iconLink.href = faviconDataUri(brand.logoInitial, c.accent);

    // Ré-applique les traductions statiques : certaines interpolent {brand}
    // (voir i18n.js), qui n'avait que la valeur par défaut au premier passage.
    if (window.i18n) window.i18n.applyStaticTranslations();
  }

  window.BRAND_READY = fetch('/api/brand')
    .then((r) => r.json())
    .then(applyBrand)
    .catch(() => {
      // Hors-ligne ou erreur serveur : on garde la marque par défaut, pas bloquant.
    });
})();
