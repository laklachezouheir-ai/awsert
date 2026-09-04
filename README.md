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
```

## Démarrage

```bash
npm start
```

Puis ouvrez http://localhost:3000 dans votre navigateur.

## Configuration de la clé SerpApi (page d'administration)

Aucune édition manuelle de fichier n'est nécessaire : la clé SerpApi se
configure depuis une page d'administration dédiée.

1. Au premier démarrage, si aucun mot de passe admin n'est défini, le
   serveur en génère un automatiquement et l'affiche dans les logs :
   ```
   ========================================================
    Mot de passe administrateur généré automatiquement :
    xxxxxxxxxxxxxxxx
    Connectez-vous sur /admin pour configurer votre clé SerpApi.
   ========================================================
   ```
2. Ouvrez http://localhost:3000/admin et connectez-vous avec ce mot de passe.
3. Collez votre clé SerpApi (obtenue gratuitement sur https://serpapi.com/)
   et cliquez sur « Enregistrer la clé ».

La clé est alors enregistrée localement dans `data/config.json` (non
versionné) et utilisée automatiquement par les recherches.

Vous pouvez aussi passer par le fichier `.env` si vous préférez (voir
`.env.example`) :

```
SERPAPI_KEY=votre_cle_serpapi
ADMIN_PASSWORD=votre_mot_de_passe_admin
```

Si `SERPAPI_KEY` est définie via l'environnement, elle est prioritaire sur
celle enregistrée depuis `/admin` (la page d'administration devient alors
en lecture seule pour ce champ).

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

- Sans clé SerpApi configurée (ni via `/admin`, ni via `.env`), la recherche
  renvoie une erreur explicite (503) plutôt que des résultats.
- L'authentification admin est volontairement minimale (un seul mot de passe,
  sessions en mémoire) : suffisante pour un usage personnel/petite équipe,
  mais pas pour une gestion multi-utilisateurs. Aucune authentification côté
  utilisateurs finaux ni facturation/abonnement n'est incluse : c'est une
  base volontairement minimale, à étendre selon les besoins (comptes
  utilisateurs, plans payants, historique des recherches, etc.).
- Le quota de requêtes dépend du plan SerpApi choisi.

## Structure du projet

```
awsert/
├── server.js              # Serveur Express : /api/search, /api/health, /api/admin/*
├── lib/
│   ├── priceSearch.js     # Appel à SerpApi (Google Shopping) et normalisation des résultats
│   ├── config.js          # Lecture/écriture de la clé SerpApi et du mot de passe admin
│   └── adminAuth.js       # Sessions et middleware d'authentification admin
├── public/
│   ├── index.html         # Page de recherche
│   ├── admin.html         # Page d'administration (/admin)
│   ├── style.css
│   ├── app.js
│   └── admin.js
├── data/                  # Config locale générée (clé, mot de passe) — non versionné
├── .env.example
└── package.json
```
