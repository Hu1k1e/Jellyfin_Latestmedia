/**
 * inject.js — Latest Media & Management Plugin
 *
 * This tiny script is inlined into Jellyfin's index.html by the
 * File Transformation Plugin at startup.
 *
 * It dynamically loads latestmedia.js from the plugin's embedded
 * resource endpoint, so it runs on every page without manual configuration.
 */
(function () {
    'use strict';

    // The plugin exposes latestmedia.js via Plugin.cs → GetPages()
    // at /web/ConfigurationPage?name=latestmedia.js
    var scriptUrl = '/web/ConfigurationPage?name=latestmedia.js';

    function loadScript(src) {
        var s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onerror = function () {
            console.warn('[LatestMedia] Failed to load', src);
        };
        document.head.appendChild(s);
    }

    // Load immediately — the DOMContentLoaded guarantee comes from the
    // <script defer> wrapper injected by TransformationPatches.cs
    loadScript(scriptUrl);
})();
