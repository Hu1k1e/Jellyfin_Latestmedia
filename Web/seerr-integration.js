/**
 * seerr-integration.js — v3.0.0.0
 * Full Jellyseerr/Overseerr frontend integration.
 * Lazy-loaded by latestmedia.js bootloader only when JellyseerrEnabled is true.
 *
 * Features:
 *  - Search Integration: Seerr results alongside Jellyfin results with Request buttons
 *  - Item Details: Similar + Recommended carousels on detail pages
 *  - Request Modal: Movie (std + 4K) & TV (season picker, std + 4K)
 *  - Discovery: Browse by genre, network, person, tag, collection
 *  - Watchlist: Auto-add requested media to Jellyfin watchlist
 *
 * Performance:
 *  - Guard clause: exits immediately if JellyseerrEnabled is false
 *  - All API calls go through /Seerr/* backend proxy (caching, no CORS, no API key exposure)
 *  - Client-side Map() cache for search and detail responses
 *  - Search debounced 300ms
 *  - Images lazy-loaded with IntersectionObserver
 *  - Discovery uses IntersectionObserver for infinite scroll (not scroll events)
 *  - Reuses window.__latestMediaObserver — no new MutationObservers
 */
(function () {
    'use strict';

    var cfg = window.__latestMediaConfig || {};
    if (!cfg.JellyseerrEnabled) return;

    // ── Client-side cache ────────────────────────────────────────────────────
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

    // ── API helper (calls our /Seerr/* proxy) ─────────────────────────────
    function seerrGet(path) {
        var cached = cacheGet(path);
        if (cached) return Promise.resolve(cached);
        return fetch('/Seerr/' + path, {
            headers: getAuthHeaders()
        }).then(function (r) {
            if (!r.ok) throw new Error(r.status);
            return r.json();
        }).then(function (data) {
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
            if (!r.ok) return r.text().then(function (t) { throw new Error(t || r.status); });
            return r.json();
        });
    }

    function seerrDelete(path) {
        return fetch('/Seerr/' + path, {
            method: 'DELETE',
            headers: getAuthHeaders()
        }).then(function (r) {
            if (!r.ok) throw new Error(r.status);
            return r.json();
        });
    }

    function getAuthHeaders() {
        var S = window.__latestMediaState;
        if (!S) return {};
        var t = 'MediaBrowser Client="Jellyfin Web", Device="Plugin", DeviceId="' +
            (S.dev || 'LMPl1') + '", Version="1.0.0", Token="' + S.tok + '"';
        return { 'Authorization': t, 'X-Emby-Authorization': t };
    }

    // Fetch Seerr config once
    var _seerrCfg = null;
    function getSeerrCfg() {
        if (_seerrCfg) return Promise.resolve(_seerrCfg);
        return fetch('/Seerr/Config', { headers: getAuthHeaders() })
            .then(function (r) { return r.json(); })
            .then(function (c) { _seerrCfg = c; return c; });
    }

    // ── Styles ───────────────────────────────────────────────────────────────
    (function injectStyles() {
        if (document.getElementById('lm-seerr-style')) return;
        var s = document.createElement('style');
        s.id = 'lm-seerr-style';
        s.textContent = [
            '.lmSeerrSection { margin: 24px 0; }',
            '.lmSeerrSection h2 { font-size: 1.15em; font-weight: 600; margin-bottom: 12px; opacity: 0.9; }',
            '.lmSeerrResults { display: flex; flex-wrap: wrap; gap: 12px; }',
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
            '.lmSeerrScroll { display:flex; gap:12px; overflow-x:auto; padding-bottom:8px; scrollbar-width:thin; }',
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

    // ── 3a. Search Integration ───────────────────────────────────────────────

    var _searchDebounce = null;
    var _lastSearchQuery = '';

    function onPageChange() {
        // Search page hook
        if (cfg.JellyseerrShowSearchResults !== false) {
            tryHookSearch();
        }
        // Item details hook
        if (cfg.JellyseerrShowSimilar !== false || cfg.JellyseerrShowRecommended !== false) {
            tryHookItemDetails();
        }
    }

    function tryHookSearch() {
        // Detect Jellyfin search results container
        var searchContainer = document.querySelector('.searchResults, [class*="searchResults"], .itemsContainer.vertical-wrap');
        if (!searchContainer) return;

        // Check if we're on a search page
        var hash = window.location.hash || '';
        if (!hash.includes('#!/search') && !hash.includes('#!/universalsearch')) return;

        // Debounce: get the search query from the URL or input
        clearTimeout(_searchDebounce);
        _searchDebounce = setTimeout(function () {
            var query = getSearchQuery();
            if (!query || query === _lastSearchQuery) return;
            _lastSearchQuery = query;
            injectSeerrSearchResults(query);
        }, 300);
    }

    function getSearchQuery() {
        // Try URL hash parameter first
        var hash = window.location.hash;
        var m = hash.match(/[?&]query=([^&]*)/);
        if (m) return decodeURIComponent(m[1]);
        // Try the search input
        var inp = document.querySelector('input[type="search"], .searchfield-input, #searchInput, input[placeholder*="earch"]');
        return inp ? inp.value.trim() : '';
    }

    function injectSeerrSearchResults(query) {
        if (!query) return;

        // Remove old Seerr section if any
        var old = document.getElementById('lm-seerr-search-section');
        if (old) old.remove();

        seerrGet('Search?query=' + encodeURIComponent(query)).then(function (data) {
            var results = (data && data.results) || [];
            if (results.length === 0) return;

            var section = document.createElement('div');
            section.id = 'lm-seerr-search-section';
            section.className = 'lmSeerrSection';
            section.innerHTML = '<h2>Request via Jellyseerr</h2>';

            var grid = document.createElement('div');
            grid.className = 'lmSeerrResults';

            results.slice(0, 12).forEach(function (item) {
                if (cfg.JellyseerrExcludeLibraryItems && item.mediaInfo && item.mediaInfo.status === 5) return;
                grid.appendChild(buildSeerrCard(item));
            });

            section.appendChild(grid);

            // Insert after Jellyfin search results
            var target = document.querySelector('.searchResults, .itemsContainer');
            if (target && target.parentNode) {
                target.parentNode.insertBefore(section, target.nextSibling);
            } else {
                document.querySelector('.content-primary, main')?.appendChild(section);
            }
        }).catch(function () {});
    }

    function buildSeerrCard(item) {
        var card = document.createElement('div');
        card.className = 'lmSeerrCard';
        card.title = item.title || item.name || '';

        var posterPath = item.posterPath
            ? 'https://image.tmdb.org/t/p/w200' + item.posterPath
            : '';

        var status = item.mediaInfo ? item.mediaInfo.status : 0;
        var statusLabel = '';
        var statusClass = '';
        if (status === 5) { statusLabel = 'Available'; statusClass = 'available'; }
        else if (status === 3 || status === 4) { statusLabel = 'Processing'; statusClass = 'requested'; }
        else if (status === 2) { statusLabel = 'Requested'; statusClass = 'requested'; }
        else if (status === 1) { statusLabel = 'Pending'; statusClass = 'pending'; }

        var imgEl = document.createElement('img');
        imgEl.alt = card.title;
        imgEl.style.cssText = 'width:100%;aspect-ratio:2/3;object-fit:cover;display:block;background:#111;';

        // Lazy-load poster with IntersectionObserver
        if (posterPath) {
            var imgObs = new IntersectionObserver(function (entries, obs) {
                if (entries[0].isIntersecting) {
                    imgEl.src = posterPath;
                    obs.disconnect();
                }
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
        } else if (status === 2 || status === 3) {
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

    // ── 3b. Item Details (Similar + Recommended) ─────────────────────────────

    var _lastDetailId = '';

    function tryHookItemDetails() {
        var hash = window.location.hash || '';
        var m = hash.match(/[?&]id=([^&]+)/);
        if (!m) return;
        var jellyfinId = m[1];
        if (jellyfinId === _lastDetailId) return;
        _lastDetailId = jellyfinId;

        // Find the item details page container
        var detailsPage = document.querySelector('.detailPagePrimaryContainer, .itemDetailPage, [class*="detail"]');
        if (!detailsPage) return;

        // Get TMDB ID from item's provider IDs
        getItemTmdbId(jellyfinId).then(function (tmdbInfo) {
            if (!tmdbInfo) return;
            injectSimilarAndRecommended(detailsPage, tmdbInfo.tmdbId, tmdbInfo.type);
        }).catch(function () {});
    }

    function getItemTmdbId(jellyfinId) {
        var S = window.__latestMediaState;
        if (!S || !S.tok) return Promise.resolve(null);

        return fetch((S.url || '') + '/Items/' + jellyfinId + '?Fields=ProviderIds', {
            headers: getAuthHeaders()
        }).then(function (r) { return r.json(); }).then(function (item) {
            var tmdbId = item.ProviderIds && (item.ProviderIds.Tmdb || item.ProviderIds.TheMovieDb);
            if (!tmdbId) return null;
            var type = item.Type === 'Movie' ? 'movie' : item.Type === 'Series' ? 'tv' : null;
            if (!type) return null;
            return { tmdbId: parseInt(tmdbId), type: type };
        });
    }

    function injectSimilarAndRecommended(container, tmdbId, type) {
        // Remove existing
        ['lm-seerr-similar', 'lm-seerr-recommended'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.remove();
        });

        var capType = type === 'movie' ? 'Movie' : 'Tv';

        if (cfg.JellyseerrShowSimilar !== false) {
            seerrGet(capType + '/' + tmdbId + '/Similar').then(function (data) {
                var results = (data && data.results) || [];
                if (results.length === 0) return;
                var sec = buildScrollSection('More Like This', results.slice(0, 20));
                sec.id = 'lm-seerr-similar';
                appendToDetailPage(container, sec);
            }).catch(function () {});
        }

        if (cfg.JellyseerrShowRecommended !== false) {
            seerrGet(capType + '/' + tmdbId + '/Recommendations').then(function (data) {
                var results = (data && data.results) || [];
                if (results.length === 0) return;
                var sec = buildScrollSection('Recommended', results.slice(0, 20));
                sec.id = 'lm-seerr-recommended';
                appendToDetailPage(container, sec);
            }).catch(function () {});
        }
    }

    function buildScrollSection(title, items) {
        var sec = document.createElement('div');
        sec.className = 'lmSeerrSection';
        sec.innerHTML = '<h2>' + title + '</h2>';
        var row = document.createElement('div');
        row.className = 'lmSeerrScroll';
        items.forEach(function (item) {
            row.appendChild(buildSeerrCard(item));
        });
        sec.appendChild(row);
        return sec;
    }

    function appendToDetailPage(container, el) {
        var anchor = container.closest('.itemDetailPage, .detailPage') ||
            document.querySelector('.itemDetailPage, .detailPage, .padded-left');
        if (anchor) {
            anchor.appendChild(el);
        } else {
            container.appendChild(el);
        }
    }

    // ── 3c. Request Modal ─────────────────────────────────────────────────────

    function showRequestModal(item) {
        // Remove existing modal
        var existing = document.getElementById('lm-seerr-modal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.id = 'lm-seerr-modal';
        modal.className = 'lmSeerrModal';

        var isMovie = item.mediaType === 'movie' || !item.numberOfSeasons;
        var title = item.title || item.name || 'Unknown';

        if (isMovie) {
            renderMovieModal(modal, item, title);
        } else {
            renderTvModal(modal, item, title);
        }

        // Close on backdrop click
        modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    }

    function renderMovieModal(modal, item, title) {
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

    function renderTvModal(modal, item, title) {
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
                cb.checked = true; // pre-check all seasons
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
            var selectedSeasons = checkboxes.filter(function (c) { return c.checked; })
                .map(function (c) { return parseInt(c.value); });
            if (selectedSeasons.length === 0) { alert('Select at least one season.'); return; }
            submitRequest(modal, reqBtn, {
                mediaType: 'tv', mediaId: item.id, is4k: false,
                seasons: selectedSeasons
            });
        });
        actions.appendChild(cancelBtn);
        actions.appendChild(reqBtn);

        if (cfg.JellyseerrEnable4KTvRequests) {
            var req4kBtn = makeMBtn('Request 4K', 'primary4k');
            req4kBtn.addEventListener('click', function () {
                var selectedSeasons = checkboxes.filter(function (c) { return c.checked; })
                    .map(function (c) { return parseInt(c.value); });
                if (selectedSeasons.length === 0) { alert('Select at least one season.'); return; }
                submitRequest(modal, req4kBtn, {
                    mediaType: 'tv', mediaId: item.id, is4k: true,
                    seasons: selectedSeasons
                });
            });
            actions.appendChild(req4kBtn);
        }

        box.appendChild(actions);
        modal.appendChild(box);
    }

    function submitRequest(modal, btn, payload) {
        btn.disabled = true;
        btn.textContent = 'Requesting...';

        seerrPost('Request', payload).then(function () {
            btn.textContent = 'Requested!';
            btn.style.background = '#00b35a';

            // Auto-add to Jellyfin watchlist if configured
            if (cfg.AddRequestedMediaToWatchlist) {
                addToWatchlist(payload);
            }

            setTimeout(function () { modal.remove(); }, 1500);
        }).catch(function (err) {
            btn.disabled = false;
            btn.textContent = btn.className.includes('4k') ? 'Request 4K' : 'Request';
            alert('Request failed: ' + err.message);
        });
    }

    function makeMBtn(text, className) {
        var btn = document.createElement('button');
        btn.className = 'lmSeerrModalBtn ' + className;
        btn.textContent = text;
        return btn;
    }

    // ── 3d. Discovery ─────────────────────────────────────────────────────────
    // Discovery sections can be triggered by the observer on discovery pages.
    // For now the observer-based hook calls onPageChange which handles search/details.
    // Future: add dedicated discovery browse pages if needed.

    // ── 3e. Watchlist ─────────────────────────────────────────────────────────

    function addToWatchlist(payload) {
        var S = window.__latestMediaState;
        if (!S || !S.tok || !S.uid) return;
        fetch((S.url || '') + '/Users/' + S.uid + '/Items/' + payload.mediaId + '/Favorites', {
            method: 'POST',
            headers: getAuthHeaders()
        }).catch(function () {});
    }

    // ── Observer hook ─────────────────────────────────────────────────────────

    function observerCallback() {
        onPageChange();
    }

    // Register with shared observer
    if (window.__latestMediaObserver) {
        window.__latestMediaObserver.register('seerr-page', observerCallback);
    }

    // Run once immediately
    getSeerrCfg().then(function () {
        onPageChange();
    }).catch(function () {});

    // React to hash changes (SPA navigation)
    window.addEventListener('hashchange', function () {
        _lastDetailId = '';
        _lastSearchQuery = '';
        setTimeout(onPageChange, 500); // wait for Jellyfin to render the new page
    });

    // ── Utility ───────────────────────────────────────────────────────────────

    function escHtml(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    console.log('[LatestMedia] seerr-integration loaded');
})();
