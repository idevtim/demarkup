// Guard against multiple injections
if (typeof window.__demarkupConvert === 'undefined') {

window.__demarkupConvert = function(options) {
  try {
    const mode = options.mode || 'main';
    let sourceElement = null;

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
      sourceElement = extractMainContent();
    }

    if (!sourceElement || !sourceElement.textContent.trim()) {
      return { error: 'No content found to convert' };
    }

    return convertElementToMarkdown(sourceElement, options, mode !== 'full');
  } catch (err) {
    return { error: err.message };
  }
};

window.__demarkupPick = function(options) {
  if (window.__demarkupPickerActive) {
    return { alreadyActive: true };
  }
  window.__demarkupPickerActive = true;

  const style = document.createElement('style');
  style.id = '__demarkup-picker-style';
  style.textContent = [
    '.__demarkup-picking, .__demarkup-picking * {',
    '  cursor: crosshair !important;',
    '}',
    '#__demarkup-overlay {',
    '  position: fixed;',
    '  pointer-events: none;',
    '  z-index: 2147483646;',
    '  border: 2px solid #3a9a5c;',
    '  background: rgba(58, 154, 92, 0.12);',
    '  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.35), 0 2px 12px rgba(58, 154, 92, 0.25);',
    '  transition: top 60ms ease, left 60ms ease, width 60ms ease, height 60ms ease;',
    '  display: none;',
    '  box-sizing: border-box;',
    '}',
    '#__demarkup-hint {',
    '  position: fixed;',
    '  top: 16px;',
    '  left: 50%;',
    '  transform: translateX(-50%);',
    '  background: #111a15;',
    '  color: #eef3ef;',
    '  padding: 10px 16px;',
    '  border-radius: 8px;',
    '  font-family: -apple-system, BlinkMacSystemFont, sans-serif;',
    '  font-size: 13px;',
    '  font-weight: 500;',
    '  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);',
    '  z-index: 2147483647;',
    '  pointer-events: none;',
    '  border: 1px solid #2a3a2f;',
    '}',
    '#__demarkup-hint .kbd {',
    '  display: inline-block;',
    '  padding: 1px 6px;',
    '  margin: 0 4px;',
    '  background: #2a3a2f;',
    '  border-radius: 3px;',
    '  font-size: 11px;',
    '  color: #b8c8bc;',
    '}',
    '#__demarkup-tag {',
    '  position: fixed;',
    '  z-index: 2147483647;',
    '  background: #3a9a5c;',
    '  color: #fff;',
    '  font-family: ui-monospace, Menlo, Monaco, monospace;',
    '  font-size: 11px;',
    '  font-weight: 500;',
    '  padding: 2px 6px;',
    '  border-radius: 3px;',
    '  pointer-events: none;',
    '  white-space: nowrap;',
    '  display: none;',
    '}',
    '#__demarkup-toast {',
    '  position: fixed;',
    '  bottom: 24px;',
    '  left: 50%;',
    '  transform: translateX(-50%);',
    '  background: #1e5a34;',
    '  color: #eef3ef;',
    '  padding: 10px 18px;',
    '  border-radius: 8px;',
    '  font-family: -apple-system, BlinkMacSystemFont, sans-serif;',
    '  font-size: 13px;',
    '  font-weight: 500;',
    '  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);',
    '  z-index: 2147483647;',
    '  pointer-events: none;',
    '  animation: __demarkup-fade 0.2s ease;',
    '}',
    '@keyframes __demarkup-fade { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }'
  ].join('\n');
  document.head.appendChild(style);
  document.body.classList.add('__demarkup-picking');

  const overlay = document.createElement('div');
  overlay.id = '__demarkup-overlay';
  document.body.appendChild(overlay);

  const tag = document.createElement('div');
  tag.id = '__demarkup-tag';
  document.body.appendChild(tag);

  const hint = document.createElement('div');
  hint.id = '__demarkup-hint';
  hint.appendChild(document.createTextNode('Click an element to copy as Markdown \u00B7 '));
  const kbd = document.createElement('span');
  kbd.className = 'kbd';
  kbd.textContent = 'Esc';
  hint.appendChild(kbd);
  hint.appendChild(document.createTextNode(' cancel'));
  document.body.appendChild(hint);

  let currentHover = null;

  function describe(el) {
    let label = el.tagName.toLowerCase();
    if (el.id) label += '#' + el.id;
    else if (el.className && typeof el.className === 'string') {
      const cls = el.className.trim().split(/\s+/).slice(0, 2).join('.');
      if (cls) label += '.' + cls;
    }
    return label;
  }

  function positionOverlay(el) {
    if (!el || !el.getBoundingClientRect) return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      overlay.style.display = 'none';
      tag.style.display = 'none';
      return;
    }
    overlay.style.display = 'block';
    overlay.style.top = rect.top + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
    overlay.style.height = rect.height + 'px';

    tag.textContent = describe(el);
    tag.style.display = 'block';
    const tagTop = rect.top - 22;
    tag.style.top = (tagTop < 4 ? rect.bottom + 4 : tagTop) + 'px';
    tag.style.left = Math.max(4, rect.left) + 'px';
  }

  function clearHover() {
    currentHover = null;
    overlay.style.display = 'none';
    tag.style.display = 'none';
  }

  function cleanup() {
    window.__demarkupPickerActive = false;
    clearHover();
    document.body.classList.remove('__demarkup-picking');
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', onScroll, true);
    if (style.parentNode) style.remove();
    if (hint.parentNode) hint.remove();
    if (overlay.parentNode) overlay.remove();
    if (tag.parentNode) tag.remove();
  }

  function isOwnElement(el) {
    if (!el) return true;
    const id = el.id;
    return id === '__demarkup-hint' || id === '__demarkup-toast' ||
           id === '__demarkup-overlay' || id === '__demarkup-tag' ||
           id === '__demarkup-picker-style';
  }

  function elementUnder(x, y) {
    overlay.style.pointerEvents = 'none';
    const el = document.elementFromPoint(x, y);
    if (!el || isOwnElement(el)) return null;
    return el;
  }

  function onMouseMove(e) {
    const el = elementUnder(e.clientX, e.clientY);
    if (!el || el === currentHover) return;
    currentHover = el;
    positionOverlay(el);
  }

  function onScroll() {
    if (currentHover) positionOverlay(currentHover);
  }

  function onClick(e) {
    const target = elementUnder(e.clientX, e.clientY) || e.target;
    if (isOwnElement(target)) return;
    e.preventDefault();
    e.stopPropagation();
    cleanup();

    try {
      const clone = target.cloneNode(true);
      const result = convertElementToMarkdown(clone, options, false);
      if (result.error) {
        showToast(result.error, true);
        return;
      }
      navigator.clipboard.writeText(result.markdown).then(
        function() { showToast('Copied ' + result.stats.words + ' words'); },
        function(err) { showToast('Copy failed: ' + err.message, true); }
      );
    } catch (err) {
      showToast('Conversion failed: ' + err.message, true);
    }
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cleanup();
      showToast('Picker cancelled');
    }
  }

  document.addEventListener('mousemove', onMouseMove, true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', onScroll, true);

  return { activated: true };
};

