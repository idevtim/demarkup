importScripts('../lib/logger.js');

// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
  DeMarkupLogger.info('service-worker', 'Extension installed/updated');
  chrome.contextMenus.create({
    id: 'copy-page-markdown',
    title: 'Copy page as Markdown',
    contexts: ['page']
  });
  chrome.contextMenus.create({
    id: 'copy-selection-markdown',
    title: 'Copy selection as Markdown',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'copy-page-markdown') {
    executeConversion(tab, { mode: 'main' });
  } else if (info.menuItemId === 'copy-selection-markdown') {
    executeConversion(tab, { mode: 'selection' });
  }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'convert-page') {
    executeConversion(tab, { mode: 'main' });
  }
});

// Handle messages from popup and options
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'convert') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        executeConversion(tabs[0], message.options).then(sendResponse);
      }
    });
    return true; // async response
  }

  if (message.action === 'exportLogs') {
    DeMarkupLogger.export().then(sendResponse);
    return true;
  }

  if (message.action === 'clearLogs') {
    DeMarkupLogger.clear().then(sendResponse);
    return true;
  }
});

async function executeConversion(tab, options) {
  try {
    // Inject libraries and content script
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['lib/turndown.js', 'lib/turndown-plugin-gfm.js', 'content/content.js']
    });

    // Get settings
    const settings = await chrome.storage.sync.get({
      includeMetadata: false,
      bulletStyle: '-',
      headingStyle: 'atx',
      linkStyle: 'inlined',
      includeLlmContext: true
    });

    // Execute conversion
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: runConversion,
      args: [{ ...options, ...settings }]
    });

    const result = results[0]?.result || { error: 'No result returned' };

    if (result.error) {
      DeMarkupLogger.error('service-worker', 'Conversion failed', {
        error: result.error,
        url: tab.url,
        mode: options.mode
      });
    } else {
      DeMarkupLogger.info('service-worker', 'Conversion succeeded', {
        url: tab.url,
        mode: options.mode,
        words: result.stats?.words,
        chars: result.stats?.chars
      });
    }

    return result;
  } catch (err) {
    DeMarkupLogger.error('service-worker', 'executeConversion threw', {
      error: err.message,
      url: tab.url
    });
    return { error: err.message };
  }
}

function runConversion(options) {
  // This runs in the content script context
  if (typeof window.__demarkupConvert === 'function') {
    return window.__demarkupConvert(options);
  }
  return { error: 'Content script not loaded' };
}
