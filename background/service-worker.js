// Context menu setup
chrome.runtime.onInstalled.addListener(() => {
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

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'convert') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        executeConversion(tabs[0], message.options).then(sendResponse);
      }
    });
    return true; // async response
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
      includeLlmContext: false
    });

    // Execute conversion
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: runConversion,
      args: [{ ...options, ...settings }]
    });

    return results[0]?.result || { error: 'No result returned' };
  } catch (err) {
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