function showToast(message, isError) {
  const existing = document.getElementById('__demarkup-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = '__demarkup-toast';
  toast.textContent = message;
  if (isError) {
    toast.style.background = '#d4604a';
  }
  document.body.appendChild(toast);
  setTimeout(function() {
    if (toast.parentNode) toast.remove();
  }, 2000);
}

function convertElementToMarkdown(sourceElement, options, aggressiveClean) {
  const pageTitle = document.title;
  const pageUrl = document.location.href;

  cleanContent(sourceElement, aggressiveClean);
  resolveUrls(sourceElement);

  const turndownService = new TurndownService({
    headingStyle: options.headingStyle === 'setext' ? 'setext' : 'atx',
    bulletListMarker: options.bulletStyle || '-',
    linkStyle: options.linkStyle === 'referenced' ? 'referenced' : 'inlined',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
    hr: '---'
  });

  if (typeof turndownPluginGfm !== 'undefined') {
    turndownService.use(turndownPluginGfm.gfm);
  }

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

  let markdown = turndownService.turndown(sourceElement);
  markdown = cleanMarkdown(markdown);

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

  const words = markdown.split(/\s+/).filter(function(w) { return w.length > 0; }).length;
  const chars = markdown.length;
  const tokens = Math.ceil(chars / 4);

  return {
    markdown: markdown,
    title: pageTitle,
    url: pageUrl,
    stats: { words: words, chars: chars, tokens: tokens }
  };
}

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

  // Always unwrap javascript: / unsafe:javascript: links (UI-only actions, not real navigation)
  var jsLinks = container.querySelectorAll('a[href^="javascript:"], a[href^="unsafe:javascript:"]');
  for (var ji = 0; ji < jsLinks.length; ji++) {
    var jsText = jsLinks[ji].textContent.trim();
    if (jsText) {
      var textNode = document.createTextNode(jsText);
      jsLinks[ji].parentNode.replaceChild(textNode, jsLinks[ji]);
    } else {
      jsLinks[ji].remove();
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

  // Remove empty links [](url) before collapsing multi-line ones
  markdown = markdown.replace(/\[\s*\]\([^)]*\)\s*/g, '');

  // Collapse multi-line links: [\n\ntext\n\n](url) → [text](url)
  markdown = markdown.replace(/\[\s*\n+([\s\S]*?)\n+\s*\]\(/g, function(match, text) {
    var collapsed = text.replace(/\s*\n\s*/g, ' ').trim();
    if (!collapsed) return ''; // Remove if text collapsed to nothing
    return '[' + collapsed + '](';
  });

  // Remove empty links again (may have been created by collapse)
  markdown = markdown.replace(/\[\s*\]\([^)]*\)\s*/g, '');

  // Remove links that wrap entire paragraphs (keep just the text)
  markdown = markdown.replace(/\[([^\]]{80,})\]\([^)]*\)/g, '$1');

  // Remove bold/italic from hashtags: **#Tag** or *#Tag* → #Tag
  markdown = markdown.replace(/\*{1,2}(#\w+)\*{1,2}/g, '$1');

  // Remove javascript: / unsafe:javascript: links entirely (UI-only buttons)
  markdown = markdown.replace(/\[([^\]]*)\]\((?:unsafe:)?javascript:[^)]*\)/g, '$1');

  // Remove all LinkedIn internal links (keep text only)
  markdown = markdown.replace(/\[([^\]]*)\]\(https?:\/\/(?:www\.)?linkedin\.com\/(?:search|feed|company|in\/|mynetwork|analytics|dashboard|jobs|overlay)[^)]*\)/g, '$1');

  // Collapse sequences of hashtags into a single line
  markdown = markdown.replace(/(#\w+\s*){3,}/g, function(match) {
    return match.replace(/\s+/g, ' ').trim() + '\n';
  });

  // Remove orphaned link reference definitions
  markdown = markdown.replace(/^\s*\[[^\]]*\]:\s*https?:\/\/\S+\s*$/gm, '');

  // Remove lines that are just a URL (no context)
  markdown = markdown.replace(/^\s*https?:\/\/\S+\s*$/gm, '');

  // Remove follower/connection count lines
  markdown = markdown.replace(/^\s*[\d,]+\s+followers?\s*$/gm, '');
  markdown = markdown.replace(/^\s*\d+\+?\s+connections?\s*$/gm, '');

  // Remove timestamp lines (1mo •, 2yr •, etc.)
  markdown = markdown.replace(/^\s*\d+\s*(mo|yr|wk|hr|d)\s*•?\s*$/gm, '');

  // Remove orphan characters (lone ·, +N, bullet noise)
  markdown = markdown.replace(/^\s*·\s*$/gm, '');
  markdown = markdown.replace(/^\s*\+\d+\s*$/gm, '');

  // Remove endorsement lines
  markdown = markdown.replace(/^\s*Endorsed by.*$/gm, '');
  markdown = markdown.replace(/^\s*\d+\s*endorsements?.*$/gm, '');

  // Remove site-name-only lines (e.g., "lunodb.app" on its own)
  markdown = markdown.replace(/^\s*[a-z0-9.-]+\.(com|app|io|org|net|dev)\s*$/gm, '');

  // Remove skill association noise ("and +1 skill", "and +3 skills")
  markdown = markdown.replace(/,?\s*and \+\d+ skills?\s*/g, '');

  // Remove list items that are just captions metadata
  markdown = markdown.replace(/^-\s*,\s*(selected|opens\s.*)\s*$/gm, '');

  // Remove empty list items and nested empty bullets (- followed by only whitespace or sub-bullets)
  markdown = markdown.replace(/^-\s*\n\s*\n/gm, '');
  markdown = markdown.replace(/^-\s*$/gm, '');
  // Collapse chains of empty nested list markers: -   -   -   -   Text → - Text
  markdown = markdown.replace(/^(-\s+){2,}/gm, '- ');

  // Remove list items that are just --- (horizontal rules inside lists)
  markdown = markdown.replace(/^-\s+---\s*$/gm, '');

  // Remove "There are 0 new alerts." and similar empty-state messages
  markdown = markdown.replace(/^\s*There are 0 .+$/gm, '');

  // Remove sections that are non-content for LLMs
  var removeSections = [
    'Profile language', 'Public profile & URL', 'Who your viewers also viewed',
    'People you may know', 'You might like', 'Interests', 'Skills'
  ];
  for (var i = 0; i < removeSections.length; i++) {
    var sectionRegex = new RegExp(
      '(?:^|\\n)(#{1,3}\\s*' + removeSections[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\n)[\\s\\S]*?(?=\\n#{1,3}\\s|$)',
      'i'
    );
    markdown = markdown.replace(sectionRegex, '');
  }

  // Strip leading tabs/spaces from lines (except code blocks)
  var inCodeBlock = false;
  var lines = markdown.split('\n');
  for (var li = 0; li < lines.length; li++) {
    if (/^```/.test(lines[li].trim())) {
      inCodeBlock = !inCodeBlock;
    } else if (!inCodeBlock) {
      lines[li] = lines[li].replace(/^[\t ]+/, '');
    }
  }
  markdown = lines.join('\n');

  // Clean up excessive blank lines and separators
  markdown = markdown.replace(/\n{3,}/g, '\n\n');
  markdown = markdown.replace(/(\n---\s*){2,}/g, '\n\n---\n');
  markdown = markdown.replace(/\n---\s*$/g, '');

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
    /^\s*\d+\s*connections? work here\s*$/i,
    /^\s*\d+\s*benefits?\s*$/i,
    /^\s*Loaded: \d+(\.\d+)?%\s*$/,
    /^\s*LIVE\s*$/,
    /^\s*\d+x\s*$/,
    /^\s*\d+:\d+\s*$/,
    /^\s*, selected\s*$/,
    /^\s*, opens .* dialog\s*$/,
    /^\s*Someone at .+\s*$/i,
    /^\s*Pages for you\s*$/i,
    /^\s*Posts\s*$/,
    /^\s*Comments\s*$/,
    /^\s*·\s*$/,
    /^\s*\+\d+\s*$/,
    /^\s*\d+\s*(mo|yr|wk|hr|d)\s*•?\s*$/,
    /^\s*[\d,]+\s+followers?\s*$/,
    /^\s*\d+\+?\s+connections?\s*$/,
    /^\s*Endorsed by\s/i,
    /^\s*\d+\s*endorsements?\/?/i,
    /^\s*Past \d+ days?\s*$/i
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
