/**
 * LiTools Unified Web i18n & Extension Synchronization Manager
 * https://linkedintools.github.io/
 *
 * Rules:
 * 1. For extension users: all pages and content open in the same language as active LinkedIn language.
 * 2. For non-extension users: default strictly to English ('en').
 * 3. Locale files are stored in ./locales/{lang}.json on GitHub.
 */
(function() {
  'use strict';

  const SUPPORTED_LANGS = ['en', 'de', 'pt', 'fr', 'hi'];
  const DEFAULT_LANG = 'en';

  let currentLang = DEFAULT_LANG;
  let currentDict = {};
  const _localeCache = {};

  function normalizeLang(code) {
    if (!code || typeof code !== 'string') return DEFAULT_LANG;
    const base = code.trim().toLowerCase().split(/[-_]/)[0];
    return SUPPORTED_LANGS.includes(base) ? base : DEFAULT_LANG;
  }

  // Detect whether this visitor is an authentic LiTools extension user
  function detectExtensionUserAndLanguage() {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlLang = params.get('lang');

      // 1. If explicit valid lang query parameter is present (passed from extension link or navigation)
      if (urlLang && SUPPORTED_LANGS.includes(normalizeLang(urlLang))) {
        const clean = normalizeLang(urlLang);
        try {
          localStorage.setItem('lit_extension_installed', 'true');
          localStorage.setItem('lit_extension_lang', clean);
        } catch (_) {}
        return { isExtensionUser: true, lang: clean };
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
        return { isExtensionUser: true, lang: clean };
      }

      // 3. Check persistent storage from previous session by an extension user
      const isInstalled = localStorage.getItem('lit_extension_installed') === 'true' ||
                          sessionStorage.getItem('lit_extension_installed') === 'true';
      const storedLang = localStorage.getItem('lit_extension_lang') ||
                         sessionStorage.getItem('lit_extension_lang');

      if (isInstalled && storedLang && SUPPORTED_LANGS.includes(normalizeLang(storedLang))) {
        return { isExtensionUser: true, lang: normalizeLang(storedLang) };
      }

      // 4. Non-extension user -> Strictly English ('en')
      return { isExtensionUser: false, lang: DEFAULT_LANG };
    } catch (_) {
      return { isExtensionUser: false, lang: DEFAULT_LANG };
    }
  }

  async function loadLocaleDictionary(lang) {
    const target = normalizeLang(lang);
    if (_localeCache[target]) {
      return _localeCache[target];
    }
    try {
      // Determine base URL relative to this script or root
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

  function translateDOM(dict) {
    if (!dict) return;

    // 1. Update HTML lang attribute
    document.documentElement.lang = currentLang;

    // 2. Translate document title if matching
    if (document.title) {
      if (!document._litOrigTitle) document._litOrigTitle = document.title.trim();
      const trTitle = dict[document._litOrigTitle];
      if (trTitle) document.title = trTitle;
    }

    // 3. TreeWalker for all text nodes
    const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
    let textNode;
    while ((textNode = walker.nextNode())) {
      const parent = textNode.parentElement;
      if (!parent) continue;
      const tag = parent.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'CODE') continue;

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
        // Revert to English original
        textNode.nodeValue = raw.replace(trimmed, orig);
      }
    }

    // 4. Attribute translations (title, placeholder, aria-label)
    document.querySelectorAll('[title], [placeholder], [aria-label]').forEach(el => {
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
        // Internal page link
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
  }

  async function applyLanguage(lang) {
    const clean = normalizeLang(lang);
    currentLang = clean;
    window.currentLang = clean;

    const dict = await loadLocaleDictionary(clean);
    currentDict = dict;
    window.currentLocaleDict = dict;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => translateDOM(dict), { once: true });
    } else {
      translateDOM(dict);
    }

    // Trigger re-render of dynamic page elements if listeners exist
    window.dispatchEvent(new CustomEvent('lit_locale_applied', { detail: { lang: clean, dict } }));
  }

  // Public API
  window.t = t;
  window.localizeSecurityEvent = localizeSecurityEvent;
  window.localizeSecurityDetails = localizeSecurityDetails;
  window.applyLanguage = applyLanguage;
  window.currentLang = currentLang;

  // Initialize Language
  const detection = detectExtensionUserAndLanguage();
  applyLanguage(detection.lang);

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
