/**
 * Détection de pays dans une requête produit (ex: "Samsung A23 au Maroc")
 * afin de cibler la recherche Google Shopping (via Serper) sur le bon pays
 * (paramètres `gl`/`hl`) plutôt que de toujours renvoyer des résultats
 * français/internationaux par défaut.
 *
 * Si aucun pays n'est mentionné, la recherche reste "internationale"
 * (gl=us, hl=en).
 */

// gl = code pays Google (ISO 3166-1 alpha-2), hl = langue de recherche,
// currency = devise par défaut utilisée en repli si le prix renvoyé par
// Serper ne précise pas explicitement de symbole/code monétaire.
const COUNTRIES = [
  { code: 'MA', gl: 'ma', hl: 'fr', currency: 'MAD', names: ['maroc', 'morocco'] },
  { code: 'DZ', gl: 'dz', hl: 'fr', currency: 'DZD', names: ['algerie', 'algeria'] },
  { code: 'TN', gl: 'tn', hl: 'fr', currency: 'TND', names: ['tunisie', 'tunisia'] },
  { code: 'EG', gl: 'eg', hl: 'ar', currency: 'EGP', names: ['egypte', 'egypt'] },
  { code: 'SA', gl: 'sa', hl: 'ar', currency: 'SAR', names: ['arabie saoudite', 'saudi arabia', 'ksa'] },
  { code: 'AE', gl: 'ae', hl: 'ar', currency: 'AED', names: ['emirats arabes unis', 'emirats', 'uae', 'united arab emirates', 'dubai', 'dubai uae', 'abu dhabi'] },
  { code: 'QA', gl: 'qa', hl: 'ar', currency: 'QAR', names: ['qatar'] },
  { code: 'SN', gl: 'sn', hl: 'fr', currency: 'XOF', names: ['senegal', 'senegal'] },
  { code: 'CI', gl: 'ci', hl: 'fr', currency: 'XOF', names: ["cote d ivoire", "cote divoire", 'ivory coast'] },
  { code: 'CM', gl: 'cm', hl: 'fr', currency: 'XAF', names: ['cameroun', 'cameroon'] },
  { code: 'ML', gl: 'ml', hl: 'fr', currency: 'XOF', names: ['mali'] },
  { code: 'FR', gl: 'fr', hl: 'fr', currency: 'EUR', names: ['france'] },
  { code: 'BE', gl: 'be', hl: 'fr', currency: 'EUR', names: ['belgique', 'belgium'] },
  { code: 'CH', gl: 'ch', hl: 'fr', currency: 'CHF', names: ['suisse', 'switzerland'] },
  { code: 'LU', gl: 'lu', hl: 'fr', currency: 'EUR', names: ['luxembourg'] },
  { code: 'ES', gl: 'es', hl: 'es', currency: 'EUR', names: ['espagne', 'spain'] },
  { code: 'IT', gl: 'it', hl: 'it', currency: 'EUR', names: ['italie', 'italy'] },
  { code: 'DE', gl: 'de', hl: 'de', currency: 'EUR', names: ['allemagne', 'germany'] },
  { code: 'PT', gl: 'pt', hl: 'pt', currency: 'EUR', names: ['portugal'] },
  { code: 'NL', gl: 'nl', hl: 'nl', currency: 'EUR', names: ['pays bas', 'netherlands', 'hollande', 'holland'] },
  { code: 'GB', gl: 'gb', hl: 'en', currency: 'GBP', names: ['royaume uni', 'united kingdom', 'angleterre', 'england', 'uk'] },
  { code: 'IE', gl: 'ie', hl: 'en', currency: 'EUR', names: ['irlande', 'ireland'] },
  { code: 'US', gl: 'us', hl: 'en', currency: 'USD', names: ['etats unis', 'usa', 'united states', 'america', 'us'] },
  { code: 'CA', gl: 'ca', hl: 'en', currency: 'CAD', names: ['canada'] },
  { code: 'TR', gl: 'tr', hl: 'tr', currency: 'TRY', names: ['turquie', 'turkey'] },
  { code: 'JP', gl: 'jp', hl: 'ja', currency: 'JPY', names: ['japon', 'japan'] },
  { code: 'CN', gl: 'cn', hl: 'zh-cn', currency: 'CNY', names: ['chine', 'china'] },
  { code: 'IN', gl: 'in', hl: 'en', currency: 'INR', names: ['inde', 'india'] },
  { code: 'BR', gl: 'br', hl: 'pt-br', currency: 'BRL', names: ['bresil', 'brazil'] },
  { code: 'MX', gl: 'mx', hl: 'es', currency: 'MXN', names: ['mexique', 'mexico'] },
  { code: 'AU', gl: 'au', hl: 'en', currency: 'AUD', names: ['australie', 'australia'] },
  { code: 'SE', gl: 'se', hl: 'sv', currency: 'SEK', names: ['suede', 'sweden'] },
  { code: 'PL', gl: 'pl', hl: 'pl', currency: 'PLN', names: ['pologne', 'poland'] },
  { code: 'KR', gl: 'kr', hl: 'ko', currency: 'KRW', names: ['coree du sud', 'south korea'] },
  { code: 'SG', gl: 'sg', hl: 'en', currency: 'SGD', names: ['singapour', 'singapore'] },
];

