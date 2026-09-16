// Backend de configuration "fichier JSON local" — utilisé quand
// DATABASE_URL n'est pas configurée (dev local sans base à disposition).
// ⚠️ Persistance non garantie sur Render (disque non persistant en plan
// gratuit) — voir README.md.
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

function readConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeConfig(config) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

function getRaw() {
  return readConfig();
}

function setKey(key, value) {
  const config = readConfig();
  config[key] = value;
  writeConfig(config);
}

module.exports = { getRaw, setKey };
