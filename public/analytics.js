/* DreamGrind privacy-first GA4 integration.
   Google Analytics is not requested until the visitor opts in to optional analytics. */
(() => {
  'use strict';
  const CONSENT_KEY = 'dg_analytics_consent_v1';
  const PENDING_PURCHASE_KEY = 'dg_pending_purchase';
  let configPromise = null;
  let initialized = false;
  let measurementId = '';

  const copy = {
    en: {
      title: 'Your privacy matters',
      body: 'DreamGrind uses essential browser storage for core store features. With your permission, optional analytics help us understand store visits and improve shopping. This choice does not enable advertising cookies.',
      accept: 'Allow analytics', reject: 'Reject optional', settings: 'Cookie settings',
      settingsTitle: 'Cookie preferences',
      settingsBody: 'Choose whether DreamGrind may use optional analytics. Essential storage remains active because the store needs it to work.',
      essential: 'Essential storage',
      essentialHelp: 'Required for the cart, country and language preferences, and secure account/session features.',
      analytics: 'Analytics',
      analyticsHelp: 'Helps us understand store visits and shopping steps so we can improve the experience.',
      save: 'Save choices', close: 'Close'
    },
    az: {
      title: 'Məxfiliyiniz bizim üçün vacibdir',
      body: 'DreamGrind səbət, ölkə və dil seçimi kimi əsas funksiyalar üçün zəruri brauzer yaddaşından istifadə edir. İcazənizlə, əlavə analitika mağazaya baxışları anlamağa və alış-veriş təcrübəsini yaxşılaşdırmağa kömək edir. Bu seçim reklam kukilərini aktivləşdirmir.',
      accept: 'Analitikaya icazə ver', reject: 'Əlavə analitikanı rədd et', settings: 'Kuki tənzimləmələri',
      settingsTitle: 'Kuki seçimləri',
      settingsBody: 'DreamGrind-in əlavə analitikadan istifadə etməsinə icazə verib-verməyəcəyinizi seçin. Mağazanın işləməsi üçün zəruri yaddaş aktiv qalır.',
      essential: 'Zəruri yaddaş',
      essentialHelp: 'Səbət, ölkə və dil seçimi, təhlükəsiz hesab və sessiya funksiyaları üçün tələb olunur.',
      analytics: 'Analitika',
      analyticsHelp: 'Mağazaya baxışları və alış addımlarını anlamağa, təcrübəni yaxşılaşdırmağa kömək edir.',
      save: 'Seçimləri yadda saxla', close: 'Bağla'
    }
  };

  function language() { return localStorage.getItem('dg_language') === 'az' ? 'az' : 'en'; }
  function t() { return copy[language()]; }
  function consentGranted() { return localStorage.getItem(CONSENT_KEY) === 'granted'; }

  async function getConfig() {
    if (!configPromise) {
      configPromise = fetch('/api/store-config', { cache: 'no-store' })
        .then(response => response.ok ? response.json() : null)
        .catch(error => {
          console.warn('DreamGrind analytics config unavailable.', error);
          return null;
        });
    }
    return configPromise;
  }

  function safeCampaignQuery() {
    const source = new URLSearchParams(window.location.search);
    const safe = new URLSearchParams();
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      const value = String(source.get(key) || '').trim().slice(0, 100);
      const digits = (value.match(/\d/g) || []).length;
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && digits < 7 && !/[<>]/.test(value)) safe.set(key, value);
    }
    return safe.toString();
  }

  async function ensureLoaded() {
    if (!consentGranted()) return false;
    if (initialized) return true;
    const config = await getConfig();
    const id = String(config?.analyticsMeasurementId || '').trim();
    if (!/^G-[A-Z0-9]+$/.test(id)) return false;

    measurementId = id;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
    script.onerror = () => { initialized = false; };
    document.head.appendChild(script);
    initialized = true;

    const campaignQuery = safeCampaignQuery();
    const safePath = window.location.pathname + (campaignQuery ? `?${campaignQuery}` : '') + window.location.hash;
    const safeLocation = window.location.origin + safePath;
    window.gtag('event', 'page_view', {
      page_location: safeLocation,
      page_path: safePath,
      page_title: document.title
    });
    return true;
  }

  async function track(eventName, parameters) {
    if (!consentGranted() || !(await ensureLoaded()) || !initialized) return false;
    window.gtag('event', eventName, parameters || {});
    return true;
  }

  async function flushPendingPurchase() {
    if (!consentGranted()) return false;
    let purchase = null;
    try { purchase = JSON.parse(sessionStorage.getItem(PENDING_PURCHASE_KEY) || 'null'); } catch (_) {}
    if (!purchase || !purchase.transaction_id) return false;

    const sentKey = 'dg_purchase_sent_' + String(purchase.transaction_id);
    if (localStorage.getItem(sentKey)) {
      sessionStorage.removeItem(PENDING_PURCHASE_KEY);
      return true;
    }
    if (!(await ensureLoaded()) || !initialized) return false;
    window.gtag('event', 'purchase', purchase);
    localStorage.setItem(sentKey, new Date().toISOString());
    sessionStorage.removeItem(PENDING_PURCHASE_KEY);
    return true;
  }

  function removeConsentUi() {
    document.getElementById('dgConsentBanner')?.remove();
    document.getElementById('dgConsentSettings')?.remove();
  }

  function saveConsent(allowAnalytics) {
    localStorage.setItem(CONSENT_KEY, allowAnalytics ? 'granted' : 'denied');
    localStorage.setItem('dg_analytics_consent_updated_at', new Date().toISOString());
    if (initialized && typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: allowAnalytics ? 'granted' : 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }
    removeConsentUi();
    if (allowAnalytics) ensureLoaded().then(() => flushPendingPurchase()).catch(() => {});
  }

  async function openSettings() {
    const config = await getConfig();
    if (!/^G-[A-Z0-9]+$/.test(String(config?.analyticsMeasurementId || '').trim())) return;
    const c = t();
    document.getElementById('dgConsentBanner')?.remove();
    document.getElementById('dgConsentSettings')?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'dgConsentSettings';
    overlay.className = 'dg-consent-overlay';
    overlay.innerHTML =
      '<section class="dg-consent-dialog" role="dialog" aria-modal="true" aria-labelledby="dgConsentTitle">' +
      '<div class="dg-consent-heading"><h2 id="dgConsentTitle">' + c.settingsTitle + '</h2><button type="button" class="dg-consent-close" aria-label="' + c.close + '">×</button></div>' +
      '<p>' + c.settingsBody + '</p>' +
      '<div class="dg-consent-choice"><div><strong>' + c.essential + '</strong><small>' + c.essentialHelp + '</small></div><input type="checkbox" checked disabled aria-label="' + c.essential + '"></div>' +
      '<label class="dg-consent-choice"><span><strong>' + c.analytics + '</strong><small>' + c.analyticsHelp + '</small></span><input id="dgAnalyticsChoice" type="checkbox" ' + (consentGranted() ? 'checked' : '') + '></label>' +
      '<div class="dg-consent-actions"><button type="button" class="dg-consent-primary" id="dgSaveConsent">' + c.save + '</button><button type="button" class="dg-consent-secondary" id="dgRejectConsent">' + c.reject + '</button></div></section>';

    overlay.addEventListener('click', event => {
      if (event.target === overlay) { overlay.remove(); renderBanner(); }
    });
    overlay.querySelector('.dg-consent-close').addEventListener('click', () => { overlay.remove(); renderBanner(); });
    overlay.querySelector('#dgSaveConsent').addEventListener('click', () => saveConsent(Boolean(overlay.querySelector('#dgAnalyticsChoice')?.checked)));
    overlay.querySelector('#dgRejectConsent').addEventListener('click', () => saveConsent(false));
    document.body.appendChild(overlay);
    overlay.querySelector('#dgAnalyticsChoice')?.focus();
  }

  async function renderBanner() {
    const choice = localStorage.getItem(CONSENT_KEY);
    if (choice === 'granted' || choice === 'denied' || document.getElementById('dgConsentBanner')) return;
    const config = await getConfig();
    if (!/^G-[A-Z0-9]+$/.test(String(config?.analyticsMeasurementId || '').trim())) return;
    if (localStorage.getItem(CONSENT_KEY) === 'granted' || localStorage.getItem(CONSENT_KEY) === 'denied') return;

    const c = t();
    const banner = document.createElement('section');
    banner.id = 'dgConsentBanner';
    banner.className = 'dg-consent-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', c.title);
    banner.innerHTML =
      '<div class="dg-consent-copy"><strong>' + c.title + '</strong><p>' + c.body + '</p></div>' +
      '<div class="dg-consent-actions"><button type="button" class="dg-consent-primary" id="dgAcceptConsent">' + c.accept + '</button>' +
      '<button type="button" class="dg-consent-secondary" id="dgRejectConsent">' + c.reject + '</button>' +
      '<button type="button" class="dg-consent-link" id="dgOpenConsentSettings">' + c.settings + '</button></div>';
    banner.querySelector('#dgAcceptConsent').addEventListener('click', () => saveConsent(true));
    banner.querySelector('#dgRejectConsent').addEventListener('click', () => saveConsent(false));
    banner.querySelector('#dgOpenConsentSettings').addEventListener('click', openSettings);
    document.body.appendChild(banner);
  }

  window.DGAnalytics = {
    track,
    flushPendingPurchase,
    openSettings,
    getConsent: () => localStorage.getItem(CONSENT_KEY) || 'unset'
  };

  function boot() {
    getConfig().then(config => {
      const configured = /^G-[A-Z0-9]+$/.test(String(config?.analyticsMeasurementId || '').trim());
      document.getElementById('dgCookieSettingsButton')?.toggleAttribute('hidden', !configured);
    });
    renderBanner();
    if (consentGranted()) ensureLoaded().then(() => flushPendingPurchase()).catch(() => {});
  }
  window.addEventListener('dg:language-change', () => {
    const settingsOpen = Boolean(document.getElementById('dgConsentSettings'));
    removeConsentUi();
    if (settingsOpen) openSettings(); else renderBanner();
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
