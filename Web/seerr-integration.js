/**
 * seerr-integration.js — v3.0.7.0
 * Full Jellyseerr/Overseerr frontend integration.
 *
 * Changes in v3.0.7:
 *  - Properly corrected the Radarr/Sonarr advanced options proxy API from `/api/v1/radarr` to `/api/v1/service/radarr`, resolving the silent JSON failure that caused options blanks.
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

    // ── Cache ─────────────────────────────────────────────────────────────────

    var _cache = new Map();
    var CACHE_TTL = (cfg.JellyseerrResponseCacheTtlMinutes || 10) * 60 * 1000;

    function cacheGet(k) {
        var e = _cache.get(k);
        if (!e) return null;
        if (Date.now() > e.exp) { _cache.delete(k); return null; }
        return e.d;
    }
    function cacheSet(k, d) { _cache.set(k, { d: d, exp: Date.now() + CACHE_TTL }); }

    // ── API ───────────────────────────────────────────────────────────────────

    function safeJson(r) {
        return r.text().then(function (t) {
            if (!t || !t.trim()) throw new Error('Empty response (HTTP ' + r.status + ')');
            return JSON.parse(t);
        });
    }

    function seerrGet(path) {
        var c = cacheGet(path);
        if (c) return Promise.resolve(c);
        return fetch('/Seerr/' + path, { headers: getAuthHeaders() })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return safeJson(r); })
            .then(function (d) { cacheSet(path, d); return d; });
    }

    function seerrPost(path, body) {
        return fetch('/Seerr/' + path, {
            method: 'POST',
            headers: Object.assign({ 'Content-Type': 'application/json' }, getAuthHeaders()),
            body: JSON.stringify(body)
        }).then(function (r) {
            return r.text().then(function (t) {
                var d = (t && t.trim()) ? JSON.parse(t) : {};
                if (!r.ok) throw new Error(JSON.stringify(d));
                return d;
            });
        });
    }

    // ── CSS Injection ─────────────────────────────────────────────────────────

    (function injectStyles() {
        if (document.getElementById('lm-seerr-style')) return;
        var s = document.createElement('style');
        s.id = 'lm-seerr-style';
        s.textContent = [
            /* Search page structural overrides */
            '#searchPage .padded-top.padded-bottom-page { display: flex; flex-direction: column; }',
            /* Search section wrapper — matches Jellyfin's .verticalSection */
            '#lm-seerr-search-section.lm-seerr-section { padding: 0 0 24px; order: 9999; }',
            '#lm-seerr-search-section .lm-seerr-heading { font-size:1.1em; font-weight:600; padding: 4px 24px 12px; }',
            '#lm-seerr-search-section .itemsContainer { padding: 0 16px; display: flex; flex-wrap: wrap; gap: 4px; }',
            /* Detail page scroll sections */
            '.lm-seerr-detail-section { padding-bottom: 16px; }',
            '.lm-seerr-detail-section .lm-seerr-heading { font-size:1.1em; font-weight:600; padding: 16px 24px 8px; }',
            '.lmSeerrScroll { display:flex; gap:0; overflow-x:auto; padding: 0 8px 8px; scrollbar-width:thin; }',
            '.lmSeerrScroll::-webkit-scrollbar { height:4px; }',
            '.lmSeerrScroll::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.2); border-radius:4px; }',
            /* Seerr badge overlay on cards */
            '.lm-seerr-badge-wrap { position:absolute; top:4px; right:4px; }',
            '.lm-seerr-status { padding:2px 6px; border-radius:4px; font-size:0.65em; font-weight:700; display:inline-block; }',
            '.lm-seerr-status.available { background:#00b35a; color:#fff; }',
            '.lm-seerr-status.requested { background:#ff9800; color:#fff; }',
            '.lm-seerr-status.pending { background:#2196f3; color:#fff; }',
            /* Request button below card text */
            '.lm-seerr-req-btn { display:block; width:calc(100% - 8px); margin: 2px 4px 4px; padding:4px 0; background:var(--lm-accent,#00b35a); color:#fff; border:none; border-radius:4px; font-size:0.72em; cursor:pointer; text-align:center; font-weight:600; }',
            '.lm-seerr-req-btn:disabled { opacity:0.5; cursor:default; background:#555; }',
            '.lm-seerr-req-btn.requested { background:#ff9800; }',
            /* Modal */
            '.lmSeerrModal { position:fixed; inset:0; z-index:99999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.6); }',
            '.lmSeerrModalBox { background:rgba(0,0,0,0.52); backdrop-filter:blur(22px) saturate(160%); -webkit-backdrop-filter:blur(22px) saturate(160%); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:0; max-width:540px; width:92%; max-height:85vh; overflow-y:auto; box-shadow:0 8px 40px rgba(0,0,0,0.6); }',
            '.lmSeerrModalHeader { padding:18px 24px 10px; }',
            '.lmSeerrModalTitle { font-size:1.15em; font-weight:700; margin-bottom:3px; }',
            '.lmSeerrModalSubtitle { font-size:0.82em; opacity:0.6; }',
            '.lmSeerrModalBody { padding:8px 24px 4px; }',
            '.lmSeerrModalFooter { padding:10px 24px 18px; display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8px; }',
            '.lmSeerrModalBtn { padding:9px 20px; border-radius:7px; border:none; cursor:pointer; font-size:0.9em; font-weight:600; }',
            '.lmSeerrModalBtn.primary { background:#00b35a; color:#fff; }',
            '.lmSeerrModalBtn.primary4k { background:#ff9800; color:#fff; }',
            '.lmSeerrModalBtn.cancel { background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.15); }',
            /* Season list */
            '.lmSeerrSeasonList { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin:8px 0; }',
            '.lmSeerrSeasonItem label { display:flex; align-items:center; gap:8px; font-size:0.85em; cursor:pointer; }',
            /* Advanced options */
            '.lm-adv-options { margin-top:6px; padding-top:0; }',
            '.lm-adv-options h4 { font-size:0.88em; font-weight:600; opacity:0.75; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em; }',
            '.lm-adv-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px; }',
            '.lm-adv-row.single { grid-template-columns:1fr; }',
            '.lm-adv-group label { font-size:0.8em; opacity:0.6; display:block; margin-bottom:4px; }',
            '.lm-adv-group select { width:100%; background:rgba(0,0,0,0.35); color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:7px 10px; font-size:0.85em; cursor:pointer; }',
        ].join('\n');
        document.head.appendChild(s);
    })();

    // ── Jellyfin-native card builder ──────────────────────────────────────────
    // Matches Jellyfin's own card structure so our results blend with native ones.

    function buildSeerrCard(item) {
        var title = item.title || item.name || 'Unknown';
        var mediaType = (item.mediaType || 'movie').toLowerCase();
        var status = (item.mediaInfo && item.mediaInfo.status) || 0;
        var posterPath = item.posterPath ? 'https://image.tmdb.org/t/p/w400' + item.posterPath : '';
        var year = item.releaseDate || item.firstAirDate;
        var yearStr = year ? year.substring(0, 4) : 'N/A';
        var rating = item.voteAverage ? item.voteAverage.toFixed(1) : 'N/A';
        
        // "Available movies should not come here" filter out items completely
        if (status === 4 || status === 5) return null;

        // Wrap — uses Jellyfin's card classes for visual consistency
        var wrap = document.createElement('div');
        wrap.className = 'card overflowPortraitCard card-hoverable card-withuserdata jellyseerr-card';

        var cardBox = document.createElement('div');
        cardBox.className = 'cardBox cardBox-bottompadded';

        var cardScalable = document.createElement('div');
        cardScalable.className = 'cardScalable';
        cardScalable.style.contain = 'paint';

        var padder = document.createElement('div');
        padder.className = 'cardPadder cardPadder-overflowPortrait';
        cardScalable.appendChild(padder);

        var imgContainer = document.createElement('div');
        imgContainer.className = 'cardImageContainer coveredImage cardContent jellyseerr-poster-image';
        imgContainer.style.backgroundImage = posterPath ? 'url("' + posterPath + '")' : 'none';
        
        if (!posterPath) {
            imgContainer.style.background = '#2a2a40';
            imgContainer.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2em;opacity:0.3;">' + (mediaType === 'tv' ? '📺' : '🎬') + '</div>';
        }

        // Overview Overlay (Hover) — Exact JE Clone
        var overview = document.createElement('div');
        overview.className = 'jellyseerr-overview';
        overview.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.85);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:15px;opacity:0;transition:opacity 0.25s;z-index:10;text-align:center;pointer-events:none;';
        
        var content = document.createElement('div');
        content.className = 'content';
        content.style.cssText = 'font-size:0.85em;opacity:0.85;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden;margin-bottom:12px;';
        
        // Very basic HTMLEscape for textContent
        content.textContent = item.overview || 'No overview available.';
        
        var reqBtn = document.createElement('button');
        reqBtn.className = 'jellyseerr-request-button lm-seerr-req-btn';
        reqBtn.style.cssText = 'padding:6px 14px;border-radius:4px;border:none;pointer-events:auto;cursor:pointer;font-weight:600;min-width:100px;';

        if (status === 2 || status === 3) {
            reqBtn.textContent = 'Requested';
            reqBtn.style.background = '#00b35a';
            reqBtn.disabled = true;
        } else {
            reqBtn.textContent = 'Request';
            reqBtn.style.background = '#4CAF50';
            reqBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                showRequestModal(item);
            });
        }

        overview.appendChild(content);
        overview.appendChild(reqBtn);
        
        // Touch/Hover events to show overlay
        cardScalable.addEventListener('mouseenter', function() { overview.style.opacity = '1'; });
        cardScalable.addEventListener('mouseleave', function() { overview.style.opacity = '0'; });
        imgContainer.addEventListener('touchstart', function(e) {
             if (e.target.closest('.jellyseerr-request-button')) return;
             e.preventDefault();
             overview.style.opacity = '1';
        });

        var overlayContainer = document.createElement('div');
        overlayContainer.className = 'cardOverlayContainer';

        cardScalable.appendChild(imgContainer);
        cardScalable.appendChild(overview);
        cardScalable.appendChild(overlayContainer);
        
        // Footer texts
        var footerFirst = document.createElement('div');
        footerFirst.className = 'cardText cardTextCentered cardText-first';
        var titleLink = document.createElement('a');
        titleLink.href = '#';
        titleLink.style.cssText = 'cursor:pointer;text-decoration:none;color:inherit;';
        titleLink.innerHTML = '<bdi>' + title.replace(/</g, "&lt;") + '</bdi>';
        titleLink.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (status !== 5) showRequestModal(item);
        });
        footerFirst.appendChild(titleLink);

        var footerSecond = document.createElement('div');
        footerSecond.className = 'cardText cardTextCentered cardText-secondary jellyseerr-meta';
        footerSecond.innerHTML = '<bdi>' + yearStr + '</bdi> <span style="margin-left:8px;color:#a3a3a3;">★ ' + rating + '</span>';

        cardBox.appendChild(cardScalable);
        cardBox.appendChild(footerFirst);
        cardBox.appendChild(footerSecond);
        wrap.appendChild(cardBox);

        // Click handler to open the detailed popup (but exclude the request button itself)
        wrap.addEventListener('click', function(e) {
            if (e.target.closest('.jellyseerr-request-button') || e.target.closest('a')) return;
            e.preventDefault();
            e.stopPropagation();
            showInfoModal(item);
        });

        return wrap;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SEARCH INTEGRATION
    // ═══════════════════════════════════════════════════════════════════════════

    var _searchDebounce = null;
    var _lastSearchQuery = '';
    var _searchObserver = null;

    function injectSeerrSearchResults(query) {
        if (!query) return;
        var old = document.getElementById('lm-seerr-search-section');
        if (old) old.remove();

        seerrGet('Search?query=' + encodeURIComponent(query))
            .then(function (data) {
                var results = (data && data.results) || [];

                // Filter people — Seerr includes person results, we only want media
                results = results.filter(function (i) { return i.mediaType !== 'person'; });

                // Optionally exclude items already in library
                if (cfg.JellyseerrExcludeLibraryItems) {
                    results = results.filter(function (i) { return !(i.mediaInfo && i.mediaInfo.status === 5); });
                }

                if (results.length === 0) return;

                var section = document.createElement('div');
                section.id = 'lm-seerr-search-section';
                section.className = 'lm-seerr-section verticalSection';

                var h2 = document.createElement('h2');
                h2.className = 'sectionTitle lm-seerr-heading';
                h2.textContent = 'Request'; // was "Request via Jellyseerr"
                section.appendChild(h2);

                var container = document.createElement('div');
                container.className = 'itemsContainer vertical-wrap';
                container.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';

                results.slice(0, 20).forEach(function (item) {
                    container.appendChild(buildSeerrCard(item));
                });
                section.appendChild(container);

                // Insert at BOTTOM of search page content area
                // Like JE: positionSection() finds last primary section
                var searchPage = document.querySelector('#searchPage');
                if (!searchPage) return;

                var positionSection = function() {
                    var noResultsMessage = searchPage.querySelector('.noItemsMessage');
                    if (noResultsMessage) {
                        noResultsMessage.textContent = 'No local results found. Showing Discover results:';
                        noResultsMessage.parentElement.insertBefore(section, noResultsMessage.nextSibling);
                        return true;
                    }
                    var sections = Array.from(searchPage.querySelectorAll('.verticalSection:not(.lm-seerr-section)'));
                    var keywords = ['movies', 'shows', 'film', 'series', 'películas', 'films', 'séries'];
                    for (var i = sections.length - 1; i >= 0; i--) {
                        var t = sections[i].querySelector('.sectionTitle');
                        if (t && keywords.some(function(k) { return t.textContent.toLowerCase().includes(k); })) {
                            sections[i].after(section);
                            return true;
                        }
                    }
                    var cont = searchPage.querySelector('.searchResults, [class*="searchResults"], .padded-top.padded-bottom-page');
                    if (cont) {
                        cont.appendChild(section);
                    } else {
                        searchPage.appendChild(section);
                    }
                    return false;
                };

                positionSection();
            })
            .catch(function (err) { console.debug('[LatestMedia] Seerr search failed:', err.message); });
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

    function tryAttachSearchListener() {
        var searchInput = document.querySelector('#searchPage #searchTextInput');
        if (!searchInput) return;
        if (!searchInput.dataset.lmSeerrListener) {
            searchInput.addEventListener('input', function () { handleSearchInput(searchInput.value); });
            searchInput.dataset.lmSeerrListener = 'true';
            console.debug('[LatestMedia] Seerr: search input listener attached');
        }
        if (searchInput.value && searchInput.value.trim()) {
            handleSearchInput(searchInput.value);
        }
    }

    function initSearchObserver() {
        if (_searchObserver) return;
        _searchObserver = new MutationObserver(function () { tryAttachSearchListener(); });
        _searchObserver.observe(document.body, { childList: true, subtree: true });
        tryAttachSearchListener();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ITEM DETAILS — Similar + Recommended
    // ═══════════════════════════════════════════════════════════════════════════

    var _detailAbortController = null;
    var _processedItems = new Set();

    function getItemTmdbId(jellyfinId, signal) {
        var S = window.__latestMediaState;
        if (!S || !S.tok) return Promise.resolve(null);
        return fetch((S.url || '') + '/Items/' + jellyfinId + '?Fields=ProviderIds', {
            headers: getAuthHeaders(), signal: signal
        }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return safeJson(r); })
            .then(function (item) {
                var tmdbId = item.ProviderIds && (item.ProviderIds.Tmdb || item.ProviderIds.TheMovieDb);
                if (!tmdbId) return null;
                var type = item.Type === 'Movie' ? 'movie' : item.Type === 'Series' ? 'tv' : null;
                if (!type) return null;
                return { tmdbId: parseInt(tmdbId), type: type };
            });
    }

    function waitForDetailPageReady(signal) {
        return new Promise(function (resolve) {
            if (signal && signal.aborted) { resolve(null); return; }
            function checkPage() {
                var activePage = document.querySelector('.libraryPage:not(.hide)');
                if (!activePage) return null;
                var content = activePage.querySelector('.detailPageContent');
                var anchor = content && content.querySelector('#similarCollapsible');
                return (content && anchor) ? { content: content, anchor: anchor } : null;
            }
            var immediate = checkPage();
            if (immediate) { resolve(immediate); return; }
            var obs = null, tid = null;
            function cleanup() { if (obs) { obs.disconnect(); obs = null; } if (tid) { clearTimeout(tid); tid = null; } }
            if (signal) signal.addEventListener('abort', function () { cleanup(); resolve(null); }, { once: true });
            obs = new MutationObserver(function () {
                var r = checkPage(); if (r) { cleanup(); resolve(r); }
            });
            obs.observe(document.body, { childList: true, subtree: true });
            tid = setTimeout(function () { cleanup(); resolve(checkPage()); }, 4000);
        });
    }

    function buildDetailScrollSection(title, items, sectionId) {
        var sec = document.createElement('div');
        sec.className = 'lm-seerr-detail-section verticalSection';
        if (sectionId) sec.id = sectionId;
        sec.setAttribute('data-jellyseerr-section', 'true');
        var h2 = document.createElement('h2');
        h2.className = 'sectionTitle lm-seerr-heading';
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
        if (_detailAbortController) _detailAbortController.abort();
        _detailAbortController = new AbortController();
        var signal = _detailAbortController.signal;

        var showSimilar = cfg.JellyseerrShowSimilar !== false;
        var showRecommended = cfg.JellyseerrShowRecommended !== false;
        if (!showSimilar && !showRecommended) return;

        getItemTmdbId(itemId, signal)
            .then(function (tmdbInfo) {
                if (signal.aborted || !tmdbInfo) return Promise.reject(new DOMException('Aborted', 'AbortError'));
                var capType = tmdbInfo.type === 'movie' ? 'Movie' : 'Tv';
                var promises = [
                    showSimilar ? seerrGet(capType + '/' + tmdbInfo.tmdbId + '/Similar') : Promise.resolve({ results: [] }),
                    showRecommended ? seerrGet(capType + '/' + tmdbInfo.tmdbId + '/Recommendations') : Promise.resolve({ results: [] }),
                    waitForDetailPageReady(signal)
                ];
                return Promise.all(promises).then(function (res) {
                    if (signal.aborted) return;
                    var simData = res[0], recData = res[1], pageReady = res[2];
                    if (!pageReady) return;

                    var simResults = (simData && simData.results) || [];
                    var recResults = (recData && recData.results) || [];

                    if (cfg.JellyseerrExcludeLibraryItems) {
                        simResults = simResults.filter(function (i) { return !(i.mediaInfo && i.mediaInfo.jellyfinMediaId); });
                        recResults = recResults.filter(function (i) { return !(i.mediaInfo && i.mediaInfo.jellyfinMediaId); });
                    }

                    // Remove existing sections
                    pageReady.content.querySelectorAll('[data-jellyseerr-section]').forEach(function (el) { el.remove(); });

                    if (recResults.length > 0) {
                        var recSec = buildDetailScrollSection('Recommended', recResults.slice(0, 20), 'lm-seerr-recommended');
                        pageReady.anchor.after(recSec);
                    }
                    if (simResults.length > 0) {
                        var simSec = buildDetailScrollSection('More Like This', simResults.slice(0, 20), 'lm-seerr-similar');
                        var anchor2 = pageReady.content.querySelector('[data-jellyseerr-section]') || pageReady.anchor;
                        anchor2.after(simSec);
                    }

                    _processedItems.add(itemId);
                });
            })
            .catch(function (err) {
                if (err && err.name === 'AbortError') return;
                console.debug('[LatestMedia] Seerr detail error:', err.message || err);
            });
    }

    function handleItemDetailsPage() {
        var hash = window.location.hash || '';
        if (!hash.includes('/details?id=')) return;
        var itemId;
        try { itemId = new URLSearchParams(hash.split('?')[1]).get('id'); } catch (e) { return; }
        if (!itemId) return;
        requestAnimationFrame(function () { renderSimilarAndRecommended(itemId); });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MORE INFO MODAL
    // ═══════════════════════════════════════════════════════════════════════════

    function showInfoModal(item) {
        var existing = document.getElementById('lm-seerr-info-modal');
        if (existing) existing.remove();

        var mediaType = (item.mediaType || 'movie').toLowerCase();
        var tmdbId = item.id;
        var title = item.title || item.name || 'Unknown';
        var year = (item.releaseDate || item.firstAirDate || '').substring(0, 4);
        var pPath = item.posterPath ? 'https://image.tmdb.org/t/p/w600_and_h900_bestv2' + item.posterPath : '';
        var bPath = item.backdropPath ? 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces' + item.backdropPath : '';

        var modal = document.createElement('div');
        modal.id = 'lm-seerr-info-modal';
        modal.className = 'lm-seerr-modal';
        if (bPath) modal.style.backgroundImage = 'linear-gradient(to right, rgba(0,0,0,0.95) 40%, rgba(0,0,0,0.6) 100%), url("' + bPath + '")';
        modal.style.backgroundSize = 'cover';
        modal.style.backgroundPosition = 'center';

        var contentDiv = document.createElement('div');
        contentDiv.className = 'lm-seerr-modal-box';
        contentDiv.style.maxWidth = '800px';
        contentDiv.style.flexDirection = 'row';
        contentDiv.style.justifyContent = 'space-between';
        contentDiv.style.alignItems = 'flex-start';
        contentDiv.style.gap = '30px';
        contentDiv.style.background = 'rgba(20,20,30,0.75)';

        // Left Col (Text)
        var leftCol = document.createElement('div');
        leftCol.style.flex = '1';

        var h3 = document.createElement('h2');
        h3.style.marginTop = '0';
        h3.style.marginBottom = '5px';
        h3.textContent = title + (year ? ' (' + year + ')' : '');
        leftCol.appendChild(h3);

        var overviewP = document.createElement('p');
        overviewP.style.lineHeight = '1.6';
        overviewP.style.color = '#ccc';
        overviewP.textContent = item.overview || 'No overview available.';
        leftCol.appendChild(overviewP);

        var actorsEl = document.createElement('div');
        actorsEl.style.marginTop = '20px';
        actorsEl.innerHTML = '<span style="color:#00b35a;font-weight:bold;">Cast:</span> <span class="actor-list">Loading...</span>';
        leftCol.appendChild(actorsEl);
        
        // Right Col (Poster + Close Btn)
        var rightCol = document.createElement('div');
        rightCol.style.width = '200px';
        rightCol.style.flexShrink = '0';
        rightCol.style.textAlign = 'right';

        var closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = 'background:none;border:none;color:#fff;font-size:24px;cursor:pointer;margin-bottom:15px;float:right;';
        closeBtn.addEventListener('click', function() { modal.remove(); });
        rightCol.appendChild(closeBtn);
        
        var clearDiv = document.createElement('div');
        clearDiv.style.clear = 'both';
        rightCol.appendChild(clearDiv);

        if (pPath) {
            var img = document.createElement('img');
            img.src = pPath;
            img.style.width = '100%';
            img.style.borderRadius = '8px';
            img.style.boxShadow = '0 6px 20px rgba(0,0,0,0.5)';
            rightCol.appendChild(img);
        }

        contentDiv.appendChild(leftCol);
        contentDiv.appendChild(rightCol);
        modal.appendChild(contentDiv);

        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);

        seerrGet((mediaType === 'movie' ? 'movie/' : 'tv/') + tmdbId)
            .then(function(fullData) {
                var credits = fullData.credits || {};
                var cast = credits.cast || [];
                var topCast = cast.slice(0, 6).map(function(c) { return c.name; }).join(', ');
                actorsEl.querySelector('.actor-list').textContent = topCast || 'Unknown';
            }).catch(function() {
                actorsEl.querySelector('.actor-list').textContent = 'Could not load cast.';
            });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REQUEST MODAL — Simple + Advanced (server/quality/folder)
    // ═══════════════════════════════════════════════════════════════════════════

    function showRequestModal(item) {
        var existing = document.getElementById('lm-seerr-modal');
        if (existing) existing.remove();

        // Properly detect media type from Seerr response field
        // item.mediaType is 'movie' | 'tv' from Seerr search results
        var mediaType = (item.mediaType || 'movie').toLowerCase();
        var isMovie = mediaType === 'movie';
        var title = item.title || item.name || 'Unknown';
        var year = (item.releaseDate || item.firstAirDate || '').substring(0, 4);
        var tmdbId = item.id; // Seerr item.id IS the TMDB ID

        var modal = document.createElement('div');
        modal.id = 'lm-seerr-modal';
        modal.className = 'lmSeerrModal';

        var box = document.createElement('div');
        box.className = 'lmSeerrModalBox';

        // Header
        var header = document.createElement('div');
        header.className = 'lmSeerrModalHeader';
        header.innerHTML = '<div class="lmSeerrModalTitle">' + escHtml(title) + '</div>' +
            '<div class="lmSeerrModalSubtitle">' + (year ? year + ' · ' : '') + (isMovie ? 'Movie' : 'TV Series') + '</div>';
        box.appendChild(header);

        // Body (season list for TV, advanced options if enabled)
        var body = document.createElement('div');
        body.className = 'lmSeerrModalBody';
        box.appendChild(body);

        // Season list (TV only)
        var checkboxes = [];
        if (!isMovie) {
            var seasonHeading = document.createElement('div');
            seasonHeading.style.cssText = 'font-size:0.9em;font-weight:600;margin-bottom:8px;';
            seasonHeading.textContent = 'Loading seasons...';
            body.appendChild(seasonHeading);

            var seasonList = document.createElement('div');
            seasonList.className = 'lmSeerrSeasonList';
            body.appendChild(seasonList);

            seerrGet('Tv/' + tmdbId).then(function(tvDetails) {
                seasonHeading.textContent = 'Select Seasons:';
                var seasons = (tvDetails && tvDetails.seasons) || [];
                // Filter out season 0 (Specials) by default unless requested, but let's just show all available
                if (seasons.length === 0) {
                    var fallbackSeasons = item.numberOfSeasons || 1;
                    for (var j = 1; j <= fallbackSeasons; j++) {
                        seasons.push({ seasonNumber: j, name: 'Season ' + j });
                    }
                }

                seasons.forEach(function(season) {
                    // Do not auto-select season 0 (Specials) to prevent Seerr errors on unsupported specials
                    var isSpecial = season.seasonNumber === 0;
                    var label = document.createElement('label');
                    label.className = 'lmSeerrSeasonItem';
                    var cb = document.createElement('input');
                    cb.type = 'checkbox'; 
                    cb.value = season.seasonNumber; 
                    cb.checked = !isSpecial;  // Auto-check normal seasons
                    checkboxes.push(cb);
                    label.appendChild(cb);
                    label.appendChild(document.createTextNode(' ' + (season.name || 'Season ' + season.seasonNumber)));
                    seasonList.appendChild(label);
                });
            }).catch(function() {
                seasonHeading.textContent = 'Select Seasons (details failed to load):';
                var fallbackCount = item.numberOfSeasons || 1;
                for (var i = 1; i <= fallbackCount; i++) {
                    var label = document.createElement('label');
                    label.className = 'lmSeerrSeasonItem';
                    var cb = document.createElement('input');
                    cb.type = 'checkbox'; cb.value = i; cb.checked = true;
                    checkboxes.push(cb);
                    label.appendChild(cb);
                    label.appendChild(document.createTextNode(' Season ' + i));
                    seasonList.appendChild(label);
                }
            });
        }

        // Advanced options: only rendered when admin has enabled them in settings
        var advancedState = { serverId: null, profileId: null, rootFolder: null };
        var serverSelect = null, qualitySelect = null, folderSelect = null;
        var advParent = document.createElement('div');
        body.appendChild(advParent);

        var loadAdvancedOptions = function() {
            if (!cfg.JellyseerrShowAdvanced) return; // ← gated by setting

            var advDiv = document.createElement('div');
            advDiv.className = 'lm-adv-options';
            advDiv.innerHTML = '<h4>Advanced Options</h4>' +
                '<div class="lm-adv-row">' +
                '<div class="lm-adv-group"><label>Server</label>' +
                '<select class="lm-adv-server"><option>Loading...</option></select></div>' +
                '<div class="lm-adv-group"><label>Quality Profile</label>' +
                '<select class="lm-adv-quality" disabled><option>Select server first</option></select></div>' +
                '</div>' +
                '<div class="lm-adv-row single">' +
                '<div class="lm-adv-group"><label>Root Folder</label>' +
                '<select class="lm-adv-folder" disabled><option>Select server first</option></select></div>' +
                '</div>';

            serverSelect = advDiv.querySelector('.lm-adv-server');
            qualitySelect = advDiv.querySelector('.lm-adv-quality');
            folderSelect = advDiv.querySelector('.lm-adv-folder');

            serverSelect.addEventListener('change', function () {
                advancedState.serverId = serverSelect.value || null;
                var selServer = (serverSelect._servers || []).find(function (s) { return String(s.id) === String(serverSelect.value); });
                if (!selServer) return;

                qualitySelect.innerHTML = '<option value="">Default</option>';
                qualitySelect.disabled = false;
                var defaultProfileId = null;
                (selServer.profiles || []).forEach(function (p) {
                    var o = new Option(p.name || 'Profile ' + p.id, p.id);
                    // Auto-select the default quality profile
                    if (p.isDefault) { o.selected = true; defaultProfileId = String(p.id); }
                    qualitySelect.appendChild(o);
                });
                advancedState.profileId = defaultProfileId;

                folderSelect.innerHTML = '<option value="">Default</option>';
                folderSelect.disabled = false;
                (selServer.rootFolders || []).forEach(function (f) {
                    var o = new Option(f.path, f.path);
                    if (f.path === selServer.activeDirectory) o.selected = true;
                    folderSelect.appendChild(o);
                });
            });

            qualitySelect.addEventListener('change', function () { advancedState.profileId = qualitySelect.value || null; });
            folderSelect.addEventListener('change', function () { advancedState.rootFolder = folderSelect.value || null; });

            var serverEndpoint = isMovie ? 'Radarr' : 'Sonarr';
            seerrGet(serverEndpoint)
                .then(function (servers) {
                    var list = Array.isArray(servers) ? servers : [];
                    if (list.length === 0) return;

                    advParent.appendChild(advDiv);

                    serverSelect.innerHTML = '<option value="">Default</option>';
                    serverSelect._servers = [];
                    var fetches = list.map(function (srv) {
                        return seerrGet(serverEndpoint + '/' + srv.id).then(function (detail) {
                            return Object.assign({}, srv, {
                                profiles: detail.profiles || [],
                                rootFolders: detail.rootFolders || []
                            });
                        }).catch(function () { return Object.assign({}, srv, { profiles: [], rootFolders: [] }); });
                    });
                    return Promise.all(fetches).then(function (detailed) {
                        serverSelect._servers = detailed;
                        detailed.forEach(function (srv) {
                            var o = new Option(srv.name || 'Server ' + srv.id, srv.id);
                            if (srv.isDefault) o.selected = true;
                            serverSelect.appendChild(o);
                        });
                        if (serverSelect.value) serverSelect.dispatchEvent(new Event('change'));
                    });
                })
                .catch(function () {});
        };

        loadAdvancedOptions();



        // Footer buttons
        var footer = document.createElement('div');
        footer.className = 'lmSeerrModalFooter';

        var cancelBtn = makeMBtn('Cancel', 'cancel');
        cancelBtn.addEventListener('click', function () { modal.remove(); });

        var reqBtn = makeMBtn('Request', 'primary');
        reqBtn.addEventListener('click', function () {
            var adv = {};
            if (advancedState.serverId) adv.serverId = parseInt(advancedState.serverId);
            var profileToUse = advancedState.profileId || (isMovie ? cfg.JellyseerrDefaultRadarrProfileId : cfg.JellyseerrDefaultSonarrProfileId);
            if (profileToUse) adv.profileId = parseInt(profileToUse);
            if (advancedState.rootFolder) adv.rootFolder = advancedState.rootFolder;
            
            if (!isMovie) {
                var selectedSeasons = checkboxes.filter(function (c) { return c.checked; })
                    .map(function (c) { return parseInt(c.value); });
                if (selectedSeasons.length === 0) { alert('Select at least one season.'); return; }
                submitRequest(modal, reqBtn, Object.assign({ mediaType: 'tv', mediaId: tmdbId, is4k: false, seasons: selectedSeasons }, adv));
            } else {
                submitRequest(modal, reqBtn, Object.assign({ mediaType: 'movie', mediaId: tmdbId, is4k: false }, adv));
            }
        });

        footer.appendChild(cancelBtn);
        footer.appendChild(reqBtn);

        if (isMovie && cfg.JellyseerrEnable4KRequests) {
            var req4kBtn = makeMBtn('Request 4K', 'primary4k');
            req4kBtn.addEventListener('click', function () {
                var adv = {};
                if (advancedState.serverId) adv.serverId = parseInt(advancedState.serverId);
                var profileToUse = advancedState.profileId || (isMovie ? cfg.JellyseerrDefaultRadarrProfileId : cfg.JellyseerrDefaultSonarrProfileId);
                if (profileToUse) adv.profileId = parseInt(profileToUse);
                if (advancedState.rootFolder) adv.rootFolder = advancedState.rootFolder;
                submitRequest(modal, req4kBtn, Object.assign({ mediaType: 'movie', mediaId: tmdbId, is4k: true }, adv));
            });
            footer.appendChild(req4kBtn);
        }
        if (!isMovie && cfg.JellyseerrEnable4KTvRequests) {
            var req4kTvBtn = makeMBtn('Request 4K', 'primary4k');
            req4kTvBtn.addEventListener('click', function () {
                var selectedSeasons = checkboxes.filter(function (c) { return c.checked; })
                    .map(function (c) { return parseInt(c.value); });
                if (selectedSeasons.length === 0) { alert('Select at least one season.'); return; }
                
                var adv = {};
                if (advancedState.serverId) adv.serverId = parseInt(advancedState.serverId);
                var profileToUse = advancedState.profileId || (isMovie ? cfg.JellyseerrDefaultRadarrProfileId : cfg.JellyseerrDefaultSonarrProfileId);
                if (profileToUse) adv.profileId = parseInt(profileToUse);
                if (advancedState.rootFolder) adv.rootFolder = advancedState.rootFolder;
                
                submitRequest(modal, req4kTvBtn, Object.assign({ mediaType: 'tv', mediaId: tmdbId, is4k: true, seasons: selectedSeasons }, adv));
            });
            footer.appendChild(req4kTvBtn);
        }

        box.appendChild(footer);
        modal.appendChild(box);

        modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });
        document.body.appendChild(modal);
    }

    function submitRequest(modal, btn, payload) {
        btn.disabled = true;
        btn.textContent = 'Requesting...';
        seerrPost('Request', payload)
            .then(function () {
                btn.textContent = 'Requested!';
                btn.style.background = '#00b35a';
                if (cfg.AddRequestedMediaToWatchlist) addToWatchlist(payload);
                setTimeout(function () { modal.remove(); }, 1500);
            })
            .catch(function (err) {
                btn.disabled = false;
                btn.textContent = btn.className.includes('4k') ? 'Request 4K' : 'Request';
                var msg = err.message || 'Unknown error';
                try {
                    var parsed = JSON.parse(msg);
                    msg = parsed.message || msg;
                } catch (e) {}
                alert('Request failed: ' + msg);
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
        var S = window.__latestMediaState;
        if (!S || !S.tok || !S.uid) return;
        var typeParam = payload.mediaType === 'movie' ? 'Movie' : 'Series';
        // Look up the Jellyfin item by TMDB ID
        fetch((S.url || '') + '/Items?IncludeItemTypes=' + typeParam +
            '&AnyProviderIdEquals=tmdb.' + payload.mediaId + '&Recursive=true&Fields=Id', {
            headers: getAuthHeaders()
        }).then(function (r) { return r.ok ? safeJson(r) : null; })
            .then(function (d) {
                var items = d && d.Items;
                if (!items || !items.length) return;
                var itemId = items[0].Id;
                // Add to Jellyfin Favorites (Wishlist/Watchlist equivalent)
                return fetch((S.url || '') + '/Users/' + S.uid + '/FavoriteItems/' + itemId, {
                    method: 'POST', headers: getAuthHeaders()
                });
            }).catch(function () {});
    }

    // ── Utility ───────────────────────────────────────────────────────────────

    function escHtml(s) {
        return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════════════════════════════════════

    function onNavigate() {
        _lastSearchQuery = '';
        _processedItems.clear();
        setTimeout(handleItemDetailsPage, 300);
    }

    window.addEventListener('hashchange', onNavigate);
    document.addEventListener('viewshow', function () { setTimeout(handleItemDetailsPage, 200); });

    if (cfg.JellyseerrShowSearchResults !== false) {
        initSearchObserver();
    }
    if (cfg.JellyseerrShowSimilar !== false || cfg.JellyseerrShowRecommended !== false) {
        handleItemDetailsPage();
    }

    console.log('[LatestMedia] seerr-integration loaded (v3.2.0)');
})();
