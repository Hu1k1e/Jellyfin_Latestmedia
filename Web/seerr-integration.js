/**
 * seerr-integration.js — v3.0.3.0
 * Full Jellyseerr/Overseerr frontend integration.
 *
 * Changes in v3.0.3:
 *  - Cards now use Jellyfin's native .card structure to blend with existing results
 *  - Fixed request type detection: properly reads item.mediaType from Seerr response
 *    instead of guessing movie vs TV from numberOfSeasons
 *  - Advanced request modal: fetches Radarr/Sonarr servers, quality profiles, root
 *    folders when JellyseerrShowAdvanced is enabled (matches JE behaviour)
 *  - Section titles: "Request via Jellyseerr" → "Request", "More Like This (Seerr)" → "More Like This"
 *  - Request failure: was sending wrong mediaType for TV shows → fixed
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
            /* Search section wrapper — matches Jellyfin's .verticalSection */
            '#lm-seerr-search-section.lm-seerr-section { padding: 0 0 24px; }',
            '#lm-seerr-search-section .lm-seerr-heading { font-size:1.1em; font-weight:600; padding: 4px 24px 12px; }',
            '#lm-seerr-search-section .itemsContainer { padding: 0 16px; }',
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
            '.lmSeerrModal { position:fixed; inset:0; z-index:99999; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.75); }',
            '.lmSeerrModalBox { background:#1e1e2a; border-radius:12px; padding:0; max-width:540px; width:92%; max-height:85vh; overflow-y:auto; box-shadow:0 12px 48px rgba(0,0,0,0.7); }',
            '.lmSeerrModalHeader { padding:20px 24px 16px; border-bottom:1px solid rgba(255,255,255,0.08); }',
            '.lmSeerrModalTitle { font-size:1.15em; font-weight:700; margin-bottom:4px; }',
            '.lmSeerrModalSubtitle { font-size:0.82em; opacity:0.6; }',
            '.lmSeerrModalBody { padding:16px 24px; }',
            '.lmSeerrModalFooter { padding:12px 24px 20px; display:flex; flex-wrap:wrap; justify-content:flex-end; gap:8px; border-top:1px solid rgba(255,255,255,0.08); }',
            '.lmSeerrModalBtn { padding:9px 20px; border-radius:7px; border:none; cursor:pointer; font-size:0.9em; font-weight:600; }',
            '.lmSeerrModalBtn.primary { background:#00b35a; color:#fff; }',
            '.lmSeerrModalBtn.primary4k { background:#ff9800; color:#fff; }',
            '.lmSeerrModalBtn.cancel { background:rgba(255,255,255,0.1); color:#fff; border:1px solid rgba(255,255,255,0.15); }',
            /* Season list */
            '.lmSeerrSeasonList { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin:8px 0; }',
            '.lmSeerrSeasonItem label { display:flex; align-items:center; gap:8px; font-size:0.85em; cursor:pointer; }',
            /* Advanced options */
            '.lm-adv-options { margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.08); }',
            '.lm-adv-options h4 { font-size:0.88em; font-weight:600; opacity:0.75; margin-bottom:10px; text-transform:uppercase; letter-spacing:0.05em; }',
            '.lm-adv-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:10px; }',
            '.lm-adv-row.single { grid-template-columns:1fr; }',
            '.lm-adv-group label { font-size:0.8em; opacity:0.6; display:block; margin-bottom:4px; }',
            '.lm-adv-group select { width:100%; background:#2a2a3a; color:#fff; border:1px solid rgba(255,255,255,0.15); border-radius:6px; padding:7px 10px; font-size:0.85em; cursor:pointer; }',
        ].join('\n');
        document.head.appendChild(s);
    })();

    // ── Jellyfin-native card builder ──────────────────────────────────────────
    // Matches Jellyfin's own card structure so our results blend with native ones.

    function buildSeerrCard(item) {
        var title = item.title || item.name || 'Unknown';
        var mediaType = (item.mediaType || 'movie').toLowerCase(); // 'movie' | 'tv'
        var status = (item.mediaInfo && item.mediaInfo.status) || 0;
        var posterPath = item.posterPath ? 'https://image.tmdb.org/t/p/w200' + item.posterPath : '';

        // Status label
        var statusLabel = '', statusClass = '';
        if (status === 5)       { statusLabel = 'Available';  statusClass = 'available'; }
        else if (status === 3 || status === 4) { statusLabel = 'Processing'; statusClass = 'requested'; }
        else if (status === 2)  { statusLabel = 'Requested'; statusClass = 'requested'; }
        else if (status === 1)  { statusLabel = 'Pending';    statusClass = 'pending'; }

        // Wrap — uses Jellyfin's card classes for visual consistency
        var wrap = document.createElement('div');
        wrap.className = 'card portraitCard card-withuserdata';
        wrap.style.cssText = 'min-width:130px;max-width:160px;flex-shrink:0;position:relative;';

        // Image container
        var imgContainer = document.createElement('div');
        imgContainer.className = 'cardImageContainer coveredImage cardContent';
        imgContainer.style.cssText = 'aspect-ratio:2/3;background:#18181e;border-radius:4px 4px 0 0;overflow:hidden;position:relative;';

        var img = document.createElement('img');
        img.className = 'cardImage';
        img.alt = title;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';

        if (posterPath) {
            // Lazy-load
            var imgObs = new IntersectionObserver(function (entries, obs) {
                if (entries[0].isIntersecting) { img.src = posterPath; obs.disconnect(); }
            }, { rootMargin: '200px' });
            imgObs.observe(img);
        } else {
            // Placeholder
            imgContainer.style.background = '#2a2a40';
            img.style.display = 'none';
            var placeholder = document.createElement('div');
            placeholder.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:2em;opacity:0.3;';
            placeholder.textContent = mediaType === 'tv' ? '📺' : '🎬';
            imgContainer.appendChild(placeholder);
        }

        imgContainer.appendChild(img);

        // Status badge
        if (statusLabel) {
            var badge = document.createElement('div');
            badge.className = 'lm-seerr-badge-wrap';
            badge.innerHTML = '<span class="lm-seerr-status ' + statusClass + '">' + statusLabel + '</span>';
            imgContainer.appendChild(badge);
        }

        wrap.appendChild(imgContainer);

        // Card footer text — same structure as Jellyfin
        var footer = document.createElement('div');
        footer.className = 'cardText';
        footer.style.cssText = 'padding:6px 4px 0; font-size:0.78em;';

        var titleEl = document.createElement('div');
        titleEl.className = 'cardText-first';
        titleEl.style.cssText = 'overflow:hidden;white-space:nowrap;text-overflow:ellipsis;font-weight:500;';
        titleEl.title = title;
        titleEl.textContent = title;
        footer.appendChild(titleEl);

        // Year subtitle if available
        var year = item.releaseDate || item.firstAirDate;
        if (year) {
            var yearEl = document.createElement('div');
            yearEl.className = 'cardText-secondary';
            yearEl.style.cssText = 'opacity:0.6;font-size:0.92em;';
            yearEl.textContent = year.substring(0, 4);
            footer.appendChild(yearEl);
        }

        wrap.appendChild(footer);

        // Request button (below footer)
        var reqBtn = document.createElement('button');
        reqBtn.className = 'lm-seerr-req-btn';

        if (status === 5) {
            reqBtn.textContent = 'Available';
            reqBtn.disabled = true;
        } else if (status === 2 || status === 3 || status === 4) {
            reqBtn.textContent = 'Requested';
            reqBtn.disabled = true;
            reqBtn.classList.add('requested');
        } else {
            reqBtn.textContent = 'Request';
            reqBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                showRequestModal(item);
            });
        }

        wrap.appendChild(reqBtn);
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

                // Insert at TOP of search page content area
                var searchPage = document.querySelector('#searchPage');
                var insertTarget = searchPage && (
                    searchPage.querySelector('.padded-top.padded-bottom-page') ||
                    searchPage.querySelector('.searchResults') ||
                    searchPage.querySelector('.content-primary')
                );
                if (insertTarget) {
                    insertTarget.insertBefore(section, insertTarget.firstChild);
                } else if (searchPage) {
                    searchPage.insertBefore(section, searchPage.firstChild);
                }
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
            var numSeasons = item.numberOfSeasons || 1;
            var seasonHeading = document.createElement('div');
            seasonHeading.style.cssText = 'font-size:0.9em;font-weight:600;margin-bottom:8px;';
            seasonHeading.textContent = 'Select Seasons:';
            body.appendChild(seasonHeading);

            var seasonList = document.createElement('div');
            seasonList.className = 'lmSeerrSeasonList';
            for (var i = 1; i <= numSeasons; i++) {
                (function (sn) {
                    var label = document.createElement('label');
                    label.className = 'lmSeerrSeasonItem';
                    var cb = document.createElement('input');
                    cb.type = 'checkbox'; cb.value = sn; cb.checked = true;
                    checkboxes.push(cb);
                    label.appendChild(cb);
                    label.appendChild(document.createTextNode(' Season ' + sn));
                    seasonList.appendChild(label);
                })(i);
            }
            body.appendChild(seasonList);
        }

        // Advanced options section (loaded asynchronously if enabled)
        var advancedState = { serverId: null, profileId: null, rootFolder: null };
        var serverSelect = null, qualitySelect = null, folderSelect = null;

        if (cfg.JellyseerrShowAdvanced) {
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
            body.appendChild(advDiv);

            serverSelect = advDiv.querySelector('.lm-adv-server');
            qualitySelect = advDiv.querySelector('.lm-adv-quality');
            folderSelect = advDiv.querySelector('.lm-adv-folder');

            // Capture changes
            serverSelect.addEventListener('change', function () {
                advancedState.serverId = serverSelect.value || null;
                // Find selected server and populate quality/folder
                var selServer = (serverSelect._servers || []).find(function (s) { return String(s.id) === String(serverSelect.value); });
                if (!selServer) return;

                qualitySelect.innerHTML = '<option value="">Default</option>';
                qualitySelect.disabled = false;
                (selServer.profiles || []).forEach(function (p) {
                    var o = new Option(p.name || 'Profile ' + p.id, p.id);
                    qualitySelect.appendChild(o);
                });

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

            // Fetch radarr/sonarr servers
            var serverEndpoint = isMovie ? 'Radarr' : 'Sonarr';
            seerrGet(serverEndpoint)
                .then(function (servers) {
                    var list = Array.isArray(servers) ? servers : [];
                    if (list.length === 0) {
                        serverSelect.innerHTML = '<option value="">No servers configured</option>';
                        return;
                    }
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
                        // Auto-trigger if default selected
                        if (serverSelect.value) serverSelect.dispatchEvent(new Event('change'));
                    });
                })
                .catch(function () {
                    serverSelect.innerHTML = '<option value="">Failed to load servers</option>';
                });
        }

        // Footer buttons
        var footer = document.createElement('div');
        footer.className = 'lmSeerrModalFooter';

        var cancelBtn = makeMBtn('Cancel', 'cancel');
        cancelBtn.addEventListener('click', function () { modal.remove(); });

        var reqBtn = makeMBtn('Request', 'primary');
        reqBtn.addEventListener('click', function () {
            var adv = {};
            if (cfg.JellyseerrShowAdvanced) {
                if (advancedState.serverId) adv.serverId = parseInt(advancedState.serverId);
                if (advancedState.profileId) adv.profileId = parseInt(advancedState.profileId);
                if (advancedState.rootFolder) adv.rootFolder = advancedState.rootFolder;
            }
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
                submitRequest(modal, req4kBtn, { mediaType: 'movie', mediaId: tmdbId, is4k: true });
            });
            footer.appendChild(req4kBtn);
        }
        if (!isMovie && cfg.JellyseerrEnable4KTvRequests) {
            var req4kTvBtn = makeMBtn('Request 4K', 'primary4k');
            req4kTvBtn.addEventListener('click', function () {
                var selectedSeasons = checkboxes.filter(function (c) { return c.checked; })
                    .map(function (c) { return parseInt(c.value); });
                if (selectedSeasons.length === 0) { alert('Select at least one season.'); return; }
                submitRequest(modal, req4kTvBtn, { mediaType: 'tv', mediaId: tmdbId, is4k: true, seasons: selectedSeasons });
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
        fetch((S.url || '') + '/Items?IncludeItemTypes=' + typeParam +
            '&AnyProviderIdEquals=tmdb.' + payload.mediaId + '&Recursive=true&Fields=Id', {
            headers: getAuthHeaders()
        }).then(function (r) { return r.ok ? safeJson(r) : null; })
            .then(function (d) {
                var items = d && d.Items;
                if (!items || !items.length) return;
                return fetch((S.url || '') + '/Users/' + S.uid + '/FavoriteItems/' + items[0].Id, {
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

    console.log('[LatestMedia] seerr-integration loaded (v3.0.3)');
})();
