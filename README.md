# Awsert

Application web SaaS très simple : l'utilisateur saisit un ou plusieurs noms de
produits, et Awsert interroge le web (via Google Shopping) pour retourner les
prix trouvés chez différents marchands, triés du moins cher au plus cher.

## Fonctionnement

- **Frontend** : une seule page HTML/CSS/JS statique (`public/`), sans framework.
- **Backend** : un serveur Node.js/Express (`server.js`) qui expose l'endpoint
  `POST /api/search`.
- **Source des prix** : [SerpApi](https://serpapi.com/) (moteur `google_shopping`),
  qui interroge Google Shopping et renvoie des résultats réels (titre, prix,
  marchand, lien).

## Installation

```bash
npm install
cp .env.example .env
```

Ouvrez `.env` et renseignez votre clé SerpApi :

```
SERPAPI_KEY=votre_cle_serpapi
```

Vous pouvez obtenir une clé gratuite (offre d'essai) sur https://serpapi.com/.

## Démarrage

```bash
npm start
```

Puis ouvrez http://localhost:3000 dans votre navigateur.

Pour le développement avec rechargement automatique :

```bash
npm run dev
```

## Utilisation

1. Saisissez un nom de produit par ligne dans le champ de recherche (jusqu'à
   10 produits).
2. Cliquez sur « Rechercher les prix ».
3. Pour chaque produit, la meilleure offre est mise en avant, suivie de la
   liste des offres trouvées avec le marchand et un lien direct.

## Limites connues

- Sans clé `SERPAPI_KEY` configurée, la recherche renvoie une erreur explicite
  (503) plutôt que des résultats.
- Aucune authentification, facturation ou gestion d'abonnement n'est incluse :
  c'est une base volontairement minimale, à étendre selon les besoins (comptes
  utilisateurs, plans payants, historique des recherches, etc.).
- Le quota de requêtes dépend du plan SerpApi choisi.

## Structure du projet

```
awsert/
├── server.js              # Serveur Express + endpoint /api/search
├── lib/
│   └── priceSearch.js     # Appel à SerpApi (Google Shopping) et normalisation des résultats
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .env.example
└── package.json
```
