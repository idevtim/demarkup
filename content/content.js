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

    // Post-process markdown to remove remaining noise
    markdown = cleanMarkdown(markdown);

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

    // Optimize for LLM consumption
    if (options.includeLlmContext) {
      markdown = optimizeForLlm(markdown);
      const contentType = detectContentType(sourceElement, pageUrl);
      const header = '# ' + pageTitle + '\n\n'
        + '> **Source:** ' + pageUrl + '\n'
        + '> **Type:** ' + contentType + '\n'
        + '> **Extracted:** ' + new Date().toISOString().split('T')[0] + '\n\n'
        + '---\n\n';
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
      '.newsletter', '.subscribe',
      '.reactions-count', '.social-actions',
      '[data-test-id="video-player"]', 'video', 'audio'
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

  if (aggressive) {
    // Remove empty links (image-only or whitespace-only)
    var links = container.querySelectorAll('a');
    for (var li = 0; li < links.length; li++) {
      var linkText = links[li].textContent.trim();
      if (!linkText || linkText.length === 0) {
        links[li].remove();
      }
    }

    // Remove short action-button links (Comment, Send, Like, Share, etc.)
    var actionPattern = /^(comment|send|like|share|repost|follow|show all|add section|create a post|view job|contact info|posts|comments)$/i;
    var remainingLinks = container.querySelectorAll('a');
    for (var ai = 0; ai < remainingLinks.length; ai++) {
      var text = remainingLinks[ai].textContent.trim();
      if (actionPattern.test(text)) {
        remainingLinks[ai].remove();
      }
    }

    // Remove social engagement links (reactions, comments, reposts, follower counts)
    var engagementPattern = /^(\d+\s+(reactions?|comments?|reposts?|likes?)|.*reacted|.*followers?\s*$|\d+\s+others?\s+reacted)/i;
    var engagementLinks = container.querySelectorAll('a');
    for (var ei = 0; ei < engagementLinks.length; ei++) {
      var engText = engagementLinks[ei].textContent.trim();
      if (engagementPattern.test(engText)) {
        engagementLinks[ei].remove();
      }
    }

    // Convert hashtag links to plain text (e.g., LinkedIn search hashtag URLs)
    var hashLinks = container.querySelectorAll('a[href]');
    for (var hi = 0; hi < hashLinks.length; hi++) {
      var hashHref = hashLinks[hi].getAttribute('href') || '';
      var hashText = hashLinks[hi].textContent.trim();
      if (hashText.match(/^#\w/) && hashHref.indexOf('search/results') !== -1) {
        var span = document.createElement('span');
        span.textContent = hashText;
        hashLinks[hi].parentNode.replaceChild(span, hashLinks[hi]);
      }
    }

    // Remove duplicate sections (keep first occurrence of headings with same text)
    var headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    var seenHeadings = {};
    for (var si = 0; si < headings.length; si++) {
      var headingText = headings[si].textContent.trim();
      if (seenHeadings[headingText]) {
        // Remove everything between this duplicate heading and the next heading
        var dupeSection = headings[si];
        var nextEl = dupeSection.nextElementSibling;
        while (nextEl && !nextEl.matches('h1, h2, h3, h4, h5, h6')) {
          var toRemove = nextEl;
          nextEl = nextEl.nextElementSibling;
          toRemove.remove();
        }
        dupeSection.remove();
      } else {
        seenHeadings[headingText] = true;
      }
    }

    // Unwrap tracking/redirect URLs (e.g., linkedin.com/safety/go/?url=...)
    var allLinks = container.querySelectorAll('a[href]');
    for (var ri = 0; ri < allLinks.length; ri++) {
      var href = allLinks[ri].getAttribute('href') || '';
      var redirectMatch = href.match(/[?&]url=([^&]+)/);
      if (redirectMatch) {
        try {
          var decoded = decodeURIComponent(redirectMatch[1]);
          allLinks[ri].setAttribute('href', decoded);
        } catch (e) {}
      }
    }

    // Remove video player chrome text
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    var videoPatterns = /^(Video Player is loading|Current Time|Duration|Loaded:|Stream Type|Remaining Time|chapters|descriptions off|captions off|captions settings)/i;
    var textNodes = [];
    while (walker.nextNode()) {
      if (videoPatterns.test(walker.currentNode.textContent.trim())) {
        textNodes.push(walker.currentNode);
      }
    }
    for (var ti = 0; ti < textNodes.length; ti++) {
      var parent = textNodes[ti].parentNode;
      if (parent) parent.remove();
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

function optimizeForLlm(markdown) {
  // Remove all images (LLMs can't see them, and CDN URLs waste tokens)
  markdown = markdown.replace(/!\[[^\]]*\]\([^)]*\)\s*/g, '');

  // Remove links that wrap entire paragraphs (keep just the text)
  // Matches [text](url) where text is > 80 chars (likely a paragraph-as-link)
  markdown = markdown.replace(/\[([^\]]{80,})\]\([^)]*\)/g, '$1');

  // Remove bold/italic from hashtags: **#Tag** or *#Tag* → #Tag
  markdown = markdown.replace(/\*{1,2}(#\w+)\*{1,2}/g, '$1');

  // Remove links around short text that are just site-internal navigation
  // (e.g., follower counts, company names linking to their pages)
  markdown = markdown.replace(/\[([^\]]{1,40})\]\(https?:\/\/www\.linkedin\.com\/(?:search|feed|company|in\/)[^)]*\)/g, '$1');

  // Collapse sequences of hashtags into a single line
  markdown = markdown.replace(/(#\w+\s*){3,}/g, function(match) {
    return match.replace(/\s+/g, ' ').trim() + '\n';
  });

  // Remove orphaned link reference definitions with no meaningful text
  markdown = markdown.replace(/^\s*\[[^\]]*\]:\s*https?:\/\/\S+\s*$/gm, '');

  // Remove lines that are just a URL (no context)
  markdown = markdown.replace(/^\s*https?:\/\/\S+\s*$/gm, '');

  // Clean up excessive blank lines left behind
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  return markdown.trim();
}

