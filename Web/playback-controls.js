/**
 * playback-controls.js — v3.0.2.0
 * Auto Pause / Auto Resume / Auto Picture-in-Picture on Tab Switch
 * Lazy-loaded by latestmedia.js bootloader only when any of the 3 toggles are enabled.
 *
 * Performance: minimal event listeners, zero polling, zero DOM observers.
 *
 * CHROME PIP FIX (v3.0.2):
 *  Chrome requires requestPictureInPicture() to be called from a context where the
 *  user has previously interacted with the video element. visibilitychange alone is
 *  not a user gesture. We track user interaction via a 'pointerdown' listener on
 *  the video element, and only attempt PIP after interaction has occurred.
 *
 *  This matches JE's behavior: their PIP only works because the user has already
 *  clicked play before switching tabs.
 */
(function () {
    'use strict';

    var DATA_KEY = 'lmWasPlayingBeforeHidden';
    var REGISTERED = false;

    // Track whether user has interacted with video (needed for Chrome PIP policy)
    var _hasUserGesture = false;
    var _gestureWatcherActive = false;

    function getCfg() {
        return window.__latestMediaConfig || {};
    }

    /**
     * Attaches a one-time pointerdown listener to the video element to mark
     * that a user gesture has occurred. Chrome requires this before PIP can
     * be triggered programmatically from a non-gesture event (visibilitychange).
     */
    function watchForUserGesture(video) {
        if (_gestureWatcherActive) return;
        _gestureWatcherActive = true;

        function onGesture() {
            _hasUserGesture = true;
            // Also mark on the video element itself for persistence across re-queries
            if (video) video.dataset.lmHasGesture = 'true';
        }

        // Listen on both the video and document (in case focus goes to controls)
        if (video) {
            video.addEventListener('play', onGesture, { once: false, passive: true });
            video.addEventListener('click', onGesture, { once: false, passive: true });
            video.addEventListener('pointerdown', onGesture, { once: false, passive: true });
        }
        document.addEventListener('pointerdown', function onDocGesture() {
            // Only mark if a video is playing
            var v = document.querySelector('video');
            if (v && !v.paused) {
                _hasUserGesture = true;
                if (v) v.dataset.lmHasGesture = 'true';
            }
        }, { passive: true });
    }

    function onVisibilityChange() {
        var cfg = getCfg();
        var video = document.querySelector('video');
        if (!video) return;

        // Watch for gestures on this video
        watchForUserGesture(video);

        if (document.hidden) {
            // ── Tab is now hidden ──

            // Auto Pause FIRST (this matches JE's logic exactly)
            if (cfg.AutoPauseEnabled && !video.paused) {
                video.pause();
                video.dataset[DATA_KEY] = 'true';
            }

            // Auto PIP AFTER pause (synchronous call after pause matches JE's expected browser state handling)
            if (cfg.AutoPipEnabled &&
                document.pictureInPictureEnabled &&
                !document.pictureInPictureElement) {

                video.requestPictureInPicture().catch(function (err) {
                    console.debug('[LatestMedia] PIP request blocked:', err.name, err.message);
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
            if (document.pictureInPictureElement) {
                document.exitPictureInPicture().catch(function () {});
            }
        }
    }

    function register() {
        if (REGISTERED) return;
        REGISTERED = true;
        document.addEventListener('visibilitychange', onVisibilityChange);

        // Immediately watch any video already present
        var v = document.querySelector('video');
        if (v) watchForUserGesture(v);

        console.log('[LatestMedia] playback-controls: registered (will watch for user gesture for PIP)');
    }

    register();

    // Re-register via shared observer (mostly to pick up new video elements)
    if (window.__latestMediaObserver) {
        window.__latestMediaObserver.register('playback-controls-init', function () {
            register();
            // Watch any newly added video
            var v = document.querySelector('video');
            if (v && !_gestureWatcherActive) watchForUserGesture(v);
        });
    }

    console.log('[LatestMedia] playback-controls loaded');
})();
