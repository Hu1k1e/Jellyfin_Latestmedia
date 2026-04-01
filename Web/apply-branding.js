/**
 * apply-branding.js — v3.0.2.0
 * Applies custom branding images (favicon, app icon, banner/logo) to the Jellyfin UI.
 * Lazy-loaded by latestmedia.js bootloader only when EnableCustomBranding is true.
 *
 * FIXES in v3.0.2:
 *  - Uses /Branding/Status endpoint (single authenticated fetch) to check all 4 types
 *    at once, instead of 3 separate uncoordinated XHR HEAD requests.
 *  - Added MutationObserver on <head> to re-apply favicon when Jellyfin's SPA
 *    restores its own icon links after navigation.
 *  - Properly waits for all status checks before deciding what to apply.
 */
(function () {
    'use strict';

    var cfg = window.__latestMediaConfig || {};
    if (!cfg.EnableCustomBranding) return;

    var BASE = '/Branding/';

    // Cache of what's available (populated by getStatus())
    var _status = null;
    var _statusPending = false;

    // ── Auth Headers ──────────────────────────────────────────────────────────

    function getAuthHeaders() {
        var S = window.__latestMediaState;
        if (!S || !S.tok) {
            // Fallback: try ApiClient if available
            if (window.ApiClient && ApiClient.accessToken) {
                var token = ApiClient.accessToken();
                var t = 'MediaBrowser Client="Jellyfin Web", Device="Branding", DeviceId="LMBrand1", Version="1.0.0", Token="' + token + '"';
                return { 'Authorization': t, 'X-Emby-Authorization': t };
            }
            return {};
        }
        var t = 'MediaBrowser Client="Jellyfin Web", Device="Plugin", DeviceId="' +
            (S.dev || 'LMPl1') + '", Version="1.0.0", Token="' + S.tok + '"';
        return { 'Authorization': t, 'X-Emby-Authorization': t };
    }

    // ── Status Check ─────────────────────────────────────────────────────────

    /**
     * Fetches /Branding/Status once and caches the result.
     * Returns a promise that resolves to {iconTransparent, favicon, bannerLight, bannerDark, enabled}
     */
    function getStatus() {
        if (_status) return Promise.resolve(_status);
        return fetch('/Branding/Status', { headers: getAuthHeaders() })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text().then(function (t) { return t ? JSON.parse(t) : null; });
            })
            .then(function (data) {
                _status = data;
                return data;
            })
            .catch(function (err) {
                console.debug('[LatestMedia] apply-branding: Status check failed:', err.message);
                // Return empty status — nothing will be applied
                return { iconTransparent: false, favicon: false, bannerLight: false, bannerDark: false, enabled: false };
            });
    }

    // ── Cache-busted URL ─────────────────────────────────────────────────────

    // Bust cache once per session (not per-minute, which caused excessive requests)
    var _cacheBust = Date.now();

    function brandingUrl(type) {
        return BASE + type + '?t=' + _cacheBust;
    }

    // ── Favicon Replacement ───────────────────────────────────────────────────

    var _faviconObserver = null;

    function applyFavicon() {
        var url = brandingUrl('favicon');
        var rels = ['icon', 'shortcut icon', 'apple-touch-icon', 'apple-touch-icon-precomposed'];

        rels.forEach(function (rel) {
            // Use attribute selector that is case-insensitive
            var existing = document.querySelector('link[rel="' + rel + '"]');
            if (existing) {
                if (existing.href !== url) existing.href = url;
            } else {
                var link = document.createElement('link');
                link.rel = rel;
                link.href = url;
                link.setAttribute('data-lm-favicon', '1');
                document.head.appendChild(link);
            }
        });

        // Watch <head> so if Jellyfin's SPA re-inserts its own favicon we re-replace it
        if (!_faviconObserver) {
            _faviconObserver = new MutationObserver(function (mutations) {
                var needsReapply = false;
                mutations.forEach(function (m) {
                    m.addedNodes.forEach(function (node) {
                        if (node.tagName === 'LINK' && !node.getAttribute('data-lm-favicon')) {
                            var rel = (node.getAttribute('rel') || '').toLowerCase();
                            if (rel === 'icon' || rel === 'shortcut icon' || rel.includes('apple-touch-icon')) {
                                // Jellyfin added back its favicon — replace it
                                needsReapply = true;
                            }
                        }
                    });
                });
                if (needsReapply) {
                    // Small wait to let Jellyfin finish its DOM update
                    setTimeout(applyFavicon, 50);
                }
            });
            _faviconObserver.observe(document.head, { childList: true });
        }
    }

    // ── Banner / Logo Images ──────────────────────────────────────────────────

    var LOGO_SELECTORS = [
        'img[src*="banner-light"]',
        'img[src*="banner-dark"]',
        'img.imgLogoHeader',
        '.loginDisclaimer img',
        '.readUserName img',
        '.mainDrawer-scrollContainer img[src*="logo"]',
        '.splash img',
        'img[src*="/web/assets/img/banner"]',
    ];

    function getBannerType() {
        // Use banner-dark for dark themes (default), banner-light otherwise
        return document.body.classList.contains('layout-light') ? 'banner-light' : 'banner-dark';
    }

    function applyBannerImages(status) {
        // Only apply if we have at least one banner uploaded
        var hasBanner = status.bannerDark || status.bannerLight;
        if (!hasBanner) return;

        var type = getBannerType();
        // If preferred type not available, fall back
        if (type === 'banner-dark' && !status.bannerDark && status.bannerLight) type = 'banner-light';
        if (type === 'banner-light' && !status.bannerLight && status.bannerDark) type = 'banner-dark';

        var url = brandingUrl(type);

        LOGO_SELECTORS.forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (img) {
                if (img.getAttribute('data-lm-branded')) return;
                img.src = url;
                img.removeAttribute('srcset');
                img.setAttribute('data-lm-branded', '1');
            });
        });
    }

    // ── App Icon Images ───────────────────────────────────────────────────────

    var ICON_SELECTORS = [
        'img[src*="icon-transparent"]',
        '.appIconContainer img',
        'img.appIcon',
        '.loginLogo img',
    ];

    function applyIconImages() {
        var url = brandingUrl('icon-transparent');
        ICON_SELECTORS.forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (img) {
                if (img.getAttribute('data-lm-icon-branded')) return;
                img.src = url;
                img.removeAttribute('srcset');
                img.setAttribute('data-lm-icon-branded', '1');
            });
        });
    }

    // ── Apply All ─────────────────────────────────────────────────────────────

    function applyBranding(status) {
        if (!status || !status.enabled) return;
        if (status.favicon) applyFavicon();
        applyBannerImages(status); // internally checks status.bannerDark/Light
        if (status.iconTransparent) applyIconImages();
    }

    // On SPA navigation: clear "already branded" markers so newly rendered elements get replaced
    function onNavigate() {
        document.querySelectorAll('[data-lm-branded], [data-lm-icon-branded]').forEach(function (el) {
            el.removeAttribute('data-lm-branded');
            el.removeAttribute('data-lm-icon-branded');
        });
        // Re-apply with cached status (fast, no network request)
        if (_status) applyBranding(_status);
    }

    // Register with shared observer for SPA navigation (throttled per rAF)
    var _rAfPending = false;
    if (window.__latestMediaObserver) {
        window.__latestMediaObserver.register('apply-branding', function () {
            if (!_rAfPending) {
                _rAfPending = true;
                requestAnimationFrame(function () {
                    _rAfPending = false;
                    onNavigate();
                });
            }
        });
    }

    // Also react to hashchange (covers cases the observer misses)
    window.addEventListener('hashchange', function () {
        setTimeout(onNavigate, 200);
    });

    // ── Initial Load ──────────────────────────────────────────────────────────

    function init() {
        // Wait for latestMediaState to be ready (it holds the auth token)
        // Retry up to 5 seconds
        var retries = 0;
        function tryInit() {
            var headers = getAuthHeaders();
            if (Object.keys(headers).length === 0 && retries < 50) {
                retries++;
                setTimeout(tryInit, 100);
                return;
            }
            getStatus().then(applyBranding);
        }
        tryInit();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[LatestMedia] apply-branding loaded (v3.0.2)');
})();
