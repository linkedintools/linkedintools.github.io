/**
 * LiTools Unified Web i18n & Extension Synchronization Manager
 * https://linkedintools.github.io/
 *
 * Rules:
 * 1. For extension users: all pages and content open in the same language as active LinkedIn language.
 * 2. For non-extension users: default strictly to English ('en') unless manually changed via switcher.
 * 3. Every page includes an interactive "Languages" button and dropdown to switch language anytime.
 * 4. Locale files are stored in ./locales/{lang}.json on GitHub.
 */
(function() {
  'use strict';

  const SUPPORTED_LANGS = ['en', 'de', 'pt', 'fr', 'hi'];
  const DEFAULT_LANG = 'en';

  const LANG_NAMES = {
    en: 'English',
    de: 'Deutsch',
    pt: 'Português',
    fr: 'Français',
    hi: 'हिन्दी'
  };

  let currentLang = DEFAULT_LANG;
  let currentDict = {};
  const _localeCache = {};

  function normalizeLang(code) {
    if (!code || typeof code !== 'string') return DEFAULT_LANG;
    const base = code.trim().toLowerCase().split(/[-_]/)[0];
    return SUPPORTED_LANGS.includes(base) ? base : DEFAULT_LANG;
  }

  // Detect whether this visitor is an authentic LiTools extension user or has selected a language
  function detectInitialLanguage() {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');

      // 1. Explicit valid lang query parameter
      if (urlLang && SUPPORTED_LANGS.includes(normalizeLang(urlLang))) {
        const clean = normalizeLang(urlLang);
        try {
          localStorage.setItem('lit_extension_installed', 'true');
          localStorage.setItem('lit_extension_lang', clean);
        } catch (_) {}
        return clean;
      }

      // 2. Check DOM attribute injected by LiTools content script (website-bridge.js)
      const attrInstalled = document.documentElement.getAttribute('data-lit-installed');
      const attrLang = document.documentElement.getAttribute('data-lit-lang');
      if (attrInstalled === 'true' && attrLang) {
        const clean = normalizeLang(attrLang);
        try {
          localStorage.setItem('lit_extension_installed', 'true');
          localStorage.setItem('lit_extension_lang', clean);
        } catch (_) {}
        return clean;
      }

      // 3. Check persistent storage (extension installed or manual choice)
      const isInstalled = localStorage.getItem('lit_extension_installed') === 'true' ||
                          sessionStorage.getItem('lit_extension_installed') === 'true';
      const storedLang = localStorage.getItem('lit_extension_lang') ||
                         sessionStorage.getItem('lit_extension_lang');

      if (isInstalled && storedLang && SUPPORTED_LANGS.includes(normalizeLang(storedLang))) {
        return normalizeLang(storedLang);
      }

      // 4. Non-extension user -> Strictly English ('en')
      return DEFAULT_LANG;
    } catch (_) {
      return DEFAULT_LANG;
    }
  }

  async function loadLocaleDictionary(lang) {
    const target = normalizeLang(lang);
    if (_localeCache[target]) {
      return _localeCache[target];
    }
    try {
      const scriptEl = document.currentScript || document.querySelector('script[src*="i18n.js"]');
      let basePath = '';
      if (scriptEl && scriptEl.src) {
        basePath = scriptEl.src.substring(0, scriptEl.src.lastIndexOf('/') + 1);
      }
      const fetchUrl = (basePath || '') + 'locales/' + target + '.json';
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      _localeCache[target] = data;
      return data;
    } catch (e) {
      console.warn('[LiTools i18n] Failed to load locale dictionary for ' + target + ':', e);
      if (target !== DEFAULT_LANG) {
        return await loadLocaleDictionary(DEFAULT_LANG);
      }
      return {};
    }
  }

  function t(key, fallback) {
    if (!key || typeof key !== 'string') return fallback !== undefined ? fallback : key;
    const trimmed = key.trim();
    if (currentDict && currentDict[trimmed]) {
      return currentDict[trimmed];
    }
    return fallback !== undefined ? fallback : key;
  }

  function localizeSecurityEvent(eventType) {
    if (!eventType) return '';
    switch (eventType) {
      case 'INVALID_PASSWORD':
        return t('Invalid Password Attempt', 'Invalid Password Attempt');
      case 'ACCESS_GRANTED':
        return t('Access Granted', 'Access Granted');
      case 'ACCESS_DENIED':
        return t('Access Denied', 'Access Denied');
      case 'GATE_TRIGGERED':
        return t('Security Screen Triggered', 'Security Screen Triggered');
      case 'SECURITY_ENABLED':
        return t('Protection Enabled', 'Protection Enabled');
      case 'SECURITY_DISABLED':
        return t('Protection Disabled', 'Protection Disabled');
      case 'EXTENSION_UNINSTALLED':
      case 'UNINSTALLED':
        return t('Extension Uninstalled', 'Extension Uninstalled');
      case 'PUSH_SUBSCRIBED':
        return t('Mobile Alerts Paired', 'Mobile Alerts Paired');
      case 'PUSH_DELIVERY_FAILED':
        return t('Push Delivery Failed', 'Push Delivery Failed');
      case 'AUTOMATION_LOCKED':
        return t('Automation Locked', 'Automation Locked');
      case 'INTRUSION_DETECTED':
        return t('Intrusion Detected', 'Intrusion Detected');
      case 'TAB_LIMIT_EXCEEDED':
        return t('Tab Limit Exceeded', 'Tab Limit Exceeded');
      case 'PROMO_REPOST_VERIFIED':
        return t('Promo Repost Verified', 'Promo Repost Verified');
      case 'PROMO_REPOST_REVOKED':
        return t('Promo Repost Revoked', 'Promo Repost Revoked');
      default:
        return t(eventType, eventType);
    }
  }

  function localizeSecurityDetails(details) {
    if (!details || typeof details !== 'string') return details || '';
    const trimmed = details.trim();

    const bioMatch = trimmed.match(/^Tab\s+(\d+)\s+unlocked with biometrics\.?$/i);
    if (bioMatch) {
      return t('Tab {tabId} unlocked with biometrics.', 'Tab {tabId} unlocked with biometrics.').replace('{tabId}', bioMatch[1]);
    }

    const succMatch = trimmed.match(/^Tab\s+(\d+)\s+unlocked successfully\.?$/i);
    if (succMatch) {
      return t('Tab {tabId} unlocked successfully.', 'Tab {tabId} unlocked successfully.').replace('{tabId}', succMatch[1]);
    }

    const failTabMatch = trimmed.match(/^Failed unlock attempt with incorrect password on Tab\s+(\d+)\.?$/i);
    if (failTabMatch) {
      return t('Failed unlock attempt with incorrect password on Tab {tabId}.', 'Failed unlock attempt with incorrect password on Tab {tabId}.').replace('{tabId}', failTabMatch[1]);
    }

    if (/^Failed unlock attempt with incorrect password\.?$/i.test(trimmed)) {
      return t('Failed unlock attempt with incorrect password.', 'Failed unlock attempt with incorrect password.');
    }

    const gateMatch = trimmed.match(/^Security screen activated for tab\s+(\d+)\.\s*\(URL:\s*(.+)\)$/i);
    if (gateMatch) {
      const base = t('Security screen activated for tab {tabId}.', 'Security screen activated for tab {tabId}.').replace('{tabId}', gateMatch[1]);
      return `${base} (URL: ${gateMatch[2]})`;
    }

    if (/^LinkedIn Protection State Changed$/i.test(trimmed)) {
      return t('LinkedIn Protection State Changed', 'LinkedIn Protection State Changed');
    }

    if (/^Extension was uninstalled from browser\.?$/i.test(trimmed)) {
      return t('Extension was uninstalled from browser.', 'Extension was uninstalled from browser.');
    }

    if (/^No details provided$/i.test(trimmed)) {
      return t('No details provided', 'No details provided');
    }

    return t(trimmed, details);
  }

  // Inject Styles for the Languages Switcher Component
  function injectSwitcherStyles() {
    if (document.getElementById('lit-lang-styles')) return;
    const style = document.createElement('style');
    style.id = 'lit-lang-styles';
    style.textContent = `
      #litLangMount {
        position: relative;
        z-index: 1000;
      }
      .lit-lang-container {
        position: relative;
        display: inline-flex;
        align-items: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        z-index: 1000;
      }
      .lit-lang-btn {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.16);
        color: #ffffff;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12.5px;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        cursor: pointer;
        transition: all 0.15s ease;
        user-select: none;
        line-height: 1.4;
      }
      .lit-lang-btn:hover, .lit-lang-btn.active {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(0, 138, 210, 0.6);
        color: #ffffff;
      }
      .lit-lang-btn svg.lit-globe-icon {
        width: 14px;
        height: 14px;
        opacity: 0.9;
        flex-shrink: 0;
      }
      .lit-lang-btn svg.lit-arrow-icon {
        width: 10px;
        height: 10px;
        opacity: 0.7;
        transition: transform 0.2s ease;
        flex-shrink: 0;
      }
      .lit-lang-btn.active svg.lit-arrow-icon {
        transform: rotate(180deg);
      }
      .lit-lang-menu {
        display: none;
        position: absolute;
        top: calc(100% + 6px);
        right: 0;
        background: #1e1e1e;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 6px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
        min-width: 160px;
        padding: 5px 0;
        z-index: 99999;
      }
      .lit-lang-menu.open {
        display: block;
        animation: litFadeIn 0.15s ease-out;
      }
      @keyframes litFadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .lit-lang-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 14px;
        color: rgba(255, 255, 255, 0.82);
        font-size: 13px;
        cursor: pointer;
        transition: background 0.12s ease, color 0.12s ease;
        user-select: none;
      }
      .lit-lang-item:hover {
        background: rgba(0, 138, 210, 0.18);
        color: #ffffff;
      }
      .lit-lang-item.selected {
        color: #38bdf8;
        font-weight: 600;
        background: rgba(0, 138, 210, 0.09);
      }
      .lit-lang-item-check {
        font-size: 12px;
        color: #38bdf8;
        font-weight: bold;
      }
    `;
    document.head.appendChild(style);
  }

  // Render Language Switcher Widget
  function renderLanguageSwitcher() {
    injectSwitcherStyles();

    let mountEl = document.getElementById('litLangMount');
    if (!mountEl) {
      const targetWrap = document.querySelector('header .nav-container, .header, .card');
      if (targetWrap) {
        mountEl = document.createElement('div');
        mountEl.id = 'litLangMount';
        targetWrap.appendChild(mountEl);
      }
    }
    if (!mountEl) return;

    if (mountEl.querySelector('#litLangSwitcher')) {
      updateLanguageSwitcherState();
      return;
    }

    const itemsHtml = SUPPORTED_LANGS.map(code => {
      const isSelected = code === currentLang;
      return `
        <div class="lit-lang-item ${isSelected ? 'selected' : ''}" data-code="${code}" role="menuitem">
          <span>${LANG_NAMES[code] || code}</span>
          <span class="lit-lang-item-check" style="${isSelected ? '' : 'display:none;'}">✓</span>
        </div>
      `;
    }).join('');

    mountEl.innerHTML = `
      <div class="lit-lang-container" id="litLangSwitcher">
        <button type="button" class="lit-lang-btn" id="litLangBtn" aria-haspopup="true" aria-expanded="false" title="Languages">
          <svg class="lit-globe-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
            <path d="M2 12h20"></path>
          </svg>
          <span class="lit-lang-label">Languages</span>
          <svg class="lit-arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 9 6 6 6-6"></path>
          </svg>
        </button>
        <div class="lit-lang-menu" id="litLangMenu" role="menu">
          ${itemsHtml}
        </div>
      </div>
    `;

    const btn = document.getElementById('litLangBtn');
    const menu = document.getElementById('litLangMenu');

    if (!btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      if (isOpen) {
        menu.classList.remove('open');
        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
      } else {
        menu.classList.add('open');
        btn.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    menu.querySelectorAll('.lit-lang-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = item.getAttribute('data-code');
        if (code) {
          menu.classList.remove('open');
          btn.classList.remove('active');
          btn.setAttribute('aria-expanded', 'false');

          try {
            localStorage.setItem('lit_extension_installed', 'true');
            localStorage.setItem('lit_extension_lang', code);
          } catch (_) {}

          try {
            const url = new URL(window.location.href);
            url.searchParams.set('lang', code);
            window.history.replaceState({}, '', url.toString());
          } catch (_) {}

          applyLanguage(code);
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (!mountEl.contains(e.target)) {
        menu.classList.remove('open');
        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        menu.classList.remove('open');
        btn.classList.remove('active');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function updateLanguageSwitcherState() {
    const menu = document.getElementById('litLangMenu');
    if (!menu) return;
    menu.querySelectorAll('.lit-lang-item').forEach(it => {
      const isTarget = it.getAttribute('data-code') === currentLang;
      it.classList.toggle('selected', isTarget);
      const check = it.querySelector('.lit-lang-item-check');
      if (check) check.style.display = isTarget ? '' : 'none';
    });
  }

  function translateDOM(dict) {
    if (!dict) return;

    // 1. Update HTML lang attribute
    document.documentElement.lang = currentLang;

    // 2. Translate document title
    if (document.title) {
      if (!document._litOrigTitle) document._litOrigTitle = document.title.trim();
      const trTitle = dict[document._litOrigTitle];
      if (trTitle) document.title = trTitle;
    }

    // 3. TreeWalker for all text nodes
    const root = document.body || document.documentElement;
    if (!root) return;
    const SHOW_TEXT = (typeof window.NodeFilter !== 'undefined' && window.NodeFilter.SHOW_TEXT) || 4;
    const walker = document.createTreeWalker(root, SHOW_TEXT);
    let textNode;
    while ((textNode = walker.nextNode())) {
      const parent = textNode.parentElement;
      if (!parent) continue;
      const tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE') continue;
      if (parent.closest('#litLangSwitcher')) continue; // Skip language switcher button text

      const raw = textNode.nodeValue;
      const trimmed = raw.trim();
      if (!trimmed || trimmed.length < 2 || /^\d+$/.test(trimmed)) continue;

      if (!textNode._litOrig) {
        textNode._litOrig = trimmed;
      }

      const orig = textNode._litOrig;
      const target = dict[orig];
      if (target && target !== trimmed) {
        textNode.nodeValue = raw.replace(trimmed, target);
      } else if (!target && currentLang === DEFAULT_LANG && trimmed !== orig) {
        textNode.nodeValue = raw.replace(trimmed, orig);
      }
    }

    // 4. Attribute translations (title, placeholder, aria-label)
    document.querySelectorAll('[title], [placeholder], [aria-label]').forEach(el => {
      if (el.closest('#litLangSwitcher')) return;
      if (el.hasAttribute('title')) {
        const val = el.getAttribute('title').trim();
        if (!el._litOrigTitle) el._litOrigTitle = val;
        const target = dict[el._litOrigTitle];
        if (target) el.setAttribute('title', target);
        else if (currentLang === DEFAULT_LANG && el._litOrigTitle) el.setAttribute('title', el._litOrigTitle);
      }
      if (el.hasAttribute('placeholder')) {
        const val = el.getAttribute('placeholder').trim();
        if (!el._litOrigPl) el._litOrigPl = val;
        const target = dict[el._litOrigPl];
        if (target) el.setAttribute('placeholder', target);
        else if (currentLang === DEFAULT_LANG && el._litOrigPl) el.setAttribute('placeholder', el._litOrigPl);
      }
      if (el.hasAttribute('aria-label')) {
        const val = el.getAttribute('aria-label').trim();
        if (!el._litOrigAria) el._litOrigAria = val;
        const target = dict[el._litOrigAria];
        if (target) el.setAttribute('aria-label', target);
        else if (currentLang === DEFAULT_LANG && el._litOrigAria) el.setAttribute('aria-label', el._litOrigAria);
      }
    });

    // 5. Update internal links to maintain language consistency during user navigation
    if (currentLang !== DEFAULT_LANG) {
      document.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;
        if (href.endsWith('.html') || href.startsWith('/') || href.startsWith('./')) {
          try {
            const url = new URL(href, window.location.origin);
            if (url.origin === window.location.origin) {
              url.searchParams.set('lang', currentLang);
              a.setAttribute('href', url.pathname + url.search + url.hash);
            }
          } catch (_) {}
        }
      });
    }

    // 6. Update Switcher active state
    updateLanguageSwitcherState();
  }

  async function applyLanguage(lang) {
    const clean = normalizeLang(lang);
    currentLang = clean;
    window.currentLang = clean;

    const dict = await loadLocaleDictionary(clean);
    currentDict = dict;
    window.currentLocaleDict = dict;

    const run = () => {
      renderLanguageSwitcher();
      translateDOM(dict);
      window.dispatchEvent(new CustomEvent('lit_locale_applied', { detail: { lang: clean, dict } }));
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run, { once: true });
    } else {
      run();
    }
  }

  // Public API
  window.t = t;
  window.localizeSecurityEvent = localizeSecurityEvent;
  window.localizeSecurityDetails = localizeSecurityDetails;
  window.applyLanguage = applyLanguage;
  window.currentLang = currentLang;

  // Initialize Language
  const initialLang = detectInitialLanguage();
  applyLanguage(initialLang);

  // Runtime listener for extension handshake (website-bridge.js)
  window.addEventListener('lit_extension_ready', (e) => {
    if (e.detail && e.detail.lang) {
      try {
        localStorage.setItem('lit_extension_installed', 'true');
        localStorage.setItem('lit_extension_lang', e.detail.lang);
      } catch (_) {}
      if (e.detail.lang !== currentLang) {
        applyLanguage(e.detail.lang);
      }
    }
  });

  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'LIT_EXTENSION_LANG_SYNC' && e.data.lang) {
      try {
        localStorage.setItem('lit_extension_installed', 'true');
        localStorage.setItem('lit_extension_lang', e.data.lang);
      } catch (_) {}
      if (e.data.lang !== currentLang) {
        applyLanguage(e.data.lang);
      }
    }
  });

})();
