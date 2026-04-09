const defaults = {
  includeMetadata: false,
  includeLlmContext: true,
  bulletStyle: '-',
  headingStyle: 'atx',
  linkStyle: 'inlined'
};

const fields = Object.keys(defaults);
const savedMsg = document.getElementById('saved-msg');
const shortcutsLink = document.getElementById('shortcuts-link');

// Chrome doesn't allow direct navigation to chrome:// URLs, so open via clipboard hint
shortcutsLink.addEventListener('click', (e) => {
  e.preventDefault();
  navigator.clipboard.writeText('chrome://extensions/shortcuts').then(() => {
    shortcutsLink.textContent = 'URL copied — paste in address bar';
    setTimeout(() => {
      shortcutsLink.textContent = 'chrome://extensions/shortcuts';
    }, 2000);
  });
});

// Load saved settings
chrome.storage.sync.get(defaults, (items) => {
  for (const key of fields) {
    const el = document.getElementById(key);
    if (el.type === 'checkbox') {
      el.checked = items[key];
    } else {
      el.value = items[key];
    }
  }
});

// Auto-save on change
for (const key of fields) {
  const el = document.getElementById(key);
  el.addEventListener('change', () => {
    const value = el.type === 'checkbox' ? el.checked : el.value;
    chrome.storage.sync.set({ [key]: value }, () => {
      savedMsg.classList.remove('hidden');
      setTimeout(() => savedMsg.classList.add('hidden'), 1500);
    });
  });
}

// Debug log export
const exportLogsBtn = document.getElementById('export-logs-btn');
const clearLogsBtn = document.getElementById('clear-logs-btn');

exportLogsBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'exportLogs' }, (logData) => {
    const json = JSON.stringify(logData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demarkup-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

clearLogsBtn.addEventListener('click', () => {
  if (confirm('Clear all debug logs?')) {
    chrome.runtime.sendMessage({ action: 'clearLogs' }, () => {
      savedMsg.textContent = 'Logs cleared';
      savedMsg.classList.remove('hidden');
      setTimeout(() => {
        savedMsg.classList.add('hidden');
        savedMsg.textContent = 'Settings saved';
      }, 1500);
    });
  }
});
