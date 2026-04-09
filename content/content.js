// Guard against multiple injections
if (typeof window.__demarkupConvert === 'undefined') {

window.__demarkupConvert = function(options) {
  try {
    const mode = options.mode || 'main';
    let sourceElement = null;
    let pageTitle = document.title;
    let pageUrl = document.location.href;

    if (mode === 'selection') {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        sourceElement = document.createElement('div');
        for (let i = 0; i < selection.rangeCount; i++) {
          sourceElement.appendChild(selection.getRangeAt(i).cloneContents());
        }
      }
    } else if (mode === 'full') {
      sourceElement = document.body.cloneNode(true);
    } else {
      // Main content extraction
      sourceElement = extractMainContent();
    }

    if (!sourceElement || !sourceElement.textContent.trim()) {
      return { error: 'No content found to convert' };
    }

    // Clean the content
    cleanContent(sourceElement, mode !== 'full');

    // Resolve relative URLs
    resolveUrls(sourceElement);

    // Configure Turndown
    const turndownService = new TurndownService({
      headingStyle: options.headingStyle === 'setext' ? 'setext' : 'atx',
      bulletListMarker: options.bulletStyle || '-',
      linkStyle: options.linkStyle === 'referenced' ? 'referenced' : 'inlined',
      codeBlockStyle: 'fenced',
      emDelimiter: '*',
      strongDelimiter: '**',
      hr: '---'
    });

    // Add GFM plugin for tables and strikethrough
    if (typeof turndownPluginGfm !== 'undefined') {
      turndownService.use(turndownPluginGfm.gfm);
    }

    // Custom rule: detect code block language from class names
    turndownService.addRule('fencedCodeBlock', {
      filter: function(node) {
        return (
          node.nodeName === 'PRE' &&
          node.querySelector('code')
        );
      },
      replacement: function(content, node) {
        const code = node.querySelector('code');
        const className = code.getAttribute('class') || '';
        const langMatch = className.match(/(?:language-|lang-|highlight-)(\w+)/);
        const lang = langMatch ? langMatch[1] : '';
        const text = code.textContent.replace(/\n$/, '');
        return '\n\n```' + lang + '\n' + text + '\n```\n\n';
      }
    });

    // Convert using the DOM element directly
    let markdown = turndownService.turndown(sourceElement);

    // Clean up excessive blank lines
    markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

    // Prepend metadata if enabled
    if (options.includeMetadata) {
      const date = new Date().toISOString().split('T')[0];
      const frontMatter = [
        '---',
        'title: "' + pageTitle.replace(/"/g, '\\"') + '"',
        'url: "' + pageUrl + '"',
        'date: "' + date + '"',
        '---',
        '',
        ''
      ].join('\n');
      markdown = frontMatter + markdown;
    }

    // Add LLM context header if enabled
    if (options.includeLlmContext) {
      const header = '# ' + pageTitle + '\n\nSource: ' + pageUrl + '\n\n---\n\n';
      if (!options.includeMetadata) {
        markdown = header + markdown;
      }
    }

    // Calculate stats
    const words = markdown.split(/\s+/).filter(function(w) { return w.length > 0; }).length;
    const chars = markdown.length;
    const tokens = Math.ceil(chars / 4); // rough estimate

    return {
      markdown: markdown,
      title: pageTitle,
      url: pageUrl,
      stats: { words: words, chars: chars, tokens: tokens }
    };
  } catch (err) {
    return { error: err.message };
  }
};

function extractMainContent() {
  // Priority-ordered content selectors
  var selectors = [
    'article[role="main"]',
    'main article',
    'main',
    'article',
    '[role="main"]',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.content',
    '#content',
    '.post',
    '.article'
  ];

  for (var i = 0; i < selectors.length; i++) {
    var el = document.querySelector(selectors[i]);
    if (el && el.textContent.trim().length > 100) {
      return el.cloneNode(true);
    }
  }

  // Fallback: find the largest text block
  var candidates = document.querySelectorAll('div, section');
  var best = null;
  var bestLength = 0;

  for (var j = 0; j < candidates.length; j++) {
    var candidate = candidates[j];
    var text = candidate.textContent.trim();
    if (text.length > bestLength) {
      if (candidate === document.body || candidate === document.documentElement) continue;
      if (candidate.children.length > 50) continue;
      bestLength = text.length;
      best = candidate;
    }
  }

  if (best) return best.cloneNode(true);
  return document.body.cloneNode(true);
}

function cleanContent(container, aggressive) {
  // Remove script, style, and other non-content elements
  var removeSelectors = [
    'script', 'style', 'noscript', 'iframe', 'svg',
    'input', 'button', 'form', 'select', 'textarea'
  ];

  if (aggressive) {
    removeSelectors = removeSelectors.concat([
      'nav', 'footer', 'header', 'aside',
      '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
      '[role="complementary"]', '[aria-hidden="true"]',
      '.sidebar', '.nav', '.menu', '.footer', '.header',
      '.social-share', '.share-buttons', '.social-links',
      '.cookie-banner', '.cookie-notice', '.cookie-consent',
      '.ad', '.ads', '.advertisement', '.ad-container',
      '.popup', '.modal', '.overlay',
      '.comments', '.comment-section',
      '.related-posts', '.recommended',
      '.newsletter', '.subscribe'
    ]);
  }

  for (var i = 0; i < removeSelectors.length; i++) {
    var els = container.querySelectorAll(removeSelectors[i]);
    for (var j = 0; j < els.length; j++) {
      els[j].remove();
    }
  }

  // Remove hidden elements
  var allEls = container.querySelectorAll('*');
  for (var k = 0; k < allEls.length; k++) {
    var style = allEls[k].getAttribute('style') || '';
    if (
      style.indexOf('display: none') !== -1 || style.indexOf('display:none') !== -1 ||
      style.indexOf('visibility: hidden') !== -1 || style.indexOf('visibility:hidden') !== -1
    ) {
      allEls[k].remove();
    }
  }
}

function resolveUrls(container) {
  var base = document.location.href;

  var links = container.querySelectorAll('a[href]');
  for (var i = 0; i < links.length; i++) {
    try {
      links[i].setAttribute('href', new URL(links[i].getAttribute('href'), base).href);
    } catch(e) {}
  }

  var images = container.querySelectorAll('img[src]');
  for (var j = 0; j < images.length; j++) {
    try {
      images[j].setAttribute('src', new URL(images[j].getAttribute('src'), base).href);
    } catch(e) {}
  }
}

} // end guard
