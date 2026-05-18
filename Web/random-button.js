/**
 * random-button.js — v3.0.1.0
 * Injects a "Random" button (casino icon) into the Jellyfin header.
 * Lazy-loaded by latestmedia.js bootloader only when RandomButtonEnabled is true.
 *
 * Performance: reuses the shared __latestMediaObserver instead of creating a new MutationObserver.
 * API call fires only on user click — zero background polling.
 *
 * ANIMATION FIX (v3.0.1): Matches JE plugin exactly —
 *   The CSS "@keyframes dice" shakes/rotates the casino icon on hover (CSS-only, no JS).
 *   On click: shows hourglass_empty as loading state with class "loading" on button
 *   (JE's CSS rule: button#randomItemButton:not(.loading):hover .material-icons { animation: dice 1.5s; })
 */
(function () {
    'use strict';

    const cfg = window.__latestMediaConfig || {};
    if (!cfg.RandomButtonEnabled) return;

    const BTN_ID = 'lm-btn-random';
    const STYLE_ID = 'lm-random-style';

    // Inject CSS matching JE's dice animation exactly
    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = [
            '@keyframes lm-dice {',
            '  0%, 100% { transform: rotate(0deg) scale(1); }',
            '  10%, 30%, 50% { transform: rotate(-10deg) scale(1.1); }',
            '  20%, 40% { transform: rotate(10deg) scale(1.1); }',
            '  60% { transform: rotate(360deg) scale(1); }',
            '}',
            /* Hover animation only when NOT in loading state (mirrors JE rule) */
            '#' + BTN_ID + ':not(.loading):hover .material-icons {',
            '  animation: lm-dice 1.5s;',
            '}',
            '#' + BTN_ID + ' { position: relative; }',
            '#' + BTN_ID + '.loading { opacity: 0.8; }'
        ].join('\n');
        document.head.appendChild(s);
    }

    function getApiState() {
        return window.__latestMediaState || null;
    }

    function lmApi(ep) {
        const S = getApiState();
        if (!S) return Promise.reject(new Error('API state not ready'));
        const base = S.url || location.origin;
        const t = 'MediaBrowser Client="Jellyfin Web", Device="Plugin", DeviceId="' + (S.dev || 'LMPl1') +
            '", Version="1.0.0", Token="' + S.tok + '"';
        return fetch(base + '/' + ep, { headers: { 'Authorization': t, 'X-Emby-Authorization': t } })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.text().then(function (t) { return t ? JSON.parse(t) : {}; });
            });
    }

    function addRandomButton() {
        if (document.getElementById(BTN_ID)) return;
        const hr = document.querySelector('.headerRight, .headerButtons');
        if (!hr) return;

        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.setAttribute('is', 'paper-icon-button-light');
        btn.className = 'paper-icon-button-light headerButton headerButtonRight';
        btn.title = 'Play something random';
        btn.setAttribute('aria-label', 'Random');
        // Use material-icons class so CSS animation selector works
        btn.innerHTML = '<span class="material-icons" style="font-size:20px;vertical-align:middle;">casino</span>';

        btn.addEventListener('click', function () {
            if (btn.disabled) return;

            // Show loading state (JE: adds 'loading' class, changes icon to hourglass)
            btn.disabled = true;
            btn.classList.add('loading');
            btn.innerHTML = '<span class="material-icons" style="font-size:20px;vertical-align:middle;">hourglass_empty</span>';

            const S = getApiState();
            if (!S || !S.uid) {
                resetBtn();
                return;
            }

            const types = [];
            if (cfg.RandomIncludeMovies !== false) types.push('Movie');
            if (cfg.RandomIncludeShows !== false) types.push('Series');
            if (types.length === 0) types.push('Movie', 'Series');

            let params = 'SortBy=Random&SortOrder=Ascending&Limit=100&Recursive=true' +
                '&IncludeItemTypes=' + types.join(',') +
                '&Fields=UserData';
            if (cfg.RandomUnwatchedOnly) params += '&IsPlayed=false';

            lmApi('Users/' + S.uid + '/Items?' + params)
                .then(function (data) {
                    let items = (data && data.Items) || [];

                    // Client-side unwatched filter for Series (Jellyfin's IsPlayed=false works differently for Series)
                    if (cfg.RandomUnwatchedOnly) {
                        items = items.filter(function (item) {
                            if (item.Type === 'Movie') return !item.UserData || !item.UserData.Played;
                            if (item.Type === 'Series') return item.UserData && item.UserData.UnplayedItemCount > 0;
                            return true;
                        });
                    }

                    if (items.length === 0) {
                        alert('No items found for random selection.');
                        return;
                    }
                    const item = items[Math.floor(Math.random() * items.length)];
                    window.location.hash = '#!/details?id=' + item.Id + '&serverId=' + (item.ServerId || '');
                })
                .catch(function (err) {
                    console.warn('[LatestMedia] Random button error:', err);
                })
                .finally(function () {
                    setTimeout(resetBtn, 500);
                });
        });

        function resetBtn() {
            btn.disabled = false;
            btn.classList.remove('loading');
            btn.innerHTML = '<span class="material-icons" style="font-size:20px;vertical-align:middle;">casino</span>';
        }

        hr.insertBefore(btn, hr.firstChild);
    }

    injectStyle();

    // Register with shared observer so button re-injects on SPA navigation
    if (window.__latestMediaObserver) {
        window.__latestMediaObserver.register('random-button', addRandomButton);
    }

    // Try immediately in case header is already rendered
    addRandomButton();

    console.log('[LatestMedia] random-button loaded');
})();
