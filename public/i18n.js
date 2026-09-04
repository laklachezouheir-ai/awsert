/**
 * Mini-module d'internationalisation partagé par index.html et admin.html.
 * Anglais par défaut, français en option (choix mémorisé dans localStorage).
 */
(function () {
  const STORAGE_KEY = 'awsert_locale';
  const DEFAULT_LOCALE = 'en';

  const translations = {
    en: {
      'nav.features': 'Features',
      'nav.admin': 'Admin',
      'nav.search': 'Search',

      'hero.title.part1': 'Compare prices',
      'hero.title.accent': 'in one search',
      'hero.subtitle':
        'Enter one or more product names, Awsert searches the web and instantly returns the best deals.',

      'search.label': 'Product(s) to search',
      'search.placeholder': 'e.g. iPhone 15 128GB\nSamsung Galaxy Buds 3\nNintendo Switch OLED',
      'search.button': 'Search prices',
      'search.buttonLoading': 'Searching…',
      'search.hint': 'One product per line — up to 10 products per search.',

      'features.multi.title': 'Multi-product',
      'features.multi.desc': 'Search up to 10 products at once and save time comparing.',
      'features.realtime.title': 'Real-time prices',
      'features.realtime.desc':
        'Offers come straight from Google Shopping for up-to-date prices, merchant by merchant.',
      'features.best.title': 'Best price highlighted',
      'features.best.desc': 'Awsert automatically sorts offers and highlights the lowest price found.',

      'footer.tagline': 'Awsert · Price search powered by Google Shopping (Serper)',

      'results.label': 'Results',
      'results.offerCount_one': '{n} offer found',
      'results.offerCount_other': '{n} offers found',
      'results.bestPrice': 'Best price',
      'results.at': 'at {source}',
      'results.noOffers': 'No offers found for this product.',
      'results.errorPrefix': 'Error: {message}',
      'results.viewOffer': 'View offer →',
      'results.international': 'International',

      'status.searching_one': 'Searching prices for {n} product…',
      'status.searching_other': 'Searching prices for {n} products…',
      'status.needProduct': 'Please enter at least one product.',
      'status.serverError': 'Could not reach the server. Please try again later.',

      'admin.login.title': 'Admin login',
      'admin.login.subtitle':
        'The password is shown in the server logs on first startup, or matches the ADMIN_PASSWORD variable.',
      'admin.login.label': 'Password',
      'admin.login.button': 'Log in',

      'admin.config.title': 'Serper key',
      'admin.config.logout': 'Log out',
      'admin.config.subtitle':
        "This key lets Awsert query Google Shopping (via Serper) to fetch prices.",
      'admin.config.label': 'New Serper key',
      'admin.config.placeholder': 'Paste your Serper key here',
      'admin.config.button': 'Save key',
      'admin.config.hintPrefix': 'Get a free key at',

      'admin.footer.back': '← Back to search',

      'admin.key.active': 'Active key: {masked}{source}',
      'admin.key.envSuffix': ' (set via the SERPER_API_KEY environment variable)',
      'admin.key.none': 'No Serper key is configured yet.',
      'admin.key.envPlaceholder': 'Managed via SERPER_API_KEY in .env',
      'admin.key.loading': 'Loading…',

      'admin.status.loginFailed': 'Login failed.',
      'admin.status.needKey': 'Please enter a key.',
      'admin.status.saveError': 'Could not save the key.',
      'admin.status.saveSuccess': 'Serper key saved successfully.',

      // Traductions des codes d'erreur renvoyés par le serveur (langue par défaut : anglais,
      // donc identiques au message serveur — présents pour compléter le mapping).
      'error.NO_PRODUCTS': 'Please enter at least one product to search.',
      'error.NO_API_KEY': 'No Serper key configured. Go to /admin to add your key and enable price search.',
      'error.SEARCH_ERROR': 'An error occurred while searching for prices.',
      'error.INVALID_PASSWORD': 'Incorrect password.',
      'error.INVALID_KEY': 'Please enter a valid Serper key.',
      'error.KEY_ENV_LOCKED':
        'The Serper key is currently set via the SERPER_API_KEY environment variable, which takes priority. Remove it from .env to manage it from this page.',
      'error.FETCH_FAILED': 'Could not reach the price search service.',
      'error.SEARCH_SERVICE_ERROR': 'The search service responded with an error ({status}).',
    },
    fr: {
      'nav.features': 'Fonctionnalités',
      'nav.admin': 'Administration',
      'nav.search': 'Recherche',

      'hero.title.part1': 'Comparez les prix',
      'hero.title.accent': 'en une recherche',
      'hero.subtitle':
        "Saisissez le nom d'un ou plusieurs produits, Awsert interroge le web et vous retourne instantanément les meilleures offres du moment.",

      'search.label': 'Produit(s) à rechercher',
      'search.placeholder': 'Ex : iPhone 15 128 Go\nSamsung Galaxy Buds 3\nNintendo Switch OLED',
      'search.button': 'Rechercher les prix',
      'search.buttonLoading': 'Recherche en cours…',
      'search.hint': "Un produit par ligne — jusqu'à 10 produits par recherche.",

      'features.multi.title': 'Multi-produits',
      'features.multi.desc':
        'Recherchez jusqu\'à 10 produits en une seule fois et gagnez du temps sur vos comparaisons.',
      'features.realtime.title': 'Prix en temps réel',
      'features.realtime.desc':
        'Les offres proviennent directement de Google Shopping pour des prix à jour, marchand par marchand.',
      'features.best.title': 'Meilleur prix mis en avant',
      'features.best.desc':
        'Awsert trie automatiquement les offres et met en évidence le prix le plus bas trouvé.',

      'footer.tagline': 'Awsert · Recherche de prix propulsée par Google Shopping (Serper)',

      'results.label': 'Résultats',
      'results.offerCount_one': '{n} offre trouvée',
      'results.offerCount_other': '{n} offres trouvées',
      'results.bestPrice': 'Meilleur prix',
      'results.at': 'chez {source}',
      'results.noOffers': 'Aucune offre trouvée pour ce produit.',
      'results.errorPrefix': 'Erreur : {message}',
      'results.viewOffer': "Voir l'offre →",
      'results.international': 'International',

      'status.searching_one': 'Recherche des prix pour {n} produit…',
      'status.searching_other': 'Recherche des prix pour {n} produits…',
      'status.needProduct': 'Veuillez saisir au moins un produit.',
      'status.serverError': 'Impossible de contacter le serveur. Réessayez plus tard.',

      'admin.login.title': 'Connexion administrateur',
      'admin.login.subtitle':
        'Le mot de passe est affiché dans les logs du serveur au premier démarrage, ou correspond à la variable ADMIN_PASSWORD.',
      'admin.login.label': 'Mot de passe',
      'admin.login.button': 'Se connecter',

      'admin.config.title': 'Clé Serper',
      'admin.config.logout': 'Se déconnecter',
      'admin.config.subtitle':
        "Cette clé permet à Awsert d'interroger Google Shopping (via Serper) pour récupérer les prix.",
      'admin.config.label': 'Nouvelle clé Serper',
      'admin.config.placeholder': 'Collez votre clé Serper ici',
      'admin.config.button': 'Enregistrer la clé',
      'admin.config.hintPrefix': 'Obtenez une clé gratuite sur',

      'admin.footer.back': '← Retour à la recherche',

      'admin.key.active': 'Clé active : {masked}{source}',
      'admin.key.envSuffix': " (définie via la variable d'environnement SERPER_API_KEY)",
      'admin.key.none': "Aucune clé Serper n'est configurée pour le moment.",
      'admin.key.envPlaceholder': 'Gérée via SERPER_API_KEY dans .env',
      'admin.key.loading': 'Chargement…',

      'admin.status.loginFailed': 'Connexion impossible.',
      'admin.status.needKey': 'Veuillez saisir une clé.',
      'admin.status.saveError': "Impossible d'enregistrer la clé.",
      'admin.status.saveSuccess': 'Clé Serper enregistrée avec succès.',

      'error.NO_PRODUCTS': 'Veuillez saisir au moins un produit à rechercher.',
      'error.NO_API_KEY':
        'Aucune clé Serper configurée. Rendez-vous sur /admin pour renseigner votre clé et activer la recherche de prix.',
      'error.SEARCH_ERROR': 'Une erreur est survenue pendant la recherche des prix.',
      'error.INVALID_PASSWORD': 'Mot de passe incorrect.',
      'error.INVALID_KEY': 'Veuillez saisir une clé Serper valide.',
      'error.KEY_ENV_LOCKED':
        "La clé Serper est actuellement définie via la variable d'environnement SERPER_API_KEY, qui est prioritaire. Retirez-la du fichier .env pour pouvoir la gérer depuis cette page.",
      'error.FETCH_FAILED': 'Impossible de contacter le service de recherche de prix.',
      'error.SEARCH_SERVICE_ERROR': 'Le service de recherche a répondu avec une erreur ({status}).',
    },
  };

  function getLocale() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'fr') return stored;
    } catch {
      // localStorage indisponible (navigation privée, etc.) : on retombe sur l'anglais.
    }
    return DEFAULT_LOCALE;
  }

  function setLocale(locale) {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // Rien à faire si le stockage n'est pas disponible : le choix ne sera pas mémorisé.
    }
  }

  function interpolate(str, vars) {
    if (!vars) return str;
    return Object.entries(vars).reduce(
      (acc, [key, value]) => acc.replaceAll(`{${key}}`, value),
      str
    );
  }

  /** Traduit une clé simple. */
  function t(key, vars) {
    const locale = getLocale();
    const str = translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
    return interpolate(str, vars);
  }

  /** Traduit une clé pluralisée (`${key}_one` / `${key}_other`) selon un compteur `n`. */
  function tPlural(key, n, vars) {
    const suffix = n === 1 ? 'one' : 'other';
    return t(`${key}_${suffix}`, { n, ...vars });
  }

  /** Traduit un code d'erreur renvoyé par le serveur ; retombe sur le message brut si inconnu. */
  function tError(code, fallbackMessage, vars) {
    if (code) {
      const locale = getLocale();
      const key = `error.${code}`;
      const str = translations[locale]?.[key] || translations[DEFAULT_LOCALE][key];
      if (str) return interpolate(str, vars);
    }
    return fallbackMessage;
  }

  /** Applique les traductions statiques ([data-i18n], [data-i18n-placeholder]) et met à jour <html lang>. */
  function applyStaticTranslations() {
    document.documentElement.lang = getLocale();
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.lang === getLocale());
    });
  }

  function initLangSwitch() {
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.dataset.lang === getLocale()) return;
        setLocale(btn.dataset.lang);
        location.reload();
      });
    });
  }

  window.i18n = { t, tPlural, tError, getLocale, setLocale, applyStaticTranslations };

  document.addEventListener('DOMContentLoaded', () => {
    applyStaticTranslations();
    initLangSwitch();
  });
})();
