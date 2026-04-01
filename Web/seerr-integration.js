/**
 * seerr-integration.js — v3.0.2.0
 * Full Jellyseerr/Overseerr frontend integration.
 * Lazy-loaded by latestmedia.js bootloader only when JellyseerrEnabled is true.
 *
 * FIXES in v3.0.2:
 *  - Search: Now hooks '#searchPage #searchTextInput' directly with an 'input' listener
 *    (matches JE's exact approach). No longer relies on URL hash pattern matching.
 *  - Search: Uses MutationObserver to detect when search input appears after SPA navigation.
 *  - Item Details: Now waits for '#similarCollapsible' in the active detail page and
 *    inserts sections using .after() on that element (matches JE item-details.js).
 *  - Item Details: Uses AbortController to cancel stale in-flight requests on navigation.
 *  - Watchlist: Uses Jellyfin's actual Favorites endpoint (not TMDB ID as itemId).
 *
 * Performance:
 *  - Guard clause: exits immediately if JellyseerrEnabled is false
 *  - All API calls go through /Seerr/* backend proxy (caching, no CORS, no API key exposure)
 *  - Search debounced 300ms against direct input events
 *  - Images lazy-loaded with IntersectionObserver
 *  - Reuses window.__latestMediaObserver — no new MutationObservers for page changes
 */
