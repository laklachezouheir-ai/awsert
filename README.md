# Awsert

A very simple SaaS web app: the user enters one or more product names, and
Awsert searches the web (via Google Shopping) and returns the prices found
across different merchants, sorted from cheapest to most expensive.

## How it works

- **Frontend**: a single static HTML/CSS/JS page (`public/`), no framework.
- **Backend**: a Node.js/Express server (`server.js`) exposing the
  `POST /api/search` endpoint.
- **Price source**: [Serper](https://serper.dev/) (`/shopping` endpoint),
  which queries Google Shopping and returns real results (title, price,
  merchant, link).

## Install

```bash
npm install
```

## Start

```bash
npm start
```

Then open http://localhost:3000 in your browser.

## Configuring the Serper key (admin page)

No manual file editing is required: the Serper key is configured from a
dedicated admin page.

1. On first startup, if no admin password is set, the server generates one
   automatically and prints it to the logs:
   ```
   ========================================================
    Auto-generated admin password:
    xxxxxxxxxxxxxxxx
    Log in at /admin to configure your Serper key and branding.
   ========================================================
   ```
2. Open http://localhost:3000/admin and log in with that password.
3. Paste your Serper key (get one for free at https://serper.dev/) and
   click "Save key".

The key is then stored locally in `data/config.json` (not versioned) and
used automatically for searches.

You can also use a `.env` file if you prefer (see `.env.example`):

```
SERPER_API_KEY=your_serper_key
ADMIN_PASSWORD=your_admin_password
```

If `SERPER_API_KEY` is set via the environment, it takes priority over the
one saved from `/admin` (the admin page field then becomes read-only).

For development with auto-reload:

```bash
npm run dev
```

## Branding (site name, color) — admin page

Also on `/admin`, a **Branding** card lets you change the site name
(shown in the header, browser tab, favicon, and footer) and the accent
color (buttons, links, badges) — no code required. The change applies
instantly, everywhere on the site, as soon as you save.

This is stored in `data/config.json` (like the Serper key) — see the
warning about Render's non-persistent disk below if you deploy online.

## Deploying on Render

The repo includes a ready-to-use `render.yaml` file (Render Blueprint).

1. On [render.com](https://render.com), create an account, then click
   **New +** → **Blueprint**.
2. Connect this GitHub repo (`laklachezouheir-ai/awsert`) and select the
   branch to deploy.
3. Render detects `render.yaml` and offers to create the `awsert` web
   service (build: `npm install`, start: `npm start`).
4. Before confirming, fill in the requested environment variables:
   - `SERPER_API_KEY`: your Serper key
   - `ADMIN_PASSWORD`: the password you want to use for `/admin`
5. Click **Apply** / **Create Web Service**. Render builds and starts the
   app, then provides a public URL like
   `https://awsert-xxxx.onrender.com`.

If you'd rather create the service manually (without the Blueprint):
**New +** → **Web Service**, connect the repo, then set *Build Command*
(`npm install`) and *Start Command* (`npm start`) yourself.

**⚠️ Important — non-persistent disk**: on Render, a web service's
filesystem is reset on every deploy and every restart (including the free
plan's automatic sleep after inactivity). Any key or branding saved only
through the `/admin` page (stored in `data/config.json`) will therefore be
lost on the next restart. **On Render, set `SERPER_API_KEY` and
`ADMIN_PASSWORD` as environment variables** (step 4 above) instead of
relying on `/admin` for persistence — the `/admin` page remains usable to
check the configuration, but becomes read-only for fields set via the
environment.

## Usage

1. Enter one product name per line in the search field (up to 10
   products).
2. Click "Search prices".
3. For each product, the best offer is highlighted, followed by the list
   of offers found with the merchant and a direct link.

## Known limitations

- Without a configured Serper key (neither via `/admin` nor `.env`),
  search returns an explicit error (503) instead of results.
- Admin authentication is intentionally minimal (a single password,
  in-memory sessions): enough for personal/small-team use, but not for
  multi-user management. There is no end-user authentication or
  billing/subscription included: this is an intentionally minimal base,
  meant to be extended as needed (user accounts, paid plans, search
  history, etc.).
- The request quota depends on the chosen Serper plan.

## Project structure

```
awsert/
├── server.js              # Express server: /api/search, /api/health, /api/admin/*
├── lib/
│   ├── priceSearch.js     # Calls Serper (Google Shopping) and normalizes results
│   ├── locationDetect.js  # Detects a country mentioned in a query
│   ├── config.js          # Reads/writes the Serper key, admin password, and branding
│   ├── color.js           # Color helpers (derived shades) and HTML escaping
│   └── adminAuth.js       # Admin sessions and authentication middleware
├── public/
│   ├── index.html         # Search page (rendered with branding by the server)
│   ├── admin.html         # Admin page (/admin)
│   ├── style.css
│   ├── i18n.js             # EN/FR translations
│   ├── app.js
│   └── admin.js
├── data/                  # Generated local config (key, password, branding) — not versioned
├── .env.example
└── package.json
```
