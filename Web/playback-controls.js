/**
 * playback-controls.js — v3.1.0.0
 * Auto Pause / Auto Resume / Auto Picture-in-Picture on Tab Switch
 * Lazy-loaded by latestmedia.js bootloader only when any of the 3 toggles are enabled.
 *
 * Performance: minimal event listeners, zero polling, zero DOM observers.
 *
 * PIP NOTE (v3.1.0):
 *  This implementation exactly mirrors Jellyfin Enhanced's events.js logic.
 *  JE does NOT track user gestures separately. It simply:
 *   1. Pauses the video (if autoPause enabled)
 *   2. Requests PiP (if autoPip enabled, unconditionally)
 *  Chrome's visibilitychange IS a trusted event context for requestPictureInPicture.
 *  The previous _hasUserGesture gate was a false negative that blocked PiP entirely.
 */
(function () {
    'use strict';

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
            // ── Tab is now hidden ── (mirrors JE events.js exactly)

            // 1. Auto Pause first
            if (cfg.AutoPauseEnabled && !video.paused) {
                video.pause();
                video.dataset[DATA_KEY] = 'true';
            }

            // 2. Auto PiP after pause (JE does it this way — Chrome allows PiP from visibilitychange)
            if (cfg.AutoPipEnabled && !document.pictureInPictureElement) {
                video.requestPictureInPicture().catch(function (err) {
                    console.debug('[LatestMedia] PIP request failed:', err.name, '-', err.message);
                });
            }

        } else {
            // ── Tab is visible again ── (mirrors JE events.js exactly)

            // 1. Resume if we paused it
            if (video.paused && video.dataset[DATA_KEY] === 'true' && cfg.AutoResumeEnabled) {
                video.play().catch(function () {});
            }
            delete video.dataset[DATA_KEY];

            // 2. Exit PiP when returning to tab
            if (cfg.AutoPipEnabled && document.pictureInPictureElement) {
                document.exitPictureInPicture().catch(function () {});
            }
        }
    }

    function register() {
        if (REGISTERED) return;
        REGISTERED = true;
        document.addEventListener('visibilitychange', onVisibilityChange);
        console.log('[LatestMedia] playback-controls: registered');
    }

    register();

    // Re-register via shared observer (mostly to pick up new video elements)
    if (window.__latestMediaObserver) {
        window.__latestMediaObserver.register('playback-controls-init', function () {
            register();
        });
    }

    console.log('[LatestMedia] playback-controls loaded (v3.1.0)');
})();
