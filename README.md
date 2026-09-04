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

La clé est alors enregistrée localement dans `data/config.json` (non
versionné) et utilisée automatiquement par les recherches.

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
inactivité). Toute clé enregistrée uniquement via la page `/admin`
(stockée dans `data/config.json`) sera donc perdue au prochain redémarrage.
**Sur Render, définis `SERPER_API_KEY` et `ADMIN_PASSWORD` comme variables
d'environnement** (étape 4 ci-dessus) plutôt que de compter sur `/admin`
pour la persistance — la page `/admin` reste utilisable pour vérifier la
configuration, mais devient alors en lecture seule (la clé étant définie
via l'environnement).

## Utilisation

1. Saisissez un nom de produit par ligne dans le champ de recherche (jusqu'à
   10 produits).
2. Cliquez sur « Rechercher les prix ».
3. Pour chaque produit, la meilleure offre est mise en avant, suivie de la
   liste des offres trouvées avec le marchand et un lien direct.

## Limites connues

- Sans clé Serper configurée (ni via `/admin`, ni via `.env`), la recherche
  renvoie une erreur explicite (503) plutôt que des résultats.
- L'authentification admin est volontairement minimale (un seul mot de passe,
  sessions en mémoire) : suffisante pour un usage personnel/petite équipe,
  mais pas pour une gestion multi-utilisateurs. Aucune authentification côté
  utilisateurs finaux ni facturation/abonnement n'est incluse : c'est une
  base volontairement minimale, à étendre selon les besoins (comptes
  utilisateurs, plans payants, historique des recherches, etc.).
- Le quota de requêtes dépend du plan Serper choisi.

## Structure du projet

```
awsert/
├── server.js              # Serveur Express : /api/search, /api/health, /api/admin/*
├── lib/
│   ├── priceSearch.js     # Appel à Serper (Google Shopping) et normalisation des résultats
│   ├── config.js          # Lecture/écriture de la clé Serper et du mot de passe admin
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
