/**
 * star-ratings.js — community star rating badges on cards (lazy-loaded module).
 * Downloaded by latestmedia.js ONLY when "Show star rating on cards" is on.
 */
(function(){
'use strict';
if (window.__lmStarLoaded) return;
window.__lmStarLoaded = true;

// --- Feature 7: Star Ratings (JE ratingtags.js pattern) ---
var _starRatingObserver = null;
var _starProcessed = new WeakSet();
var _starPendingQueue = [];
var _starProcessing = false;
var _starDebounceTimer = null;
var STAR_DEBOUNCE_MS = 500;  // increased from 150ms — reduces scan frequency after each DOM change
var STAR_TAGGED_ATTR = 'data-lm-star-checked';
var STAR_CACHE = JSON.parse(sessionStorage.getItem('lmStarCache') || '{}');
var STAR_MEDIA_TYPES = { Movie: true, Series: true, Episode: true, Season: true };
var STAR_IGNORE_SELECTORS = [
    '#itemDetailPage .infoWrapper .cardImageContainer',
    '#itemDetailPage #castCollapsible .cardImageContainer',
    '#indexPage .verticalSection.MyMedia .cardImageContainer',
    '.formDialog .cardImageContainer',
    '#pluginsPage .cardImageContainer',
    '#pluginCatalogPage .cardImageContainer',
    '#devicesPage .cardImageContainer',
    '#mediaLibraryPage .cardImageContainer'
];

function _starShouldIgnore(el) {
    return STAR_IGNORE_SELECTORS.some(function(sel) {
        try { return el.matches(sel) || !!el.closest(sel); } catch(e) { return false; }
    });
}

function _starApplyTag(el, rating) {
    if (!rating) return;
    var existing = el.querySelector('.lm-star-rating-badge');
    if (existing) return; // already applied
    var badge = document.createElement('div');
    badge.className = 'lm-star-rating-badge';
    badge.innerHTML = '<span class="material-icons">star</span><span class="lm-star-text">' + parseFloat(rating).toFixed(1) + '</span>';
    el.appendChild(badge);
}

function _starProcessQueue() {
    if (_starProcessing || _starPendingQueue.length === 0 || !window.ApiClient) return;
    _starProcessing = true;
    
    // Batch up to 50 items natively via Jellyfin API
    var batch = _starPendingQueue.splice(0, 50);
    var userId = ApiClient.getCurrentUserId();
    
    var idsToFetch = [];
    var batchMap = {};
    batch.forEach(function(req) {
        batchMap[req.id] = req.element;
        if (STAR_CACHE[req.id] !== undefined) {
             _starApplyTag(req.element, STAR_CACHE[req.id]);
        } else {
             idsToFetch.push(req.id);
        }
    });

    if (idsToFetch.length === 0) {
        _starProcessing = false;
        if (_starPendingQueue.length > 0) _starProcessQueue();
        return;
    }

    ApiClient.ajax({
        type: 'GET',
        url: ApiClient.getUrl('/Users/' + userId + '/Items', {
            Ids: idsToFetch.join(','),
            Fields: 'CommunityRating'
        }),
        dataType: 'json'
    }).then(function(result) {
        if (result && result.Items) {
            result.Items.forEach(function(item) {
                var rating = item.CommunityRating != null ? item.CommunityRating : false;
                STAR_CACHE[item.Id] = rating;
                if (batchMap[item.Id]) _starApplyTag(batchMap[item.Id], rating);
            });
            // Mark any fetched IDs that didn't have CommunityRating as false to avoid refetching
            idsToFetch.forEach(function(id) {
                if (STAR_CACHE[id] === undefined) STAR_CACHE[id] = false;
            });
            sessionStorage.setItem('lmStarCache', JSON.stringify(STAR_CACHE));
        }
        _starProcessing = false;
        if (_starPendingQueue.length > 0) setTimeout(_starProcessQueue, 50);
    }).catch(function() {
        _starProcessing = false;
    });
}

function _starScanAndProcess() {
    if (document.hidden) return; // skip scan when tab is not visible
    document.querySelectorAll('.cardImageContainer:not([' + STAR_TAGGED_ATTR + '])').forEach(function(el) {
        if (_starProcessed.has(el)) return;
        if (_starShouldIgnore(el)) { el.setAttribute(STAR_TAGGED_ATTR, 'skip'); return; }
        el.setAttribute(STAR_TAGGED_ATTR, '1');
        _starProcessed.add(el);
        var card = el.closest('.card') || el;
        var itemId = card.getAttribute('data-id') || card.getAttribute('data-itemid');
        var itemType = card.getAttribute('data-type');
        if (!itemId || !itemType || !STAR_MEDIA_TYPES[itemType]) return;
        
        if (STAR_CACHE[itemId] !== undefined) {
            // Apply instantly from cache
            _starApplyTag(el, STAR_CACHE[itemId]);
        } else {
            _starPendingQueue.push({ id: itemId, element: el });
        }
    });
    if (_starPendingQueue.length > 0 && !_starProcessing) _starProcessQueue();
}

function _starDebouncedScan() {
    if (_starDebounceTimer) clearTimeout(_starDebounceTimer);
    _starDebounceTimer = setTimeout(_starScanAndProcess, STAR_DEBOUNCE_MS);
}

function initStarRatings() {
    if (_starRatingObserver) return;

    // Inject CSS - .cardImageContainer already has position:relative in Jellyfin
    var existingStyle = document.getElementById('lm-star-rating-css');
    if (existingStyle) existingStyle.remove();
    var style = document.createElement('style');
    style.id = 'lm-star-rating-css';
    style.textContent = [
        '.lm-star-rating-badge {',
        '  position: absolute; top: 6px; left: 6px;',
        '  display: inline-flex; align-items: center; gap: 4px;',
        '  padding: 4px 8px; background: rgba(0,0,0,0.82); color: #ffc107;',
        '  font-size: 12px; font-weight: 600; border-radius: 4px;',
        '  backdrop-filter: blur(4px); box-shadow: 0 2px 4px rgba(0,0,0,0.3);',
        '  white-space: nowrap; line-height: 1; pointer-events: none; z-index: 10;',
        '}',
        '.lm-star-rating-badge .material-icons { color: #ffc107 !important; font-size: 13px; line-height: 1; }',
        '.lm-star-text { line-height: 1; }',
        '@media (max-width: 768px) {',
        '  .lm-star-rating-badge { padding: 3px 5px; font-size: 11px; top: 4px; left: 4px; }',
        '  .lm-star-rating-badge .material-icons { font-size: 11px !important; }',
        '}'
    ].join('\n');
    document.head.appendChild(style);

    _starRatingObserver = new MutationObserver(_starDebouncedScan);
    _starRatingObserver.observe(document.body, { childList: true, subtree: true });

    // Initial scan after DOM settles
    setTimeout(_starScanAndProcess, 500);
}

// Prime the per-session cache from the server-side materialized ratings, then start scanning cards
(function bootStarRatings() {
  if (!window.ApiClient) return;
  ApiClient.ajax({
    type: 'GET',
    url: ApiClient.getUrl('/RatingsCache/Get'),
    dataType: 'json'
  }).then(function(dict) {
    if (dict) {
      Object.assign(STAR_CACHE, dict);
      sessionStorage.setItem('lmStarCache', JSON.stringify(STAR_CACHE));
    }
  }).catch(function(e) { console.debug('[LM] Failed to pull materialized rating cache:', e); });

  initStarRatings();
})();
})();
