/**
 * apply-branding.js — v3.0.1.0
 * Applies custom branding images (favicon, app icon, banner/logo) to the Jellyfin UI.
 * Lazy-loaded by latestmedia.js bootloader only when EnableCustomBranding is true.
 *
 * How it works:
 *  1. Replaces <link rel="icon"> / <link rel="apple-touch-icon"> with /Branding/favicon
 *  2. Replaces Jellyfin banner/logo images (<img> tags and CSS backgrounds) that match
 *     known Jellyfin logo selectors with /Branding/banner-light or banner-dark
 *  3. A MutationObserver re-applies on every SPA navigation (in case the page re-injects
 *     the default images when navigating to the login page or home).
 *
 * Performance: only runs when the feature is enabled. Uses a single, shared,
 * throttled MutationObserver instead of creating a new one.
 */
(function () {
    'use strict';

    var cfg = window.__latestMediaConfig || {};
    if (!cfg.EnableCustomBranding) return;

    var BASE = '/Branding/';
    var APPLIED = false;

    // ── Favicon / App Icon ───────────────────────────────────────────────────

    /**
     * Replaces favicon-related <link> tags in <head> with our custom favicon.
     * Also replaces apple-touch-icon.
     */
    function applyFavicon() {
        var faviconUrl = BASE + 'favicon?t=' + Math.floor(Date.now() / 60000); // 1-minute cache buster

        // Replace all existing icon links
        ['icon', 'shortcut icon', 'apple-touch-icon', 'apple-touch-icon-precomposed'].forEach(function (rel) {
            var existing = document.querySelector('link[rel="' + rel + '"]');
            if (existing) {
                existing.href = faviconUrl;
            } else {
                var link = document.createElement('link');
                link.rel = rel;
                link.href = faviconUrl;
                document.head.appendChild(link);
            }
        });
    }

    // ── Logo / Banner Images ─────────────────────────────────────────────────

    /**
     * Selectors for Jellyfin's default logo images that should be replaced.
     * Covers the login screen, the splash screen, and the sidebar header.
     */
    var LOGO_SELECTORS = [
        // Login/splash screen banner
        'img.imgLogoHeader',
        'img[src*="banner-light"]',
        'img[src*="banner-dark"]',
        // Server customization logo (Branding settings)
        '.loginDisclaimer img',
        '.readUserName img',
        // Home sidebar logo
        '.mainDrawer-scrollContainer img[src*="logo"]',
        // Jellyfin's own splash screen logo
        '.splashLogo',
        '.splash img',
        'img[alt*="logo" i]',
        // Generic banner-like images in header/splash
        'img[src*="/web/assets/img/banner"]'
    ];

    /**
     * Picks the right banner URL.
     * Uses banner-dark by default, banner-light as fallback (same as JE).
     */
    function getBannerUrl(existing) {
        // Check if we're in dark mode (body has .layout-* or data attr, or just use dark as default)
        var isDark = !document.body.classList.contains('layout-light');
        var suffix = isDark ? 'banner-dark' : 'banner-light';
        return BASE + suffix + '?t=' + Math.floor(Date.now() / 60000);
    }

    /**
     * Replaces all known Jellyfin logo image elements with our custom banner.
     */
    function applyBannerImages() {
        LOGO_SELECTORS.forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (img) {
                if (img.getAttribute('data-lm-branded')) return; // already replaced
                var url = getBannerUrl(img);
                img.src = url;
                img.removeAttribute('srcset');
                img.setAttribute('data-lm-branded', '1');
            });
        });
    }

    /**
     * Replaces the icon in the top-level <img> that shows the Jellyfin app icon
     * (used in the login page top icon).
     */
    var ICON_SELECTORS = [
        'img[src*="icon-transparent"]',
        '.appIconContainer img',
        'img.appIcon',
        '.loginLogo img'
    ];

    function applyIconImages() {
        var iconUrl = BASE + 'icon-transparent?t=' + Math.floor(Date.now() / 60000);
        ICON_SELECTORS.forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (img) {
                if (img.getAttribute('data-lm-icon-branded')) return;
                img.src = iconUrl;
                img.removeAttribute('srcset');
                img.setAttribute('data-lm-icon-branded', '1');
            });
        });
    }

    // ── Head Meta Tags ───────────────────────────────────────────────────────

    /**
     * Update og:image and apple-touch-startup-image meta tags.
     */
    function applyMetaTags() {
        var iconUrl = BASE + 'icon-transparent';
        var metas = [
            { property: 'og:image' },
            { name: 'apple-touch-startup-image' }
        ];
        metas.forEach(function (m) {
            var key = m.property ? 'property' : 'name';
            var val = m.property || m.name;
            var meta = document.querySelector('meta[' + key + '="' + val + '"]');
            if (meta) meta.setAttribute('content', iconUrl);
        });
    }

    // ── Check server availability, then apply ────────────────────────────────

    /**
     * Verify which branding images exist on the server before applying.
     * This avoids broken images if the user hasn't uploaded all types yet.
     */
    function checkAndApply() {
        // Check branding status (non-admin endpoint — just verify the images exist)
        // We use HEAD requests since the /Branding/* endpoints are anonymous
        var checks = {
            favicon: false,
            banner: false,
            icon: false
        };

        function doApply() {
            if (checks.favicon) applyFavicon();
            if (checks.banner) applyBannerImages();
            if (checks.icon) applyIconImages();
            applyMetaTags();
        }

        // Check favicon
        var faviconCheck = new XMLHttpRequest();
        faviconCheck.open('HEAD', BASE + 'favicon');
        faviconCheck.onload = function () {
            if (faviconCheck.status === 200) {
                checks.favicon = true;
            }
            doApply();
        };
        faviconCheck.onerror = doApply;
        faviconCheck.send();

        // Check banner-dark
        var bannerCheck = new XMLHttpRequest();
        bannerCheck.open('HEAD', BASE + 'banner-dark');
        bannerCheck.onload = function () {
            if (bannerCheck.status === 200) {
                checks.banner = true;
            }
            // Also try banner-light
            var bannerLightCheck = new XMLHttpRequest();
            bannerLightCheck.open('HEAD', BASE + 'banner-light');
            bannerLightCheck.onload = function () {
                if (bannerLightCheck.status === 200) checks.banner = true;
            };
            bannerLightCheck.send();
        };
        bannerCheck.onerror = function () {};
        bannerCheck.send();

        // Check icon
        var iconCheck = new XMLHttpRequest();
        iconCheck.open('HEAD', BASE + 'icon-transparent');
        iconCheck.onload = function () {
            if (iconCheck.status === 200) {
                checks.icon = true;
            }
        };
        iconCheck.onerror = function () {};
        iconCheck.send();
    }

    // ── Apply on SPA navigation via shared observer ──────────────────────────

    function applyAll() {
        // Re-apply (clearing data-lm-branded so we re-target any newly injected elements)
        document.querySelectorAll('[data-lm-branded]').forEach(function (el) {
            el.removeAttribute('data-lm-branded');
        });
        document.querySelectorAll('[data-lm-icon-branded]').forEach(function (el) {
            el.removeAttribute('data-lm-icon-branded');
        });
        checkAndApply();
    }

    // Register with shared observer for SPA navigation
    if (window.__latestMediaObserver) {
        window.__latestMediaObserver.register('apply-branding', function () {
            // Throttle: only run once per animation frame
            if (!applyAll._pending) {
                applyAll._pending = true;
                requestAnimationFrame(function () {
                    applyAll._pending = false;
                    checkAndApply();
                });
            }
        });
    }

    // Apply on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndApply);
    } else {
        checkAndApply();
    }

    console.log('[LatestMedia] apply-branding loaded');
})();
