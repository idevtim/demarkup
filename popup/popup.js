const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const settingsBtn = document.getElementById('settings-btn');
const modeMain = document.getElementById('mode-main');
const modeFull = document.getElementById('mode-full');
const statsEl = document.getElementById('stats');
const errorEl = document.getElementById('error');
const wordCount = document.getElementById('word-count');
const charCount = document.getElementById('char-count');
const tokenCount = document.getElementById('token-count');

let currentMode = 'main';
let lastResult = null;

// Restore last-used mode
chrome.storage.sync.get({ conversionMode: 'main' }, (items) => {
  currentMode = items.conversionMode;
  if (currentMode === 'full') {
    modeFull.classList.add('active');
    modeMain.classList.remove('active');
  }
});

// Mode toggle
modeMain.addEventListener('click', () => {
  currentMode = 'main';
  modeMain.classList.add('active');
  modeFull.classList.remove('active');
  chrome.storage.sync.set({ conversionMode: 'main' });
});

modeFull.addEventListener('click', () => {
  currentMode = 'full';
  modeFull.classList.add('active');
  modeMain.classList.remove('active');
  chrome.storage.sync.set({ conversionMode: 'full' });
});

// Settings
settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Copy
copyBtn.addEventListener('click', async () => {
  copyBtn.disabled = true;
  copyBtn.classList.add('loading');
  errorEl.classList.add('hidden');

  const result = await convert();
  copyBtn.classList.remove('loading');

  if (result.error) {
    showError(result.error);
    copyBtn.disabled = false;
    return;
  }

  lastResult = result;
  await navigator.clipboard.writeText(result.markdown);
  showStats(result.stats);
  showSuccess(copyBtn);
});

// Download
downloadBtn.addEventListener('click', async () => {
  downloadBtn.disabled = true;
  downloadBtn.classList.add('loading');
  errorEl.classList.add('hidden');

  let result = lastResult;
  if (!result) {
    result = await convert();
  }

  downloadBtn.classList.remove('loading');

  if (result.error) {
    showError(result.error);
    downloadBtn.disabled = false;
    return;
  }

  lastResult = result;
  showStats(result.stats);

  // Create and download file
  const filename = sanitizeFilename(result.title || 'page') + '.md';
  const blob = new Blob([result.markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  showSuccess(downloadBtn);
});

async function convert() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'convert', options: { mode: currentMode } },
      (response) => {
        resolve(response || { error: 'No response from background script' });
      }
    );
  });
}

function showStats(stats) {
  wordCount.textContent = `${stats.words.toLocaleString()} words`;
  charCount.textContent = `${stats.chars.toLocaleString()} chars`;
  tokenCount.textContent = `~${stats.tokens.toLocaleString()} tokens`;
  statsEl.classList.remove('hidden');
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove('hidden');
}

function showSuccess(btn) {
  btn.disabled = false;
  btn.classList.add('success');
  setTimeout(() => {
    btn.classList.remove('success');
  }, 1500);
}

function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .slice(0, 100);
}
