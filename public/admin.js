const loginCard = document.getElementById('login-card');
const configCard = document.getElementById('config-card');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password-input');
const configForm = document.getElementById('config-form');
const keyInput = document.getElementById('key-input');
const keyPill = document.getElementById('key-pill');
const keyStatus = document.getElementById('key-status');
const logoutBtn = document.getElementById('logout-btn');
const statusArea = document.getElementById('admin-status');

const { t, tError } = window.i18n;

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
    const sourceText = data.keySource === 'env' ? t('admin.key.envSuffix') : '';
    keyStatus.textContent = t('admin.key.active', { masked: data.maskedKey, source: sourceText });
    keyPill.className = 'key-pill set';
  } else {
    keyStatus.textContent = t('admin.key.none');
    keyPill.className = 'key-pill unset';
  }

  if (data.keySource === 'env') {
    keyInput.disabled = true;
    configForm.querySelector('button').disabled = true;
    keyInput.placeholder = t('admin.key.envPlaceholder');
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
    setStatus(tError(data.code, data.error) || t('admin.status.loginFailed'), 'error');
    return;
  }

  passwordInput.value = '';
  await loadConfig();
});

configForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus(null);

  const serperApiKey = keyInput.value.trim();
  if (!serperApiKey) {
    setStatus(t('admin.status.needKey'), 'error');
    return;
  }

  const response = await fetch('/api/admin/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ serperApiKey }),
  });

  const data = await response.json();

  if (!response.ok) {
    setStatus(tError(data.code, data.error) || t('admin.status.saveError'), 'error');
    return;
  }

  keyInput.value = '';
  setStatus(t('admin.status.saveSuccess'), 'info');
  await loadConfig();
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  showLogin();
});

loadConfig();
