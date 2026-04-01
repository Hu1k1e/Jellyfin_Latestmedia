/**
 * playback-controls.js — v3.0.0.0
 * Auto Pause / Auto Resume / Auto Picture-in-Picture on Tab Switch
 * Lazy-loaded by latestmedia.js bootloader only when any of the 3 toggles are enabled.
 *
 * Performance: 1 event listener, zero polling, zero DOM observers.
 * Fires only when the user switches browser tabs.
 */
(function () {
    'use strict';

    const cfg = window.__latestMediaConfig || {};

    // Guard: if all 3 features are off, nothing to do
    if (!cfg.AutoPauseEnabled && !cfg.AutoResumeEnabled && !cfg.AutoPipEnabled) return;

    const DATA_KEY = 'lmWasPlayingBeforeHidden';

    document.addEventListener('visibilitychange', function () {
        const video = document.querySelector('video');
        if (!video) return;

        if (document.hidden) {
            // Tab hidden
            if (cfg.AutoPauseEnabled && !video.paused) {
                video.pause();
                video.dataset[DATA_KEY] = 'true';
            }
            if (cfg.AutoPipEnabled && !document.pictureInPictureElement && document.pictureInPictureEnabled) {
                video.requestPictureInPicture().catch(function (err) {
                    // PIP may be blocked by browser policy — ignore silently
                });
            }
        } else {
            // Tab visible again
            if (cfg.AutoResumeEnabled && video.paused && video.dataset[DATA_KEY] === 'true') {
                video.play().catch(function () {});
            }
            delete video.dataset[DATA_KEY];

            if (cfg.AutoPipEnabled && document.pictureInPictureElement) {
                document.exitPictureInPicture().catch(function () {});
            }
        }
    });

    console.log('[LatestMedia] playback-controls loaded (pause=' + cfg.AutoPauseEnabled +
        ', resume=' + cfg.AutoResumeEnabled + ', pip=' + cfg.AutoPipEnabled + ')');
})();
