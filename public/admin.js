const loginCard = document.getElementById('login-card');
const configCard = document.getElementById('config-card');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password-input');
const configForm = document.getElementById('config-form');
const keyInput = document.getElementById('key-input');
const keyStatus = document.getElementById('key-status');
const logoutBtn = document.getElementById('logout-btn');
const statusArea = document.getElementById('admin-status');

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

function showLogin() {
  loginCard.hidden = false;
  configCard.hidden = true;
}

function showConfig(data) {
  loginCard.hidden = true;
  configCard.hidden = false;

  if (data.hasKey) {
    const sourceText = data.keySource === 'env' ? " (définie via la variable d'environnement SERPAPI_KEY)" : '';
    keyStatus.textContent = `Clé actuelle : ${data.maskedKey}${sourceText}`;
  } else {
    keyStatus.textContent = "Aucune clé SerpApi n'est configurée pour le moment.";
  }

  if (data.keySource === 'env') {
    keyInput.disabled = true;
    configForm.querySelector('button').disabled = true;
    keyInput.placeholder = 'Gérée via SERPAPI_KEY dans .env';
  }
}

async function loadConfig() {
  const response = await fetch('/api/admin/config');
  if (response.status === 401) {
    showLogin();
    return;
  }
  const data = await response.json();
  showConfig(data);
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus(null);

  const response = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: passwordInput.value }),
  });

  const data = await response.json();

  if (!response.ok) {
    setStatus(data.error || 'Connexion impossible.', 'error');
    return;
  }

  passwordInput.value = '';
  await loadConfig();
});

configForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus(null);

  const serpApiKey = keyInput.value.trim();
  if (!serpApiKey) {
    setStatus('Veuillez saisir une clé.', 'error');
    return;
  }

  const response = await fetch('/api/admin/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serpApiKey }),
  });

  const data = await response.json();

  if (!response.ok) {
    setStatus(data.error || "Impossible d'enregistrer la clé.", 'error');
    return;
  }

  keyInput.value = '';
  setStatus('Clé SerpApi enregistrée avec succès.', 'info');
  await loadConfig();
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  showLogin();
});

loadConfig();