function detectContentType(sourceElement, url) {
  var host = '';
  try { host = new URL(url).hostname.replace('www.', ''); } catch (e) {}

  // Check URL patterns
  if (/linkedin\.com\/in\//.test(url)) return 'LinkedIn Profile';
  if (/linkedin\.com\/company\//.test(url)) return 'LinkedIn Company Page';
  if (/linkedin\.com\/pulse\//.test(url)) return 'LinkedIn Article';
  if (/github\.com\/[^/]+\/[^/]+\/(issues|pull)\//.test(url)) return 'GitHub Issue/PR';
  if (/github\.com\/[^/]+\/[^/]+$/.test(url)) return 'GitHub Repository';
  if (/stackoverflow\.com\/questions\//.test(url)) return 'Stack Overflow Q&A';
  if (/reddit\.com\/r\//.test(url)) return 'Reddit Thread';
  if (/docs\./.test(url) || /documentation/.test(url) || /\/docs\//.test(url)) return 'Documentation';
  if (/\/api\//.test(url) || /\/reference\//.test(url)) return 'API Reference';
  if (/\/blog\//.test(url) || /\/posts?\//.test(url)) return 'Blog Post';
  if (/\/wiki\//.test(url)) return 'Wiki Page';

  // Check page structure
  if (sourceElement) {
    var hasArticle = sourceElement.querySelector('article');
    var hasTime = sourceElement.querySelector('time');
    var hasByline = sourceElement.querySelector('[class*="author"], [rel="author"], .byline');
    if (hasArticle && (hasTime || hasByline)) return 'Article';
    if (sourceElement.querySelector('pre code')) return 'Technical Page';
  }

  return 'Web Page';
}

function cleanMarkdown(markdown) {
  var lines = markdown.split('\n');
  var cleaned = [];
  var noisePatterns = [
    /^\s*Private to you\s*$/i,
    /^\s*• You\s*$/,
    /^\s*• \d+(st|nd|rd|th)\s*$/,
    /^\s*\d+\s*(reactions?|comments?|reposts?|likes?)\s*$/i,
    /^\s*.*and \d+ others? reacted\s*$/i,
    /^\s*\d+ connections? work here\s*$/i,
    /^\s*\d+ benefits?\s*$/i,
    /^\s*Loaded: \d+(\.\d+)?%\s*$/,
    /^\s*LIVE\s*$/,
    /^\s*\d+x\s*$/,
    /^\s*\d+:\d+\s*$/,
    /^\s*, selected\s*$/,
    /^\s*, opens .* dialog\s*$/,
    /^\s*Someone at .+\s*$/i,
    /^\s*Pages for you\s*$/i,
    /^\s*Posts\s*$/,
    /^\s*Comments\s*$/
  ];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    var isNoise = false;
    for (var j = 0; j < noisePatterns.length; j++) {
      if (noisePatterns[j].test(line)) {
        isNoise = true;
        break;
      }
    }
    if (!isNoise) {
      cleaned.push(line);
    }
  }

  var result = cleaned.join('\n');

  // Clean up excessive blank lines and trailing separators
  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.replace(/(\n---\s*){2,}/g, '\n---\n');
  result = result.replace(/\n---\s*\n---/g, '\n---');

  return result.trim();
}

} // end guard
