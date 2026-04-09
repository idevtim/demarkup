/**
 * DeMarkup debug logger.
 * Stores structured log entries in chrome.storage.local for export in bug reports.
 * Keeps the most recent MAX_ENTRIES to avoid unbounded storage growth.
 */
const DeMarkupLogger = (() => {
  const STORAGE_KEY = 'demarkup_logs';
  const MAX_ENTRIES = 500;

  async function getEntries() {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    return data[STORAGE_KEY] || [];
  }

  async function log(level, source, message, detail) {
    const entries = await getEntries();
    entries.push({
      ts: new Date().toISOString(),
      level,
      source,
      message,
      detail: detail || null
    });

    // Trim to max size
    if (entries.length > MAX_ENTRIES) {
      entries.splice(0, entries.length - MAX_ENTRIES);
    }

    await chrome.storage.local.set({ [STORAGE_KEY]: entries });
  }

  return {
    info(source, message, detail) {
      return log('info', source, message, detail);
    },

    warn(source, message, detail) {
      return log('warn', source, message, detail);
    },

    error(source, message, detail) {
      return log('error', source, message, detail);
    },

    async export() {
      const entries = await getEntries();
      const manifest = chrome.runtime.getManifest();
      return {
        extension: manifest.name,
        version: manifest.version,
        exportedAt: new Date().toISOString(),
        browser: navigator.userAgent,
        entryCount: entries.length,
        entries
      };
    },

    async clear() {
      await chrome.storage.local.remove(STORAGE_KEY);
    }
  };
})();