// Résultat par défaut lorsqu'aucun pays n'est détecté dans la requête :
// recherche "internationale" plutôt que centrée sur un pays en particulier.
const INTERNATIONAL = { code: null, gl: 'us', hl: 'en', currency: null };

const PREPOSITIONS = '(?:au|aux|en|a|de|du|des|dans|pour|in|for|from|near)';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Remplace les caractères accentués courants par leur équivalent non
// accentué, caractère par caractère, pour préserver l'alignement des index
// avec la chaîne d'origine (contrairement à une normalisation NFD classique).
const ACCENT_MAP = { à: 'a', â: 'a', ä: 'a', é: 'e', è: 'e', ê: 'e', ë: 'e', î: 'i', ï: 'i', ô: 'o', ö: 'o', ù: 'u', û: 'u', ü: 'u', ç: 'c' };

function foldAccents(str) {
  return str.replace(/[àâäéèêëîïôöùûüç]/g, (ch) => ACCENT_MAP[ch] || ch);
}

/**
 * Analyse une requête produit et détecte un éventuel pays mentionné.
 * Renvoie les paramètres Google Shopping à utiliser (gl/hl/currency), le
 * code pays détecté (ou null), et la requête "nettoyée" (sans la mention
 * du pays) à envoyer au moteur de recherche.
 */
function detectLocationAndQuery(rawQuery) {
  const haystack = foldAccents(rawQuery.toLowerCase());

  // On teste les noms les plus longs en premier pour éviter qu'un alias
  // court n'intercepte une partie d'un alias plus spécifique.
  const candidates = [];
  for (const country of COUNTRIES) {
    for (const name of country.names) {
      candidates.push({ country, name });
    }
  }
  candidates.sort((a, b) => b.name.length - a.name.length);

  for (const { country, name } of candidates) {
    const pattern = new RegExp(
      `\\s*\\b${PREPOSITIONS}\\b\\s+${escapeRegex(name)}\\b|\\b${escapeRegex(name)}\\b`
    );
    const match = haystack.match(pattern);
    if (match && match.index !== undefined) {
      const cleanedQuery = (
        rawQuery.slice(0, match.index) + rawQuery.slice(match.index + match[0].length)
      )
        .replace(/\s{2,}/g, ' ')
        .trim();

      return {
        code: country.code,
        gl: country.gl,
        hl: country.hl,
        currency: country.currency,
        cleanedQuery: cleanedQuery || rawQuery,
      };
    }
  }

  return { ...INTERNATIONAL, cleanedQuery: rawQuery };
}

module.exports = { detectLocationAndQuery };
