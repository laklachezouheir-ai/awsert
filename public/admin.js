const loginCard = document.getElementById('login-card');
const brandingCard = document.getElementById('branding-card');
const configCard = document.getElementById('config-card');
const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password-input');
const brandingForm = document.getElementById('branding-form');
const siteNameInput = document.getElementById('site-name-input');
const accentColorInput = document.getElementById('accent-color-input');
const accentColorText = document.getElementById('accent-color-text');
const configForm = document.getElementById('config-form');
const keyInput = document.getElementById('key-input');
const keyPill = document.getElementById('key-pill');
const keyStatus = document.getElementById('key-status');
const logoutBtn = document.getElementById('logout-btn');
const statusArea = document.getElementById('admin-status');

const { t, tError } = window.i18n;

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

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
  brandingCard.hidden = true;
  configCard.hidden = true;
}

function showAdminPanels() {
  loginCard.hidden = true;
  brandingCard.hidden = false;
  configCard.hidden = false;
}

function showKeyStatus(data) {
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

function fillBrandingForm(data) {
  siteNameInput.value = data.siteName || '';
  if (HEX_COLOR_RE.test(data.accentColor)) {
    accentColorInput.value = data.accentColor;
    accentColorText.value = data.accentColor;
  }
}

async function loadAdminData() {
  const [configResponse, brandingResponse] = await Promise.all([
    fetch('/api/admin/config'),
    fetch('/api/admin/branding'),
  ]);

  if (configResponse.status === 401 || brandingResponse.status === 401) {
    showLogin();
    return;
  }

  showKeyStatus(await configResponse.json());
  fillBrandingForm(await brandingResponse.json());
  showAdminPanels();
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
  await loadAdminData();
});

// Garde le sélecteur de couleur et le champ texte synchronisés.
accentColorInput.addEventListener('input', () => {
  accentColorText.value = accentColorInput.value;
});
accentColorText.addEventListener('input', () => {
  const value = accentColorText.value.trim();
  if (HEX_COLOR_RE.test(value)) accentColorInput.value = value;
});

brandingForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus(null);

  const siteName = siteNameInput.value.trim();
  const accentColor = accentColorText.value.trim();

  if (!siteName) {
    setStatus(t('error.INVALID_SITE_NAME'), 'error');
    return;
  }
  if (!HEX_COLOR_RE.test(accentColor)) {
    setStatus(t('error.INVALID_COLOR'), 'error');
    return;
  }

  const response = await fetch('/api/admin/branding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteName, accentColor }),
  });

  const data = await response.json();

  if (!response.ok) {
    setStatus(tError(data.code, data.error), 'error');
    return;
  }

  setStatus(t('admin.status.brandingSaveSuccess'), 'info');
  setTimeout(() => location.reload(), 700);
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
  await loadAdminData();
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/admin/logout', { method: 'POST' });
  showLogin();
});

loadAdminData();
