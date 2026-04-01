/**
 * random-button.js — v3.0.0.0
 * Injects a "Random" button (casino icon) into the Jellyfin header.
 * Lazy-loaded by latestmedia.js bootloader only when RandomButtonEnabled is true.
 *
 * Performance: reuses the shared __latestMediaObserver instead of creating a new MutationObserver.
 * API call fires only on user click — zero background polling.
 */
(function () {
    'use strict';

    const cfg = window.__latestMediaConfig || {};
    if (!cfg.RandomButtonEnabled) return;

    const BTN_ID = 'lm-btn-random';

    function getApiState() {
        return window.__latestMediaState || null;
    }

    function lmApi(ep, opts) {
        const S = getApiState();
        if (!S) return Promise.reject(new Error('API state not ready'));
        const base = S.url || location.origin;
        const t = 'MediaBrowser Client="Jellyfin Web", Device="Plugin", DeviceId="' + (S.dev || 'LMPl1') +
            '", Version="1.0.0", Token="' + S.tok + '"';
        const headers = { 'Authorization': t, 'X-Emby-Authorization': t };
        if (opts && opts.body) headers['Content-Type'] = 'application/json';
        return fetch(base + '/' + ep, Object.assign({}, opts, { headers: headers }))
            .then(function (r) {
                if (!r.ok) throw new Error(r.status);
                return r.text().then(function (t) { return t ? JSON.parse(t) : {}; });
            });
    }

    function addRandomButton() {
        if (document.getElementById(BTN_ID)) return;
        const hr = document.querySelector('.headerRight,.headerButtons,[class*="headerRight"]');
        if (!hr) return;

        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.is = 'paper-icon-button-light';
        btn.className = 'paper-icon-button-light headerButton headerButtonRight';
        btn.title = 'Play something random';
        btn.setAttribute('aria-label', 'Random');
        btn.innerHTML = '<span class="material-icons" style="font-size:20px;vertical-align:middle;">casino</span>';

        btn.addEventListener('click', function () {
            // Show loading state
            btn.innerHTML = '<span class="material-icons" style="font-size:20px;vertical-align:middle;animation:lmSpin 1s linear infinite;">hourglass_empty</span>';
            btn.disabled = true;

            const S = getApiState();
            if (!S || !S.uid) {
                btn.innerHTML = '<span class="material-icons" style="font-size:20px;vertical-align:middle;">casino</span>';
                btn.disabled = false;
                return;
            }

            // Build type filter
            var types = [];
            if (cfg.RandomIncludeMovies !== false) types.push('Movie');
            if (cfg.RandomIncludeShows !== false) types.push('Series');
            if (types.length === 0) types = ['Movie', 'Series'];

            var params = 'SortBy=Random&SortOrder=Ascending&Limit=50&Recursive=true' +
                '&IncludeItemTypes=' + types.join(',');
            if (cfg.RandomUnwatchedOnly) params += '&IsPlayed=false';

            lmApi('Users/' + S.uid + '/Items?' + params)
                .then(function (data) {
                    var items = (data && data.Items) || [];
                    if (items.length === 0) {
                        alert('No items found for random selection.');
                        return;
                    }
                    var item = items[Math.floor(Math.random() * items.length)];
                    // Navigate to item detail page
                    var url = '#!/details?id=' + item.Id + '&serverId=' + (item.ServerId || '');
                    window.location.hash = url.replace(/^#!/, '#!');
                })
                .catch(function (err) {
                    console.warn('[LatestMedia] Random button error:', err);
                })
                .finally(function () {
                    setTimeout(function () {
                        btn.innerHTML = '<span class="material-icons" style="font-size:20px;vertical-align:middle;">casino</span>';
                        btn.disabled = false;
                    }, 500);
                });
        });

        // Prepend so it appears as the leftmost item in headerRight (before our other buttons)
        hr.insertBefore(btn, hr.firstChild);
    }

    // Inject spin animation style once
    (function injectStyle() {
        if (document.getElementById('lm-random-style')) return;
        var s = document.createElement('style');
        s.id = 'lm-random-style';
        s.textContent = '@keyframes lmSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
        document.head.appendChild(s);
    })();

    // Register with the shared observer so we re-inject on SPA navigation
    if (window.__latestMediaObserver) {
        window.__latestMediaObserver.register('random-button', addRandomButton);
    }

    // Also try immediately in case the header is already rendered
    addRandomButton();

    console.log('[LatestMedia] random-button loaded');
})();
