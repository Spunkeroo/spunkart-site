/**
 * SpunkArt Cross-Network Promo Injector v1.0
 * ============================================
 * Drop-in script that injects the SpunkArt promotional banner system
 * into any webpage. Uses Shadow DOM for complete style isolation.
 *
 * Usage:
 *   <script src="https://spunkart.com/promo.js"></script>
 *
 * Options (via data attributes on the script tag):
 *   data-sa-topbar="false"     — disable the sticky top bar
 *   data-sa-sidebar="false"    — disable the sidebar CTA
 *   data-sa-footer="false"     — disable the footer cross-sell
 *   data-sa-ref="custom-ref"   — override auto-detected referral tag
 *   data-sa-delay="3000"       — delay injection by N milliseconds
 *   data-sa-rotate="8000"      — top bar message rotation interval (ms)
 *
 * All styles are scoped inside Shadow DOM — zero interference with host page.
 * Dismiss state persisted in localStorage for 24 hours.
 * GA4 events fired automatically if gtag() is available on the host page.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Script options — read from the <script> tag's data attributes
  // ---------------------------------------------------------------------------
  var currentScript = document.currentScript || (function () {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var opts = {
    topbar:  currentScript.getAttribute('data-sa-topbar') !== 'false',
    sidebar: currentScript.getAttribute('data-sa-sidebar') !== 'false',
    footer:  currentScript.getAttribute('data-sa-footer') !== 'false',
    ref:     currentScript.getAttribute('data-sa-ref') || null,
    delay:   parseInt(currentScript.getAttribute('data-sa-delay'), 10) || 0,
    rotate:  parseInt(currentScript.getAttribute('data-sa-rotate'), 10) || 5000
  };

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------
  var STORE_URL   = 'https://spunkart.com/store';
  var FREE_URL    = 'https://spunkart.com/store#free-tools';
  var EBOOK_URL   = 'https://spunkart.com/ebook';
  var RESELL_URL  = 'https://spunkart.com/reseller';
  var DISMISS_KEY = 'spunkart_promo_dismissed';
  var DISMISS_TTL = 86400000; // 24 h

  var SITE_REF = opts.ref || location.hostname.replace(/^www\./, '').replace(/\./g, '-');

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  function refLink(url) {
    var sep = url.indexOf('?') === -1 ? '?' : '&';
    if (url.indexOf('#') !== -1) {
      var parts = url.split('#');
      return parts[0] + sep + 'ref=' + SITE_REF + '#' + parts[1];
    }
    return url + sep + 'ref=' + SITE_REF;
  }

  function trackEvent(name, params) {
    try {
      if (typeof gtag === 'function') {
        gtag('event', name, params || {});
      }
    } catch (e) { /* silent */ }
  }

  function isDismissed() {
    try {
      var raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) return false;
      if (Date.now() - parseInt(raw, 10) < DISMISS_TTL) return true;
      localStorage.removeItem(DISMISS_KEY);
    } catch (e) {}
    return false;
  }

  function setDismissed() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {}
  }

  // ---------------------------------------------------------------------------
  // CSS (identical to promo-banner.html, inlined for self-containment)
  // ---------------------------------------------------------------------------
  var CSS = [
    '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }',
    'a { color: inherit; text-decoration: none; }',
    ':host {',
    '  --sa-bg: #0a0a0a; --sa-bg-alt: #141414;',
    '  --sa-accent: #ff5f1f; --sa-accent-hover: #ff7a40;',
    '  --sa-text: #e0e0e0; --sa-text-muted: #888;',
    '  --sa-radius: 8px;',
    '  --sa-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;',
    '  font-family: var(--sa-font); font-size: 14px; line-height: 1.5; color: var(--sa-text);',
    '}',

    /* TOP BAR */
    '.sa-topbar {',
    '  position: fixed; top: 0; left: 0; right: 0; z-index: 2147483647;',
    '  background: var(--sa-bg); border-bottom: 1px solid #222;',
    '  display: flex; align-items: center; justify-content: center;',
    '  height: 38px; padding: 0 48px 0 16px; overflow: hidden;',
    '  transition: transform .3s ease;',
    '}',
    '.sa-topbar.sa-hidden { transform: translateY(-100%); pointer-events: none; }',
    '.sa-topbar-msg { white-space: nowrap; font-size: 13px; color: var(--sa-text); animation: sa-fade 0.4s ease; }',
    '.sa-topbar-msg a { color: var(--sa-accent); font-weight: 600; border-bottom: 1px dotted var(--sa-accent); transition: color .2s; }',
    '.sa-topbar-msg a:hover { color: var(--sa-accent-hover); }',
    '.sa-topbar-close {',
    '  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);',
    '  background: none; border: none; color: var(--sa-text-muted);',
    '  font-size: 18px; cursor: pointer; line-height: 1; padding: 4px; transition: color .2s;',
    '}',
    '.sa-topbar-close:hover { color: #fff; }',
    '@keyframes sa-fade { from { opacity: 0; } to { opacity: 1; } }',

    /* SIDEBAR */
    '.sa-sidebar {',
    '  position: fixed; right: 0; top: 50%; transform: translateY(-50%);',
    '  z-index: 2147483646; display: flex; align-items: stretch;',
    '}',
    '.sa-sidebar-toggle {',
    '  writing-mode: vertical-rl; text-orientation: mixed;',
    '  background: var(--sa-accent); color: #fff; border: none;',
    '  padding: 12px 6px; font-size: 12px; font-weight: 700;',
    '  letter-spacing: 0.5px; cursor: pointer;',
    '  border-radius: var(--sa-radius) 0 0 var(--sa-radius);',
    '  transition: background .2s; font-family: var(--sa-font);',
    '}',
    '.sa-sidebar-toggle:hover { background: var(--sa-accent-hover); }',
    '.sa-sidebar-panel {',
    '  background: var(--sa-bg); border: 1px solid #222; border-right: none;',
    '  border-radius: var(--sa-radius) 0 0 var(--sa-radius);',
    '  width: 240px; padding: 20px 16px;',
    '  transform: translateX(100%); transition: transform .3s ease;',
    '}',
    '.sa-sidebar.sa-open .sa-sidebar-panel { transform: translateX(0); }',
    '.sa-sidebar.sa-open .sa-sidebar-toggle { border-radius: 0; }',
    '.sa-sidebar-logo {',
    '  width: 32px; height: 32px; border-radius: 6px; margin-bottom: 12px;',
    '  background: var(--sa-accent); display: flex; align-items: center;',
    '  justify-content: center; font-weight: 900; font-size: 18px; color: #fff;',
    '}',
    '.sa-sidebar h3 { font-size: 16px; font-weight: 700; color: #fff; margin-bottom: 12px; }',
    '.sa-sidebar ul { list-style: none; margin-bottom: 16px; }',
    '.sa-sidebar ul li {',
    '  font-size: 13px; color: var(--sa-text); padding: 4px 0;',
    '  display: flex; align-items: flex-start; gap: 6px;',
    '}',
    '.sa-sidebar ul li::before { content: "\\2713"; color: var(--sa-accent); font-weight: 700; flex-shrink: 0; }',
    '.sa-sidebar-btn {',
    '  display: block; width: 100%; text-align: center;',
    '  background: var(--sa-accent); color: #fff;',
    '  font-size: 14px; font-weight: 700; padding: 10px 0;',
    '  border-radius: var(--sa-radius); border: none; cursor: pointer;',
    '  transition: background .2s; font-family: var(--sa-font);',
    '}',
    '.sa-sidebar-btn:hover { background: var(--sa-accent-hover); }',

    /* FOOTER */
    '.sa-footer {',
    '  background: var(--sa-bg); border-top: 1px solid #222;',
    '  padding: 28px 20px; text-align: center;',
    '}',
    '.sa-footer-brand { font-size: 12px; color: var(--sa-text-muted); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }',
    '.sa-footer-brand span { color: var(--sa-accent); font-weight: 700; }',
    '.sa-footer-links { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; margin-bottom: 10px; }',
    '.sa-footer-links a { font-size: 13px; color: var(--sa-text); transition: color .2s; }',
    '.sa-footer-links a:hover { color: var(--sa-accent); }',
    '.sa-footer-copy { font-size: 12px; color: var(--sa-text-muted); }',

    /* MOBILE */
    '@media (max-width: 640px) {',
    '  .sa-topbar { height: 34px; padding: 0 40px 0 10px; }',
    '  .sa-topbar-msg { font-size: 11px; }',
    '  .sa-sidebar-panel { width: 200px; padding: 16px 12px; }',
    '  .sa-sidebar-toggle { font-size: 10px; padding: 10px 4px; }',
    '  .sa-footer-links { gap: 12px; }',
    '}'
  ].join('\n');

  // ---------------------------------------------------------------------------
  // Rotating messages
  // ---------------------------------------------------------------------------
  var messages = [
    'New: 18 Cloudflare Workers &mdash; deploy in 60 seconds. From $4.99 &rarr; <a href="' + refLink(STORE_URL) + '" target="_blank" rel="noopener">spunkart.com/store</a>',
    'Free tools: Password Generator, PDF Tools, Budget Tracker &rarr; <a href="' + refLink(FREE_URL) + '" target="_blank" rel="noopener">spunkart.com/store</a>',
    'Build 120+ websites in 7 days &mdash; get the ebook &rarr; <a href="' + refLink(EBOOK_URL) + '" target="_blank" rel="noopener">spunkart.com/ebook</a>'
  ];

  // ---------------------------------------------------------------------------
  // Inject
  // ---------------------------------------------------------------------------
  function inject() {
    // Create host element
    var host = document.createElement('div');
    host.id = 'spunkart-promo-root';
    host.style.cssText = 'all: initial; position: static; display: block;';
    document.body.appendChild(host);

    var shadow = host.attachShadow({ mode: 'open' });

    // Inject styles
    var styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    shadow.appendChild(styleEl);

    // ----- TOP BAR -----
    if (opts.topbar && !isDismissed()) {
      var topbar = document.createElement('div');
      topbar.className = 'sa-topbar';

      var msgEl = document.createElement('span');
      msgEl.className = 'sa-topbar-msg';
      msgEl.innerHTML = messages[0];

      var closeBtn = document.createElement('button');
      closeBtn.className = 'sa-topbar-close';
      closeBtn.innerHTML = '&times;';
      closeBtn.setAttribute('aria-label', 'Dismiss promo bar');

      topbar.appendChild(msgEl);
      topbar.appendChild(closeBtn);
      shadow.appendChild(topbar);

      var msgIndex = 0;
      var rotateInterval = setInterval(function () {
        msgIndex = (msgIndex + 1) % messages.length;
        msgEl.style.animation = 'none';
        void msgEl.offsetWidth;
        msgEl.innerHTML = messages[msgIndex];
        msgEl.style.animation = 'sa-fade 0.4s ease';
      }, opts.rotate);

      closeBtn.addEventListener('click', function () {
        topbar.classList.add('sa-hidden');
        setDismissed();
        clearInterval(rotateInterval);
        trackEvent('spunkart_promo_dismiss', { component: 'topbar', site: SITE_REF });
      });

      topbar.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          trackEvent('spunkart_promo_click', { component: 'topbar', url: e.target.href, site: SITE_REF });
        }
      });

      trackEvent('spunkart_promo_impression', { component: 'topbar', site: SITE_REF });
    }

    // ----- SIDEBAR CTA -----
    if (opts.sidebar) {
      var sidebar = document.createElement('div');
      sidebar.className = 'sa-sidebar';

      var toggleBtn = document.createElement('button');
      toggleBtn.className = 'sa-sidebar-toggle';
      toggleBtn.textContent = 'EDGE TOOLS';

      var panel = document.createElement('div');
      panel.className = 'sa-sidebar-panel';
      panel.innerHTML = [
        '<div class="sa-sidebar-logo">S</div>',
        '<h3>Get Edge Tools</h3>',
        '<ul>',
        '  <li>18 Cloudflare Workers, ready to deploy</li>',
        '  <li>Free password, PDF &amp; budget tools</li>',
        '  <li>Step-by-step ebook: 120+ sites in 7 days</li>',
        '</ul>',
        '<a class="sa-sidebar-btn" href="' + refLink(STORE_URL) + '" target="_blank" rel="noopener">Shop Now</a>'
      ].join('');

      sidebar.appendChild(toggleBtn);
      sidebar.appendChild(panel);
      shadow.appendChild(sidebar);

      toggleBtn.addEventListener('click', function () {
        var isOpen = sidebar.classList.toggle('sa-open');
        trackEvent('spunkart_promo_click', {
          component: 'sidebar_toggle',
          state: isOpen ? 'open' : 'close',
          site: SITE_REF
        });
      });

      panel.querySelector('.sa-sidebar-btn').addEventListener('click', function () {
        trackEvent('spunkart_promo_click', { component: 'sidebar_cta', url: this.href, site: SITE_REF });
      });

      trackEvent('spunkart_promo_impression', { component: 'sidebar', site: SITE_REF });
    }

    // ----- FOOTER CROSS-SELL -----
    if (opts.footer) {
      var footer = document.createElement('div');
      footer.className = 'sa-footer';
      footer.innerHTML = [
        '<div class="sa-footer-brand">Powered by <span>SpunkArt</span></div>',
        '<div class="sa-footer-links">',
        '  <a href="' + refLink(STORE_URL) + '" target="_blank" rel="noopener">Store</a>',
        '  <a href="' + refLink(FREE_URL) + '" target="_blank" rel="noopener">Free Tools</a>',
        '  <a href="' + refLink(EBOOK_URL) + '" target="_blank" rel="noopener">Ebook</a>',
        '  <a href="' + refLink(RESELL_URL) + '" target="_blank" rel="noopener">Reseller</a>',
        '</div>',
        '<div class="sa-footer-copy">18 Cloudflare Workers. Deploy in 60 seconds.</div>'
      ].join('');

      shadow.appendChild(footer);

      footer.addEventListener('click', function (e) {
        if (e.target.tagName === 'A') {
          trackEvent('spunkart_promo_click', { component: 'footer', url: e.target.href, site: SITE_REF });
        }
      });

      trackEvent('spunkart_promo_impression', { component: 'footer', site: SITE_REF });
    }
  }

  // ---------------------------------------------------------------------------
  // Entry point — wait for DOM ready, then optional delay
  // ---------------------------------------------------------------------------
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    if (opts.delay > 0) {
      setTimeout(inject, opts.delay);
    } else {
      inject();
    }
  });

})();
