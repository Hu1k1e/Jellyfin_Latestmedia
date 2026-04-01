/**
 * playback-controls.js — v3.0.1.0
 * Auto Pause / Auto Resume / Auto Picture-in-Picture on Tab Switch
 * Lazy-loaded by latestmedia.js bootloader only when any of the 3 toggles are enabled.
 *
 * Performance: 1 event listener, zero polling, zero DOM observers.
 * Fires only when the user switches browser tabs.
 *
 * FIX (v3.0.1): Config is now re-read from window.__latestMediaConfig at event time
 * instead of only at module load time. This ensures settings toggled in the config
 * page take effect without a full page reload.
 * Also mirrors JE events.js exactly: PIP check uses document.pictureInPictureElement
 * to decide whether to enter or exit pip — not entered twice.
 */
(function () {
    'use strict';

    // Check that at least one feature is enabled at load time to confirm bootloader intent.
    // Re-read config live at event time so changes take effect immediately.
    var DATA_KEY = 'lmWasPlayingBeforeHidden';
    var REGISTERED = false;

    function getCfg() {
        return window.__latestMediaConfig || {};
    }

    function onVisibilityChange() {
        var cfg = getCfg();
        var video = document.querySelector('video');
        if (!video) return;

        if (document.hidden) {
            // ── Tab is now hidden ──
            // Auto Pause
            if (cfg.AutoPauseEnabled && !video.paused) {
                video.pause();
                video.dataset[DATA_KEY] = 'true';
            }
            // Auto PIP — only enter if not already in PIP
            if (cfg.AutoPipEnabled && document.pictureInPictureEnabled && !document.pictureInPictureElement) {
                video.requestPictureInPicture().catch(function () {
                    // PIP may be blocked by browser security policy (requires user gesture) — ignore
                });
            }
        } else {
            // ── Tab is visible again ──
            // Auto Resume
            if (cfg.AutoResumeEnabled && video.paused && video.dataset[DATA_KEY] === 'true') {
                video.play().catch(function () {});
            }
            delete video.dataset[DATA_KEY];

            // Exit PIP when tab becomes visible again
            if (cfg.AutoPipEnabled && document.pictureInPictureElement) {
                document.exitPictureInPicture().catch(function () {});
            }
        }
    }

    function register() {
        if (REGISTERED) return;
        REGISTERED = true;
        document.addEventListener('visibilitychange', onVisibilityChange);
        console.log('[LatestMedia] playback-controls: visibilitychange listener registered');
    }

    // Register immediately
    register();

    // Also re-register via shared observer in case module loaded before DOM
    if (window.__latestMediaObserver) {
        window.__latestMediaObserver.register('playback-controls-init', register);
    }

    console.log('[LatestMedia] playback-controls loaded');
})();
