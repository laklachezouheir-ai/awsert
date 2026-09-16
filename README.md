# Awsert

Application web SaaS très simple : l'utilisateur saisit un ou plusieurs noms de
produits, et Awsert interroge le web (via Google Shopping) pour retourner les
prix trouvés chez différents marchands, triés du moins cher au plus cher.

## Fonctionnement

- **Frontend** : une seule page HTML/CSS/JS statique (`public/`), sans framework.
- **Backend** : un serveur Node.js/Express (`server.js`) qui expose l'endpoint
  `POST /api/search`.
- **Source des prix** : [Serper](https://serper.dev/) (endpoint `/shopping`),
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

## Configuration de la clé Serper (page d'administration)

Aucune édition manuelle de fichier n'est nécessaire : la clé Serper se
configure depuis une page d'administration dédiée.

1. Au premier démarrage, si aucun mot de passe admin n'est défini, le
   serveur en génère un automatiquement et l'affiche dans les logs :
   ```
   ========================================================
    Mot de passe administrateur généré automatiquement :
    xxxxxxxxxxxxxxxx
    Connectez-vous sur /admin pour configurer votre clé Serper.
   ========================================================
   ```
2. Ouvrez http://localhost:3000/admin et connectez-vous avec ce mot de passe.
3. Collez votre clé Serper (obtenue gratuitement sur https://serper.dev/)
   et cliquez sur « Enregistrer la clé ».

La clé est alors enregistrée (localement dans `data/config.json`, ou en
base PostgreSQL si `DATABASE_URL` est configurée — voir section **Base de
données**) et utilisée automatiquement par les recherches.

Vous pouvez aussi passer par le fichier `.env` si vous préférez (voir
`.env.example`) :

```
SERPER_API_KEY=votre_cle_serper
ADMIN_PASSWORD=votre_mot_de_passe_admin
```

Si `SERPER_API_KEY` est définie via l'environnement, elle est prioritaire sur
celle enregistrée depuis `/admin` (la page d'administration devient alors
en lecture seule pour ce champ).

Pour le développement avec rechargement automatique :

```bash
npm run dev
```

## Base de données

Deux backends de configuration, sélectionnés automatiquement :

- **`DATABASE_URL` absente** → fichier JSON local (`data/config.json`,
  `lib/configJson.js`). Zéro installation, pratique pour développer, mais
  **à éviter en production** : sur Render (plan gratuit), le disque n'est
  pas persistant — la clé Serper et le mot de passe admin disparaîtraient
  à chaque redéploiement ou réveil du service après une mise en veille.
- **`DATABASE_URL` définie** → PostgreSQL (`lib/configPostgres.js`),
  persistant indépendamment du disque de l'app. Les sessions admin sont
  aussi persistées en base dans ce cas — sans ça, l'admin serait
  déconnecté à chaque redéploiement.

### Mise en place (recommandé avant tout usage réel)

Le Postgres gratuit de Render **expire après 30 jours** (données
supprimées ensuite) — pas adapté pour de vraies données. Deux
alternatives gratuites et durables :

- **[Neon](https://neon.tech/)** (recommandé) — Postgres serverless,
  0,5 Go gratuit, pas d'expiration, pas de carte bancaire requise.
- **[Supabase](https://supabase.com/)** — alternative équivalente.

1. Créez un projet, copiez la chaîne de connexion (`postgresql://...`).
2. Renseignez `DATABASE_URL` dans `.env` (local) ou dans Environment sur
   Render.
3. Au démarrage, l'app crée automatiquement les tables nécessaires
   (`app_config`, `admin_sessions`) — aucune migration manuelle à lancer.

Testé en conditions réelles (redémarrage complet du serveur simulant un
redéploiement) : la clé Serper, le mot de passe admin et la session de
connexion survivent tous les trois.

## Variantes de marque (vendre le même produit sous plusieurs noms)

Le même moteur (recherche de prix via Serper) peut être déployé sous
plusieurs identités visuelles différentes — nom, logo, couleurs, titre —
pour tester plusieurs positionnements/marchés sans dupliquer le code.
Trois marques sont prêtes dans `lib/branding.js` :

| `BRAND_ID` | Nom | Positionnement | Couleur |
|---|---|---|---|
| `awsert` (par défaut) | Awsert | Comparateur de prix neutre/pro | Bleu ardoise |
| `dealscout` | DealScout | Chasseurs de bonnes affaires, ton punchy | Orange |
| `pricezen` | PriceZen | Achat serein, sans stress | Vert |

Pour changer de marque, définissez `BRAND_ID` dans `.env` (local) ou
Environment sur Render (`dealscout` ou `pricezen`) — aucune autre
modification nécessaire, le nom/logo/couleurs/textes se mettent à jour
partout automatiquement (page de recherche, page admin, EN et FR).

### Déployer les 3 variantes en parallèle

Comme il s'agit du même code, chaque variante est un **service Render
séparé** pointant sur ce même dépôt/branche, avec sa propre variable
`BRAND_ID` (et, si vous voulez vraiment 3 marques indépendantes, son
propre nom de domaine) :

1. Répétez les étapes de la section **Déploiement sur Render** ci-dessous
   3 fois → 3 services (`awsert`, `dealscout`, `pricezen` par exemple).
2. Sur chaque service, ajoutez `BRAND_ID=dealscout` (ou `pricezen`) en
   plus des variables habituelles.
3. Un correctif de bug ou une amélioration du moteur de recherche profite
   aux 3 en même temps (un seul code à maintenir) — seul le déploiement
   est à refaire sur chaque service après un `git push`.

### Ajouter une 4e variante / personnaliser

Ajoutez une entrée dans l'objet `PRESETS` de `lib/branding.js` (nom, lettre
de logo, 4 couleurs, titre/description EN+FR) — pas besoin de toucher au
reste du code, tout le front-end s'adapte automatiquement via `/api/brand`.

### Détails techniques

`public/branding.js` (chargé avant `i18n.js`) récupère la marque active
via `GET /api/brand` et met à jour à la volée : `<title>`, meta
description, favicon, logo, et les 4 variables CSS de couleur d'accent.
Les textes traduits qui mentionnent le nom du produit utilisent un
placeholder `{brand}` (voir `public/i18n.js`) plutôt que le nom en dur,
interpolé automatiquement avec la marque active.

## Déploiement sur Render

Le dépôt contient un fichier `render.yaml` (Blueprint Render) prêt à l'emploi.

1. Sur [render.com](https://render.com), crée un compte puis clique sur
   **New +** → **Blueprint**.
2. Connecte ce dépôt GitHub (`laklachezouheir-ai/awsert`) et sélectionne la
   branche à déployer.
3. Render détecte `render.yaml` et propose de créer le service web `awsert`
   (build : `npm install`, démarrage : `npm start`).
4. Avant de valider, renseigne les variables d'environnement demandées :
   - `SERPER_API_KEY` : ta clé Serper
   - `ADMIN_PASSWORD` : le mot de passe que tu veux utiliser pour `/admin`
5. Clique sur **Apply** / **Create Web Service**. Render build et démarre
   l'app, puis fournit une URL publique du type
   `https://awsert-xxxx.onrender.com`.

Si tu préfères créer le service manuellement (sans Blueprint) : **New +** →
**Web Service**, connecte le dépôt, puis renseigne toi-même *Build Command*
(`npm install`) et *Start Command* (`npm start`).

**⚠️ Important — disque non persistant** : sur Render, le système de
fichiers d'un service web est réinitialisé à chaque déploiement et à chaque
redémarrage (y compris la mise en veille automatique du plan gratuit après
inactivité). Deux façons de s'en protéger, cumulables :

- Définir `SERPER_API_KEY` et `ADMIN_PASSWORD` comme variables
  d'environnement (étape 4 ci-dessus) — la page `/admin` reste utilisable
  pour vérifier la configuration, mais devient alors en lecture seule pour
  la clé (définie via l'environnement).
- Configurer `DATABASE_URL` (voir section **Base de données**) — la clé
  enregistrée depuis `/admin` est alors persistée en base plutôt que sur
  le disque local, et survit aux redéploiements.

## Utilisation

1. Saisissez un nom de produit par ligne dans le champ de recherche (jusqu'à
   10 produits).
2. Cliquez sur « Rechercher les prix ».
3. Pour chaque produit, la meilleure offre est mise en avant, suivie de la
   liste des offres trouvées avec le marchand et un lien direct.

## Limites connues

- Sans clé Serper configurée (ni via `/admin`, ni via `.env`), la recherche
  renvoie une erreur explicite (503) plutôt que des résultats.
- L'authentification admin est volontairement minimale (un seul mot de
  passe partagé) : suffisante pour un usage personnel/petite équipe, mais
  pas pour une gestion multi-utilisateurs. Anti-brute-force en place
  (`express-rate-limit`, 20 tentatives/15 min/IP) et sessions persistées
  en base si `DATABASE_URL` est configurée. Aucune authentification côté
  utilisateurs finaux ni facturation/abonnement n'est incluse : c'est une
  base volontairement minimale, à étendre selon les besoins (comptes
  utilisateurs, plans payants, historique des recherches, etc.).
- Le quota de requêtes dépend du plan Serper choisi.

## Structure du projet

```
awsert/
├── server.js              # Serveur Express : /api/search, /api/health, /api/admin/*
├── lib/
│   ├── priceSearch.js       # Appel à Serper (Google Shopping) et normalisation des résultats
│   ├── config.js             # API de configuration commune (dispatch JSON/Postgres)
│   ├── configJson.js          # Backend fichier JSON local (repli dev)
│   ├── configPostgres.js       # Backend PostgreSQL (actif si DATABASE_URL)
│   ├── adminAuth.js             # Sessions et middleware d'authentification admin
│   └── branding.js               # Presets de marque (awsert/dealscout/pricezen)
├── public/
│   ├── index.html         # Page de recherche
│   ├── admin.html         # Page d'administration (/admin)
│   ├── branding.js        # Applique la marque active (nom/logo/couleurs) au chargement
│   ├── i18n.js             # Traductions EN/FR, interpole {brand}
│   ├── style.css
│   ├── app.js
│   └── admin.js
├── data/                  # Config locale générée (clé, mot de passe) — non versionné
├── .env.example
└── package.json
```