(function () {
    'use strict';

    var cfg = window.__latestMediaConfig || {};
    if (!cfg.JellyseerrEnabled) return;

    // ── Auth Headers ──────────────────────────────────────────────────────────

    function getAuthHeaders() {
        var S = window.__latestMediaState;
        if (!S || !S.tok) return {};
        var t = 'MediaBrowser Client="Jellyfin Web", Device="Plugin", DeviceId="' +
            (S.dev || 'LMPl1') + '", Version="1.0.0", Token="' + S.tok + '"';
        return { 'Authorization': t, 'X-Emby-Authorization': t };
    }

    // ── Client-side cache ─────────────────────────────────────────────────────

    var _cache = new Map();
    var CACHE_TTL = (cfg.JellyseerrResponseCacheTtlMinutes || 10) * 60 * 1000;

    function cacheGet(key) {
        var entry = _cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expires) { _cache.delete(key); return null; }
        return entry.data;
    }
    function cacheSet(key, data) {
        _cache.set(key, { data: data, expires: Date.now() + CACHE_TTL });
    }

    // ── API helpers ───────────────────────────────────────────────────────────

    function safeJson(r) {
        return r.text().then(function (text) {
            if (!text || !text.trim()) throw new Error('Empty response (HTTP ' + r.status + ')');
            return JSON.parse(text);
        });
    }

    function seerrGet(path) {
        var cached = cacheGet(path);
        if (cached) return Promise.resolve(cached);
        return fetch('/Seerr/' + path, { headers: getAuthHeaders() })
            .then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return safeJson(r);
            })
            .then(function (data) {
                cacheSet(path, data);
                return data;
            });
    }

    function seerrPost(path, body) {
        return fetch('/Seerr/' + path, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, getAuthHeaders()),
            body: JSON.stringify(body)
        }).then(function (r) {
            if (!r.ok) return r.text().then(function (t) { throw new Error(t || 'HTTP ' + r.status); });
            return safeJson(r);
        });
    }

    // ── Styles ────────────────────────────────────────────────────────────────

    (function injectStyles() {
        if (document.getElementById('lm-seerr-style')) return;
        var s = document.createElement('style');
        s.id = 'lm-seerr-style';
        s.textContent = [
            /* Search section — inserted as a verticalSection to match Jellyfin's layout */
            '.lm-jellyseerr-section { margin: 0 0 24px 0; }',
            '.lm-jellyseerr-section .lm-section-title { font-size:1.1em; font-weight:600; padding: 0 24px 12px; opacity:0.85; }',
            '.lm-jellyseerr-results { display:flex; flex-wrap:wrap; gap:12px; padding: 0 24px; }',
            /* Cards */
            '.lmSeerrCard { position:relative; width:130px; cursor:pointer; border-radius:8px; overflow:hidden; background:rgba(255,255,255,0.05); transition:transform .2s; flex-shrink:0; }',
            '.lmSeerrCard:hover { transform:scale(1.04); }',
            '.lmSeerrCard img { width:100%; aspect-ratio:2/3; object-fit:cover; display:block; background:#111; }',
            '.lmSeerrCard .lmSeerrInfo { padding:6px 8px; }',
            '.lmSeerrCard .lmSeerrTitle { font-size:0.78em; font-weight:500; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }',
            '.lmSeerrCard .lmSeerrReqBtn { display:block; width:100%; margin-top:5px; padding:4px 0; background:var(--lm-accent,#00b35a); color:#fff; border:none; border-radius:4px; font-size:0.72em; cursor:pointer; text-align:center; }',
            '.lmSeerrCard .lmSeerrReqBtn:disabled { opacity:0.5; cursor:default; }',
            '.lmSeerrBadge { position:absolute; top:4px; right:4px; padding:2px 6px; border-radius:4px; font-size:0.65em; font-weight:700; }',
            '.lmSeerrBadge.available { background:#00b35a; color:#fff; }',
            '.lmSeerrBadge.requested { background:#ff9800; color:#fff; }',
            '.lmSeerrBadge.pending { background:#2196f3; color:#fff; }',
            /* Detail page scroll sections */
            '.lm-seerr-detail-section { margin: 0; padding: 0 0 24px 0; }',
            '.lm-seerr-detail-section .lm-section-title { font-size:1.1em; font-weight:600; padding: 16px 24px 8px; opacity:0.85; }',
            '.lmSeerrScroll { display:flex; gap:12px; overflow-x:auto; padding: 0 24px 8px; scrollbar-width:thin; }',
            '.lmSeerrScroll::-webkit-scrollbar { height:4px; }',
            '.lmSeerrScroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:4px; }',
            /* Modal */
            '.lmSeerrModal { position:fixed; inset:0; z-index:99999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.7); }',
            '.lmSeerrModalBox { background:#1a1a1a; border-radius:12px; padding:24px; max-width:480px; width:90%; max-height:80vh; overflow-y:auto; box-shadow:0 8px 40px rgba(0,0,0,0.6); }',
            '.lmSeerrModalTitle { font-size:1.1em; font-weight:700; margin-bottom:16px; }',
            '.lmSeerrModalBtn { padding:8px 18px; border-radius:6px; border:none; cursor:pointer; font-size:0.9em; font-weight:600; margin:4px; }',
            '.lmSeerrModalBtn.primary { background:var(--lm-accent,#00b35a); color:#fff; }',
            '.lmSeerrModalBtn.primary4k { background:#ff9800; color:#fff; }',
            '.lmSeerrModalBtn.cancel { background:rgba(255,255,255,0.1); color:#fff; }',
            '.lmSeerrSeasonList { margin:12px 0; display:grid; grid-template-columns:1fr 1fr; gap:6px; }',
            '.lmSeerrSeasonItem label { display:flex; align-items:center; gap:8px; font-size:0.85em; cursor:pointer; }',
            '.lmSeerrModalActions { display:flex; flex-wrap:wrap; justify-content:flex-end; margin-top:16px; gap:6px; }',
        ].join('\n');
        document.head.appendChild(s);
    })();

    // ── Card Builder ──────────────────────────────────────────────────────────

    function buildSeerrCard(item) {
        var card = document.createElement('div');
        card.className = 'lmSeerrCard';

        var posterPath = item.posterPath
            ? 'https://image.tmdb.org/t/p/w200' + item.posterPath
            : '';

        var status = (item.mediaInfo && item.mediaInfo.status) ? item.mediaInfo.status : 0;
        var statusLabel = '';
        var statusClass = '';
        if (status === 5) { statusLabel = 'Available'; statusClass = 'available'; }
        else if (status === 3 || status === 4) { statusLabel = 'Processing'; statusClass = 'requested'; }
        else if (status === 2) { statusLabel = 'Requested'; statusClass = 'requested'; }
        else if (status === 1) { statusLabel = 'Pending'; statusClass = 'pending'; }

        var imgEl = document.createElement('img');
        imgEl.alt = item.title || item.name || '';
        imgEl.style.cssText = 'width:100%;aspect-ratio:2/3;object-fit:cover;display:block;background:#111;';

        if (posterPath) {
            var imgObs = new IntersectionObserver(function (entries, obs) {
                if (entries[0].isIntersecting) { imgEl.src = posterPath; obs.disconnect(); }
            }, { rootMargin: '200px' });
            imgObs.observe(imgEl);
        }
        card.appendChild(imgEl);

        if (statusLabel) {
            var badge = document.createElement('span');
            badge.className = 'lmSeerrBadge ' + statusClass;
            badge.textContent = statusLabel;
            card.appendChild(badge);
        }

        var info = document.createElement('div');
        info.className = 'lmSeerrInfo';

        var titleEl = document.createElement('div');
        titleEl.className = 'lmSeerrTitle';
        titleEl.textContent = item.title || item.name || 'Unknown';
        info.appendChild(titleEl);

        var reqBtn = document.createElement('button');
        reqBtn.className = 'lmSeerrReqBtn';
        if (status === 5) {
            reqBtn.textContent = 'Available';
            reqBtn.disabled = true;
        } else if (status === 2 || status === 3 || status === 4) {
            reqBtn.textContent = 'Requested';
            reqBtn.disabled = true;
        } else {
            reqBtn.textContent = 'Request';
            reqBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                showRequestModal(item);
            });
        }
        info.appendChild(reqBtn);
        card.appendChild(info);
        return card;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEARCH INTEGRATION
    // Mirrors JE jellyseerr.js: hooks '#searchPage #searchTextInput' with 'input'
    // listener, uses MutationObserver to detect the input appearing after navigation.
    // ═══════════════════════════════════════════════════════════════════════════

    var _searchDebounce = null;
    var _lastSearchQuery = '';
    var _searchObserver = null;

    function injectSeerrSearchResults(query) {
        if (!query) return;

        // Remove any existing section
        var old = document.getElementById('lm-seerr-search-section');
        if (old) old.remove();

        seerrGet('Search?query=' + encodeURIComponent(query))
            .then(function (data) {
                var results = (data && data.results) || [];
                if (results.length === 0) return;

                // Filter library items if configured
                if (cfg.JellyseerrExcludeLibraryItems) {
                    results = results.filter(function (item) {
                        return !(item.mediaInfo && item.mediaInfo.status === 5);
                    });
                }
                if (results.length === 0) return;

                var section = document.createElement('div');
                section.id = 'lm-seerr-search-section';
                section.className = 'lm-jellyseerr-section verticalSection';

                var h2 = document.createElement('h2');
                h2.className = 'lm-section-title sectionTitle';
                h2.textContent = 'Request via Jellyseerr';
                section.appendChild(h2);

                var grid = document.createElement('div');
                grid.className = 'lm-jellyseerr-results';
                results.slice(0, 16).forEach(function (item) {
                    grid.appendChild(buildSeerrCard(item));
                });
                section.appendChild(grid);

                // Insert at the TOP of the search page results (before Jellyfin's sections)
                // JE inserts at top; this makes our results visible without scrolling
                var searchPage = document.querySelector('#searchPage');
                var insertTarget = searchPage && searchPage.querySelector('.padded-top.padded-bottom-page, .searchResults');
                if (insertTarget) {
                    insertTarget.insertBefore(section, insertTarget.firstChild);
                } else if (searchPage) {
                    searchPage.appendChild(section);
                }
            })
            .catch(function (err) {
                console.debug('[LatestMedia] Seerr search failed:', err.message);
            });
    }

    function handleSearchInput(query) {
        clearTimeout(_searchDebounce);
        query = (query || '').trim();
        if (!query) {
            _lastSearchQuery = '';
            var old = document.getElementById('lm-seerr-search-section');
            if (old) old.remove();
            return;
        }
        if (query === _lastSearchQuery) return;
        _searchDebounce = setTimeout(function () {
            _lastSearchQuery = query;
            injectSeerrSearchResults(query);
        }, 300);
    }

    /**
     * Attaches an 'input' listener to #searchPage #searchTextInput.
     * Idempotent — marks input with data-lm-seerr-listener to prevent duplicate binding.
     */
    function tryAttachSearchListener() {
        var searchInput = document.querySelector('#searchPage #searchTextInput');
        if (!searchInput) return;

        if (!searchInput.dataset.lmSeerrListener) {
            searchInput.addEventListener('input', function () {
                handleSearchInput(searchInput.value);
            });
            searchInput.dataset.lmSeerrListener = 'true';
            console.debug('[LatestMedia] Seerr: search input listener attached');
        }

        // Fire immediately if there's already a query in the box
        if (searchInput.value && searchInput.value.trim()) {
            handleSearchInput(searchInput.value);
        }
    }

    /**
     * Sets up a MutationObserver to detect when the search page renders.
     * This is the core mechanism JE uses — not URL hash matching.
     */
    function initSearchObserver() {
        if (_searchObserver) return; // already watching

        _searchObserver = new MutationObserver(function () {
            tryAttachSearchListener();
        });
        _searchObserver.observe(document.body, { childList: true, subtree: true });

        // Check immediately (handles direct navigation to search page)
        tryAttachSearchListener();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ITEM DETAILS — Similar + Recommended
    // Mirrors JE item-details.js: waits for #similarCollapsible in the active
    // .libraryPage, then inserts sections after it.
    // ═══════════════════════════════════════════════════════════════════════════

    var _detailAbortController = null;
    var _processedItems = new Set();

    function getItemTmdbId(jellyfinId, signal) {
        var S = window.__latestMediaState;
        if (!S || !S.tok) return Promise.resolve(null);

        return fetch((S.url || '') + '/Items/' + jellyfinId + '?Fields=ProviderIds', {
            headers: getAuthHeaders(),
            signal: signal
        }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return safeJson(r);
        }).then(function (item) {
            var tmdbId = item.ProviderIds && (item.ProviderIds.Tmdb || item.ProviderIds.TheMovieDb);
            if (!tmdbId) return null;
            var type = item.Type === 'Movie' ? 'movie' : item.Type === 'Series' ? 'tv' : null;
            if (!type) return null;
            return { tmdbId: parseInt(tmdbId), type: type };
        });
    }

    /**
     * Waits for the detail page to render with #similarCollapsible present.
     * This is the anchor point JE uses for inserting Similar/Recommended sections.
     */
    function waitForDetailPageReady(signal) {
        return new Promise(function (resolve) {
            if (signal && signal.aborted) { resolve(null); return; }

            function checkPage() {
                var activePage = document.querySelector('.libraryPage:not(.hide)');
                if (!activePage) return null;
                var detailPageContent = activePage.querySelector('.detailPageContent');
                var moreLikeThisSection = detailPageContent && detailPageContent.querySelector('#similarCollapsible');
                if (detailPageContent && moreLikeThisSection) {
                    return { detailPageContent: detailPageContent, moreLikeThisSection: moreLikeThisSection };
                }
                return null;
            }

            var immediate = checkPage();
            if (immediate) { resolve(immediate); return; }

            var observer = null;
            var timeoutId = null;

            function cleanup() {
                if (observer) { observer.disconnect(); observer = null; }
                if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
            }

            if (signal) {
                signal.addEventListener('abort', function () { cleanup(); resolve(null); }, { once: true });
            }

            observer = new MutationObserver(function () {
                var result = checkPage();
                if (result) { cleanup(); resolve(result); }
            });
            observer.observe(document.body, { childList: true, subtree: true });

            // Timeout fallback (4 seconds)
            timeoutId = setTimeout(function () {
                cleanup();
                resolve(checkPage());
            }, 4000);
        });
    }

    function buildDetailScrollSection(title, items) {
        var sec = document.createElement('div');
        sec.className = 'lm-seerr-detail-section';
        sec.setAttribute('data-jellyseerr-section', 'true');

        var h2 = document.createElement('h2');
        h2.className = 'lm-section-title sectionTitle';
        h2.textContent = title;
        sec.appendChild(h2);

        var row = document.createElement('div');
        row.className = 'lmSeerrScroll';
        items.forEach(function (item) { row.appendChild(buildSeerrCard(item)); });
        sec.appendChild(row);
        return sec;
    }

    function renderSimilarAndRecommended(itemId) {
        if (_processedItems.has(itemId)) return;

        // Cancel any in-flight requests for previous item
        if (_detailAbortController) {
            _detailAbortController.abort();
        }
        _detailAbortController = new AbortController();
        var signal = _detailAbortController.signal;

        var showSimilar = cfg.JellyseerrShowSimilar !== false;
        var showRecommended = cfg.JellyseerrShowRecommended !== false;
        if (!showSimilar && !showRecommended) return;

        getItemTmdbId(itemId, signal)
            .then(function (tmdbInfo) {
                if (signal.aborted || !tmdbInfo) return Promise.reject(new DOMException('Aborted', 'AbortError'));

                var capType = tmdbInfo.type === 'movie' ? 'Movie' : 'Tv';
                var tmdbId = tmdbInfo.tmdbId;

                var promises = [
                    showSimilar
                        ? seerrGet(capType + '/' + tmdbId + '/Similar')
                        : Promise.resolve({ results: [] }),
                    showRecommended
                        ? seerrGet(capType + '/' + tmdbId + '/Recommendations')
                        : Promise.resolve({ results: [] }),
                    waitForDetailPageReady(signal)
                ];

                return Promise.all(promises).then(function (results) {
                    if (signal.aborted) return;

                    var similarData = results[0];
                    var recommendedData = results[1];
                    var pageReady = results[2];

                    if (!pageReady) {
                        console.debug('[LatestMedia] Seerr: detail page not ready for insertion');
                        return;
                    }

                    var detailPageContent = pageReady.detailPageContent;
                    var moreLikeThisSection = pageReady.moreLikeThisSection;

                    // Remove any existing Jellyseerr sections to avoid duplicates
                    detailPageContent.querySelectorAll('[data-jellyseerr-section]').forEach(function (el) {
                        el.remove();
                    });

                    var similarResults = (similarData && similarData.results) || [];
                    var recommendedResults = (recommendedData && recommendedData.results) || [];

                    // Apply exclude filter
                    if (cfg.JellyseerrExcludeLibraryItems) {
                        similarResults = similarResults.filter(function (i) {
                            return !(i.mediaInfo && i.mediaInfo.jellyfinMediaId);
                        });
                        recommendedResults = recommendedResults.filter(function (i) {
                            return !(i.mediaInfo && i.mediaInfo.jellyfinMediaId);
                        });
                    }

                    // Insert Recommended first (appears directly below More Like This)
                    if (recommendedResults.length > 0) {
                        var recSec = buildDetailScrollSection('Recommended', recommendedResults.slice(0, 20));
                        recSec.id = 'lm-seerr-recommended';
                        moreLikeThisSection.after(recSec);
                    }

                    // Insert Similar after Recommended (or after moreLikeThis)
                    if (similarResults.length > 0) {
                        var simSec = buildDetailScrollSection('More Like This (Seerr)', similarResults.slice(0, 20));
                        simSec.id = 'lm-seerr-similar';
                        var anchor = detailPageContent.querySelector('[data-jellyseerr-section]') || moreLikeThisSection;
                        anchor.after(simSec);
                    }

                    _processedItems.add(itemId);
                    console.debug('[LatestMedia] Seerr: Similar/Recommended sections injected for', itemId);
                });
            })
            .catch(function (err) {
                if (err && err.name === 'AbortError') return; // navigation changed
                console.debug('[LatestMedia] Seerr detail error:', err.message || err);
            });
    }

    function handleItemDetailsPage() {
        var hash = window.location.hash || '';
        if (!hash.includes('/details?id=')) return;

        var itemId;
        try {
            itemId = new URLSearchParams(hash.split('?')[1]).get('id');
        } catch (e) { return; }

        if (!itemId) return;

        // Use rAF to ensure Jellyfin has started rendering the page
        requestAnimationFrame(function () {
            renderSimilarAndRecommended(itemId);
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REQUEST MODAL
    // ═══════════════════════════════════════════════════════════════════════════

    function showRequestModal(item) {
        var existing = document.getElementById('lm-seerr-modal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = 'lm-seerr-modal';
        modal.className = 'lmSeerrModal';

        var isMovie = item.mediaType === 'movie' || !item.numberOfSeasons;
        if (isMovie) {
            renderMovieModal(modal, item);
        } else {
            renderTvModal(modal, item);
        }

        modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.remove();
        });
        document.body.appendChild(modal);
    }

    function renderMovieModal(modal, item) {
        var title = item.title || item.name || 'Unknown';
        var box = document.createElement('div');
        box.className = 'lmSeerrModalBox';
        box.innerHTML = '<div class="lmSeerrModalTitle">Request: ' + escHtml(title) + '</div>' +
            '<div style="font-size:0.85em;opacity:0.7;margin-bottom:12px;">' +
            (item.releaseDate ? item.releaseDate.substring(0, 4) : '') + ' · Movie</div>';

        var actions = document.createElement('div');
        actions.className = 'lmSeerrModalActions';

        var cancelBtn = makeMBtn('Cancel', 'cancel');
        cancelBtn.addEventListener('click', function () { modal.remove(); });

        var reqBtn = makeMBtn('Request', 'primary');
        reqBtn.addEventListener('click', function () {
            submitRequest(modal, reqBtn, { mediaType: 'movie', mediaId: item.id, is4k: false });
        });
        actions.appendChild(cancelBtn);
        actions.appendChild(reqBtn);

        if (cfg.JellyseerrEnable4KRequests) {
            var req4kBtn = makeMBtn('Request 4K', 'primary4k');
            req4kBtn.addEventListener('click', function () {
                submitRequest(modal, req4kBtn, { mediaType: 'movie', mediaId: item.id, is4k: true });
            });
            actions.appendChild(req4kBtn);
        }

        box.appendChild(actions);
        modal.appendChild(box);
    }

    function renderTvModal(modal, item) {
        var title = item.title || item.name || 'Unknown';
        var box = document.createElement('div');
        box.className = 'lmSeerrModalBox';
        box.innerHTML = '<div class="lmSeerrModalTitle">Request: ' + escHtml(title) + '</div>' +
            '<div style="font-size:0.85em;opacity:0.7;margin-bottom:12px;">' +
            (item.firstAirDate ? item.firstAirDate.substring(0, 4) : '') + ' · TV Series</div>' +
            '<div style="font-size:0.9em;margin-bottom:8px;font-weight:600;">Select Seasons:</div>';

        var seasonContainer = document.createElement('div');
        seasonContainer.className = 'lmSeerrSeasonList';

        var numSeasons = item.numberOfSeasons || 1;
        var checkboxes = [];
        for (var i = 1; i <= numSeasons; i++) {
            (function (sn) {
                var label = document.createElement('label');
                label.className = 'lmSeerrSeasonItem';
                var cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.value = sn;
                cb.checked = true;
                checkboxes.push(cb);
                label.appendChild(cb);
                label.appendChild(document.createTextNode(' Season ' + sn));
                seasonContainer.appendChild(label);
            })(i);
        }
        box.appendChild(seasonContainer);

        var actions = document.createElement('div');
        actions.className = 'lmSeerrModalActions';

        var cancelBtn = makeMBtn('Cancel', 'cancel');
        cancelBtn.addEventListener('click', function () { modal.remove(); });

        var reqBtn = makeMBtn('Request', 'primary');
        reqBtn.addEventListener('click', function () {
            var seasons = checkboxes.filter(function (c) { return c.checked; })
                .map(function (c) { return parseInt(c.value); });
            if (seasons.length === 0) { alert('Select at least one season.'); return; }
            submitRequest(modal, reqBtn, { mediaType: 'tv', mediaId: item.id, is4k: false, seasons: seasons });
        });
        actions.appendChild(cancelBtn);
        actions.appendChild(reqBtn);

        if (cfg.JellyseerrEnable4KTvRequests) {
            var req4kBtn = makeMBtn('Request 4K', 'primary4k');
            req4kBtn.addEventListener('click', function () {
                var seasons = checkboxes.filter(function (c) { return c.checked; })
                    .map(function (c) { return parseInt(c.value); });
                if (seasons.length === 0) { alert('Select at least one season.'); return; }
                submitRequest(modal, req4kBtn, { mediaType: 'tv', mediaId: item.id, is4k: true, seasons: seasons });
            });
            actions.appendChild(req4kBtn);
        }

        box.appendChild(actions);
        modal.appendChild(box);
    }

    function submitRequest(modal, btn, payload) {
        btn.disabled = true;
        btn.textContent = 'Requesting...';

        seerrPost('Request', payload)
            .then(function () {
                btn.textContent = 'Requested!';
                btn.style.background = '#00b35a';

                // Auto-add to Jellyfin watchlist via Favorites endpoint
                if (cfg.AddRequestedMediaToWatchlist) {
                    addToWatchlist(payload);
                }

                setTimeout(function () { modal.remove(); }, 1500);
            })
            .catch(function (err) {
                btn.disabled = false;
                btn.textContent = btn.className.includes('4k') ? 'Request 4K' : 'Request';
                alert('Request failed: ' + (err.message || 'Unknown error'));
            });
    }

    function makeMBtn(text, cls) {
        var btn = document.createElement('button');
        btn.className = 'lmSeerrModalBtn ' + cls;
        btn.textContent = text;
        return btn;
    }

    // ── Watchlist ─────────────────────────────────────────────────────────────

    function addToWatchlist(payload) {
        // payload.mediaId is the Seerr TMDB ID, not the Jellyfin ID.
        // We can't add by TMDB ID directly. Instead, search Jellyfin for the item.
        var S = window.__latestMediaState;
        if (!S || !S.tok || !S.uid) return;

        // Search Jellyfin Items by TMDB provider ID
        var typeParam = payload.mediaType === 'movie' ? 'Movie' : 'Series';
        fetch((S.url || '') + '/Items?IncludeItemTypes=' + typeParam +
            '&SearchTerm=&AnyProviderIdEquals=tmdb.' + payload.mediaId +
            '&Recursive=true&Fields=Id', {
            headers: getAuthHeaders()
        }).then(function (r) {
            return r.ok ? safeJson(r) : null;
        }).then(function (data) {
            var items = data && data.Items;
            if (!items || items.length === 0) return;
            var jellyfinId = items[0].Id;
            return fetch((S.url || '') + '/Users/' + S.uid + '/FavoriteItems/' + jellyfinId, {
                method: 'POST',
                headers: getAuthHeaders()
            });
        }).catch(function () {});
    }

    // ── Utility ───────────────────────────────────────────────────────────────

    function escHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVIGATION & INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════

    // Reset state on navigation so new page gets fresh injection
    function onNavigate() {
        _lastSearchQuery = '';
        _processedItems.clear();
        // tryAttachSearchListener is called by the MutationObserver automatically
        setTimeout(handleItemDetailsPage, 300); // wait for Jellyfin to render
    }

    // Listen for SPA navigation (hashchange is Jellyfin's primary navigation mechanism)
    window.addEventListener('hashchange', onNavigate);

    // Also listen for Jellyfin's viewshow event
    document.addEventListener('viewshow', function () {
        setTimeout(handleItemDetailsPage, 200);
    });

    // Initialize search observer (persistent, watches for search input across navigations)
    if (cfg.JellyseerrShowSearchResults !== false) {
        initSearchObserver();
    }

    // Check detail page immediately (handles direct navigation)
    if (cfg.JellyseerrShowSimilar !== false || cfg.JellyseerrShowRecommended !== false) {
        handleItemDetailsPage();
    }

    console.log('[LatestMedia] seerr-integration loaded (v3.0.2)');
})();
