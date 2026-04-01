/**
 * arr-integration.js — v3.1.0.0
 * *arr Integration frontend: Quick Links, Tag Links, Active Downloads page.
 *
 * Performance contract:
 *  - Zero polling. All updates driven by hashchange + debounced MutationObserver.
 *  - Observer watches only class attribute changes on #itemDetailPage scope.
 *  - Quick Links and Tag Links share a single observer.
 *  - Downloads page fetches on demand only (when user opens the page).
 *  - All fetch calls have explicit timeouts via AbortController.
 */
(function () {
    'use strict';

    var cfg = window.__latestMediaConfig || {};
    if (!cfg.ArrLinksEnabled && !cfg.ArrTagsShowAsLinks && !cfg.ArrDownloadsEnabled) return;

    var BASE_PATH = '/web/ConfigurationPage?name=LatestMediaUI';

    // ── Helpers ───────────────────────────────────────────────────────────────

    function getAuthHeader() {
        var S = window.__latestMediaState;
        if (S && S.tok) {
            return 'MediaBrowser Client="Jellyfin Web", Device="Plugin", DeviceId="' +
                (S.dev || 'LMArr1') + '", Version="1.0.0", Token="' + S.tok + '"';
        }
        if (window.ApiClient && ApiClient.accessToken) {
            var token = ApiClient.accessToken();
            return 'MediaBrowser Client="Jellyfin Web", Device="Plugin", DeviceId="LMArr1", Version="1.0.0", Token="' + token + '"';
        }
        return '';
    }

    function fetchJson(url, timeoutMs) {
        timeoutMs = timeoutMs || 8000;
        var ctrl = new AbortController();
        var tid = setTimeout(function () { ctrl.abort(); }, timeoutMs);
        return fetch(url, {
            headers: { 'Authorization': getAuthHeader() },
            signal: ctrl.signal
        }).then(function (r) {
            clearTimeout(tid);
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).catch(function (err) {
            clearTimeout(tid);
            throw err;
        });
    }

    function slugify(text) {
        if (!text) return '';
        return text.toString()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/&/g, 'and').toLowerCase().trim()
            .replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-').replace(/^-+|-+$/g, '');
    }

    function injectStyles(id, css) {
        if (!document.getElementById(id)) {
            var s = document.createElement('style');
            s.id = id;
            s.textContent = css;
            document.head.appendChild(s);
        }
    }

    // ── Inject shared CSS ─────────────────────────────────────────────────────

    injectStyles('lm-arr-styles', [
        /* Quick Link buttons */
        '.lm-arr-link { display:inline-flex; align-items:center; gap:5px; }',
        '.lm-arr-link::before { content:""; display:inline-block; width:18px; height:18px; background-size:contain; background-repeat:no-repeat; vertical-align:middle; }',
        '.lm-arr-link.sonarr::before { background-image:url(https://cdn.jsdelivr.net/gh/selfhst/icons/svg/sonarr.svg); }',
        '.lm-arr-link.radarr::before { background-image:url(https://cdn.jsdelivr.net/gh/selfhst/icons/svg/radarr-light-hybrid-light.svg); }',
        '.lm-arr-link.bazarr::before { background-image:url(https://cdn.jsdelivr.net/gh/selfhst/icons/svg/bazarr.svg); }',
        /* Tag Links */
        '.lm-arr-tag { display:inline-flex; align-items:center; gap:4px; font-size:0.82em; padding:2px 8px; border-radius:4px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); cursor:pointer; text-decoration:none; color:inherit; }',
        '.lm-arr-tag:hover { background:rgba(255,255,255,0.14); }',
        /* Downloads page */
        '#lm-arr-downloads { padding:16px 3vw; max-width:1100px; margin:0 auto; }',
        '#lm-arr-downloads h2 { font-size:1.1em; font-weight:700; margin:0 0 14px; letter-spacing:.02em; }',
        '.lm-arr-section { margin-bottom:28px; }',
        '.lm-arr-section-title { font-size:0.9em; font-weight:700; opacity:0.6; text-transform:uppercase; letter-spacing:.06em; margin-bottom:10px; display:flex; align-items:center; gap:8px; }',
        '.lm-arr-section-title::before { content:""; display:inline-block; width:14px; height:14px; background-size:contain; background-repeat:no-repeat; }',
        '.lm-arr-section-title.sonarr::before { background-image:url(https://cdn.jsdelivr.net/gh/selfhst/icons/svg/sonarr.svg); }',
        '.lm-arr-section-title.radarr::before { background-image:url(https://cdn.jsdelivr.net/gh/selfhst/icons/svg/radarr-light-hybrid-light.svg); }',
        '.lm-arr-queue-table { width:100%; border-collapse:collapse; font-size:0.85em; }',
        '.lm-arr-queue-table th { text-align:left; padding:6px 10px; opacity:0.5; font-weight:600; font-size:0.8em; text-transform:uppercase; letter-spacing:.04em; border-bottom:1px solid rgba(255,255,255,0.08); }',
        '.lm-arr-queue-table td { padding:8px 10px; border-bottom:1px solid rgba(255,255,255,0.05); vertical-align:middle; }',
        '.lm-arr-queue-table tr:last-child td { border-bottom:none; }',
        '.lm-arr-badge { display:inline-block; padding:2px 7px; border-radius:4px; font-size:0.75em; font-weight:700; }',
        '.lm-arr-badge.downloading { background:rgba(33,150,243,0.25); color:#64b5f6; }',
        '.lm-arr-badge.queued { background:rgba(255,152,0,0.2); color:#ffb74d; }',
        '.lm-arr-badge.completed { background:rgba(0,179,90,0.2); color:#4caf91; }',
        '.lm-arr-badge.failed { background:rgba(239,83,80,0.2); color:#ef9a9a; }',
        '.lm-arr-badge.importing { background:rgba(156,39,176,0.2); color:#ce93d8; }',
        '.lm-arr-progress { height:4px; background:rgba(255,255,255,0.1); border-radius:2px; overflow:hidden; min-width:80px; }',
        '.lm-arr-progress-bar { height:100%; background:#2196f3; border-radius:2px; transition:width 0.3s; }',
        '.lm-arr-empty { opacity:0.45; font-size:0.85em; padding:12px 0; }',
        '.lm-arr-refresh { display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:6px; border:1px solid rgba(255,255,255,0.15); background:rgba(255,255,255,0.07); cursor:pointer; font-size:0.82em; font-weight:600; color:inherit; margin-bottom:20px; }',
        '.lm-arr-refresh:hover { background:rgba(255,255,255,0.12); }',
        '.lm-arr-refresh .material-icons { font-size:15px; }',
    ].join('\n'));

    // ── Quick Links ───────────────────────────────────────────────────────────

    var _quickLinksLock = false;
    var _quickLinksCache = new Map();

    function initQuickLinks() {
        if (!cfg.ArrLinksEnabled) return;

        // Admin check
        ApiClient.getCurrentUser().then(function (user) {
            if (!user || !user.Policy || !user.Policy.IsAdministrator) return;
            startQuickLinksObserver();
        }).catch(function () {});
    }

    function startQuickLinksObserver() {
        var debounce = null;
        var obs = new MutationObserver(function () {
            clearTimeout(debounce);
            debounce = setTimeout(tryAddQuickLinks, 120);
        });
        obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        window.addEventListener('hashchange', function () {
            clearTimeout(debounce);
            debounce = setTimeout(tryAddQuickLinks, 250);
        });
        setTimeout(tryAddQuickLinks, 500);
    }

    function tryAddQuickLinks() {
        if (_quickLinksLock) return;
        var page = document.querySelector('#itemDetailPage:not(.hide)');
        if (!page) return;
        var anchor = page.querySelector('.itemExternalLinks');
        if (!anchor) return;
        if (anchor.querySelector('.lm-arr-link')) return;

        var itemId = null;
        try { itemId = new URLSearchParams(window.location.hash.split('?')[1]).get('id'); } catch (e) {}
        if (!itemId) return;

        _quickLinksLock = true;
        resolveItem(itemId).then(function (item) {
            if (!item || (item.Type !== 'Movie' && item.Type !== 'Series')) return;
            var sonarrUrl = cfg.SonarrUrl ? cfg.SonarrUrl.replace(/\/$/, '') : '';
            var radarrUrl = cfg.RadarrUrl ? cfg.RadarrUrl.replace(/\/$/, '') : '';
            var bazarrUrl = cfg.BazarrUrl ? cfg.BazarrUrl.replace(/\/$/, '') : '';

            if (item.Type === 'Series' && sonarrUrl) {
                getSonarrSlug(item).then(function (slug) {
                    appendLink(anchor, 'Sonarr', sonarrUrl + '/series/' + slug, 'sonarr');
                });
            }
            if (item.Type === 'Movie' && radarrUrl) {
                var tmdbId = getTmdbId(page);
                if (tmdbId) appendLink(anchor, 'Radarr', radarrUrl + '/movie/' + tmdbId, 'radarr');
            }
            if (bazarrUrl) {
                var bazPath = item.Type === 'Series' ? '/series/' : '/movies/';
                appendLink(anchor, 'Bazarr', bazarrUrl + bazPath, 'bazarr');
            }
        }).finally(function () { _quickLinksLock = false; });
    }

    function appendLink(container, label, url, cls) {
        container.appendChild(document.createTextNode(' '));
        var a = document.createElement('a');
        a.setAttribute('is', 'emby-linkbutton');
        a.className = 'button-link emby-button lm-arr-link ' + cls;
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.title = label;
        a.textContent = label;
        container.appendChild(a);
    }

    function resolveItem(itemId) {
        if (_quickLinksCache.has(itemId)) return Promise.resolve(_quickLinksCache.get(itemId));
        return ApiClient.getItem(ApiClient.getCurrentUserId(), itemId).then(function (item) {
            _quickLinksCache.set(itemId, item);
            return item;
        });
    }

    function getTmdbId(page) {
        var links = page.querySelectorAll('.itemExternalLinks a, .externalIdLinks a');
        for (var i = 0; i < links.length; i++) {
            var m = links[i].href.match(/themoviedb\.org\/movie\/(\d+)/);
            if (m) return m[1];
        }
        return null;
    }

    var _slugCache = new Map();
    function getSonarrSlug(item) {
        var tvdbId = (item.ProviderIds && item.ProviderIds.Tvdb) ? String(item.ProviderIds.Tvdb) : '';
        if (tvdbId && _slugCache.has(tvdbId)) return Promise.resolve(_slugCache.get(tvdbId));
        var fallback = slugify(item.OriginalTitle || item.Name);
        if (!tvdbId) return Promise.resolve(fallback);

        return fetchJson('/Arr/SeriesSlug?tvdbId=' + encodeURIComponent(tvdbId)).then(function (data) {
            var slug = (data && data.titleSlug) ? data.titleSlug : fallback;
            _slugCache.set(tvdbId, slug);
            return slug;
        }).catch(function () { return fallback; });
    }

    // ── Tag Links ─────────────────────────────────────────────────────────────

    var _tagLinksLock = false;
    var _tagLinksProcessed = new Set();

    function initTagLinks() {
        if (!cfg.ArrTagsShowAsLinks) return;
        var debounce = null;
        var obs = new MutationObserver(function () {
            clearTimeout(debounce);
            debounce = setTimeout(tryAddTagLinks, 120);
        });
        obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
        window.addEventListener('hashchange', function () {
            clearTimeout(debounce);
            _tagLinksProcessed = new Set(); // Reset on navigation
            debounce = setTimeout(tryAddTagLinks, 250);
        });
        setTimeout(tryAddTagLinks, 600);
    }

    function tryAddTagLinks() {
        if (_tagLinksLock) return;
        var page = document.querySelector('#itemDetailPage:not(.hide)');
        if (!page) return;
        var anchor = page.querySelector('.itemExternalLinks');
        if (!anchor) return;

        var itemId = null;
        try { itemId = new URLSearchParams(window.location.hash.split('?')[1]).get('id'); } catch (e) {}
        if (!itemId || _tagLinksProcessed.has(itemId)) return;
        if (anchor.querySelector('[data-lm-tag-item="' + itemId + '"]')) return;

        _tagLinksLock = true;
        ApiClient.getItem(ApiClient.getCurrentUserId(), itemId).then(function (item) {
            var prefix = cfg.ArrTagsPrefix || 'arr:';
            if (!item || !item.Tags || item.Tags.length === 0) { _tagLinksProcessed.add(itemId); return; }
            var relevant = item.Tags.filter(function (t) { return t.startsWith(prefix); });
            if (relevant.length === 0) { _tagLinksProcessed.add(itemId); return; }

            var serverId = ApiClient.serverId();
            relevant.forEach(function (tag) {
                anchor.appendChild(document.createTextNode(' '));
                var a = document.createElement('a');
                a.className = 'lm-arr-tag';
                a.dataset.lmTagItem = itemId;
                a.title = 'Filter by tag: ' + tag;
                a.textContent = tag.slice(prefix.length).trim();
                a.addEventListener('click', function (e) {
                    e.preventDefault();
                    var url = 'list.html?type=tag&tag=' + encodeURIComponent(tag) + '&serverId=' + serverId;
                    window.location.hash = '!/' + url;
                });
                anchor.appendChild(a);
            });
            _tagLinksProcessed.add(itemId);
        }).catch(function () {
            _tagLinksProcessed.add(itemId);
        }).finally(function () { _tagLinksLock = false; });
    }

    // ── Active Downloads Page ─────────────────────────────────────────────────

    var _downloadsRendered = false;

    function initDownloadsPage() {
        if (!cfg.ArrDownloadsEnabled) return;

        // Hook into hashchange to detect when the downloads page is shown
        window.addEventListener('hashchange', checkRenderDownloads);
        // Also check immediately (in case page loads direct to this hash)
        setTimeout(checkRenderDownloads, 300);
    }

    function checkRenderDownloads() {
        var hash = window.location.hash;
        if (hash !== '#/lm-arr-downloads' && hash !== '#/lm-arr-downloads.html') return;
        renderDownloadsPage();
    }

    function renderDownloadsPage() {
        // Use the Jellyfin SPA's main content area
        var target = document.querySelector('.mainAnimatedPages .page:not(.hide) .content-primary')
            || document.querySelector('.mainAnimatedPages')
            || document.body;

        // Clear existing
        var existing = document.getElementById('lm-arr-downloads-wrapper');
        if (existing) existing.remove();

        var wrapper = document.createElement('div');
        wrapper.id = 'lm-arr-downloads-wrapper';
        wrapper.style.cssText = 'position:fixed;inset:0;z-index:9000;overflow-y:auto;background:rgba(0,0,0,0.82);padding:60px 0 20px;';

        var inner = document.createElement('div');
        inner.id = 'lm-arr-downloads';

        // Header row
        var hdr = document.createElement('div');
        hdr.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;';
        var title = document.createElement('h2');
        title.textContent = 'Active Downloads';
        title.style.margin = '0';

        var refreshBtn = document.createElement('button');
        refreshBtn.className = 'lm-arr-refresh';
        refreshBtn.innerHTML = '<span class="material-icons">refresh</span> Refresh';
        refreshBtn.onclick = function () { loadQueue(inner); };

        var closeBtn = document.createElement('button');
        closeBtn.className = 'lm-arr-refresh';
        closeBtn.style.marginLeft = '8px';
        closeBtn.innerHTML = '<span class="material-icons">close</span> Close';
        closeBtn.onclick = function () {
            wrapper.remove();
            history.back();
        };

        var btnGroup = document.createElement('div');
        btnGroup.style.display = 'flex';
        btnGroup.appendChild(refreshBtn);
        btnGroup.appendChild(closeBtn);

        hdr.appendChild(title);
        hdr.appendChild(btnGroup);
        inner.appendChild(hdr);

        var content = document.createElement('div');
        content.id = 'lm-arr-downloads-content';
        content.innerHTML = '<div class="lm-arr-empty">Loading...</div>';
        inner.appendChild(content);

        wrapper.appendChild(inner);
        document.body.appendChild(wrapper);

        loadQueue(inner);
    }

    function loadQueue(container) {
        var content = container.querySelector('#lm-arr-downloads-content') || container;
        content.innerHTML = '<div class="lm-arr-empty">Fetching downloads...</div>';

        fetchJson('/Arr/Queue').then(function (data) {
            content.innerHTML = '';

            var sonarrItems = Array.isArray(data.sonarr) ? data.sonarr : [];
            var radarrItems = Array.isArray(data.radarr) ? data.radarr : [];

            if (sonarrItems.length === 0 && radarrItems.length === 0) {
                content.innerHTML = '<div class="lm-arr-empty">No active downloads in Sonarr or Radarr.</div>';
                return;
            }

            if (sonarrItems.length > 0) {
                content.appendChild(buildQueueSection('sonarr', 'Sonarr', sonarrItems, function (item) {
                    return item.series ? item.series.title + (item.episode ? ' S' + pad2(item.episode.seasonNumber) + 'E' + pad2(item.episode.episodeNumber) : '') : (item.title || 'Unknown');
                }));
            }

            if (radarrItems.length > 0) {
                content.appendChild(buildQueueSection('radarr', 'Radarr', radarrItems, function (item) {
                    return item.movie ? item.movie.title : (item.title || 'Unknown');
                }));
            }

            // Optional requests section (Jellyseerr)
            if (cfg.ArrDownloadsShowRequests && cfg.JellyseerrEnabled) {
                content.appendChild(buildRequestsSection());
            }

        }).catch(function (err) {
            content.innerHTML = '<div class="lm-arr-empty" style="color:#ef9a9a;">Failed to load queue: ' + err.message + '</div>';
        });
    }

    function buildQueueSection(cls, label, items, getTitleFn) {
        var section = document.createElement('div');
        section.className = 'lm-arr-section';

        var title = document.createElement('div');
        title.className = 'lm-arr-section-title ' + cls;
        title.textContent = label + ' (' + items.length + ')';
        section.appendChild(title);

        var table = document.createElement('table');
        table.className = 'lm-arr-queue-table';
        table.innerHTML = '<thead><tr><th>Title</th><th>Size</th><th>Progress</th><th>Status</th><th>Protocol</th></tr></thead>';
        var tbody = document.createElement('tbody');

        items.forEach(function (item) {
            var tr = document.createElement('tr');
            var pct = item.sizeleft != null && item.size > 0 ? Math.round((1 - item.sizeleft / item.size) * 100) : 0;
            var statusLower = (item.status || '').toLowerCase();
            var badgeCls = statusLower === 'downloading' ? 'downloading'
                : statusLower === 'completed' ? 'completed'
                : statusLower === 'failed' ? 'failed'
                : statusLower === 'importing' ? 'importing'
                : 'queued';

            tr.innerHTML = [
                '<td>' + escHtml(getTitleFn(item)) + '</td>',
                '<td>' + fmtSize(item.size) + '</td>',
                '<td><div class="lm-arr-progress"><div class="lm-arr-progress-bar" style="width:' + pct + '%"></div></div><span style="font-size:0.75em;opacity:0.6;margin-left:6px;">' + pct + '%</span></td>',
                '<td><span class="lm-arr-badge ' + badgeCls + '">' + escHtml(item.status || 'Unknown') + '</span></td>',
                '<td style="opacity:0.55;font-size:0.8em;">' + escHtml((item.protocol || '').toUpperCase()) + '</td>',
            ].join('');

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        section.appendChild(table);
        return section;
    }

    function buildRequestsSection() {
        var section = document.createElement('div');
        section.className = 'lm-arr-section';

        var title = document.createElement('div');
        title.className = 'lm-arr-section-title';
        title.textContent = 'Pending Requests';
        section.appendChild(title);

        var content = document.createElement('div');
        content.innerHTML = '<div class="lm-arr-empty">Loading requests...</div>';
        section.appendChild(content);

        // Pull from Jellyseerr proxy
        fetchJson('/Seerr/proxy?path=' + encodeURIComponent('/api/v1/request?filter=pending&take=50')).then(function (data) {
            var results = (data && data.results) ? data.results : [];
            if (results.length === 0) { content.innerHTML = '<div class="lm-arr-empty">No pending requests.</div>'; return; }
            var table = document.createElement('table');
            table.className = 'lm-arr-queue-table';
            table.innerHTML = '<thead><tr><th>Title</th><th>Type</th><th>Requested By</th><th>Status</th></tr></thead>';
            var tbody = document.createElement('tbody');
            results.forEach(function (req) {
                var tr = document.createElement('tr');
                var mediaTitle = (req.media && (req.media.originalTitle || req.media.title)) || req.type || 'Unknown';
                var reqBy = (req.requestedBy && req.requestedBy.displayName) ? req.requestedBy.displayName : 'Unknown';
                tr.innerHTML = [
                    '<td>' + escHtml(mediaTitle) + '</td>',
                    '<td style="text-transform:capitalize;opacity:0.7;">' + escHtml(req.type || '') + '</td>',
                    '<td style="opacity:0.7;">' + escHtml(reqBy) + '</td>',
                    '<td><span class="lm-arr-badge queued">' + escHtml(req.status || 'Pending') + '</span></td>',
                ].join('');
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            content.innerHTML = '';
            content.appendChild(table);
        }).catch(function () {
            content.innerHTML = '<div class="lm-arr-empty" style="opacity:0.4;">Could not load requests (Jellyseerr may not be configured).</div>';
        });

        return section;
    }

    // ── Sidebar Button ────────────────────────────────────────────────────────

    function addSidebarButton() {
        if (!cfg.ArrDownloadsEnabled) return;

        var obs = new MutationObserver(function () {
            var sidebar = document.querySelector('.mainDrawer, .navDrawer');
            if (!sidebar || document.getElementById('lm-arr-nav-btn')) return;

            var jellyfinEnhancedSection = sidebar.querySelector('.jellyfinEnhancedSection');
            if (!jellyfinEnhancedSection) {
                jellyfinEnhancedSection = document.createElement('div');
                jellyfinEnhancedSection.className = 'jellyfinEnhancedSection';
                jellyfinEnhancedSection.innerHTML = '<h3 class="sidebarHeader">Jellyfin Enhanced</h3>';

                var mediaSection = sidebar.querySelector('.libraryMenuOptions');
                if (mediaSection && mediaSection.parentNode) {
                    mediaSection.parentNode.insertBefore(jellyfinEnhancedSection, mediaSection);
                } else {
                    var container = sidebar.querySelector('.mainDrawer-scrollContainer, .scrollSlider') || sidebar;
                    container.appendChild(jellyfinEnhancedSection);
                }
            }

            var a = document.createElement('a');
            a.setAttribute('is', 'emby-linkbutton');
            a.className = 'navMenuOption lnkMediaFolder emby-button je-nav-downloads-item';
            a.id = 'lm-arr-nav-btn';
            a.href = '#/lm-arr-downloads';
            a.innerHTML = '<span class="material-icons navMenuOptionIcon" aria-hidden="true">download</span><span class="sectionName navMenuOptionText">Active Downloads</span>';
            
            jellyfinEnhancedSection.appendChild(a);
        });
        obs.observe(document.body, { childList: true, subtree: true });
    }

    // ── Utilities ─────────────────────────────────────────────────────────────

    function pad2(n) { return n < 10 ? '0' + n : '' + n; }

    function fmtSize(bytes) {
        if (!bytes) return '—';
        var gb = bytes / 1073741824;
        if (gb >= 1) return gb.toFixed(1) + ' GB';
        var mb = bytes / 1048576;
        if (mb >= 1) return Math.round(mb) + ' MB';
        return Math.round(bytes / 1024) + ' KB';
    }

    function escHtml(str) {
        return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    initQuickLinks();
    initTagLinks();
    initDownloadsPage();
    addSidebarButton();

    console.log('[LatestMedia] arr-integration loaded (v3.1.0)');
})();
