/**
 * branding.js — v3.0.0.0
 * Config page logic for custom branding image upload/preview/delete.
 * Only loaded by configPage.html (admin settings page), never during normal browsing.
 *
 * Supports: click-to-upload from computer, drag-and-drop, image preview with dimensions,
 * trash/delete button, page-load status check.
 */
(function () {
    'use strict';

    var BRANDING_TYPES = ['icon-transparent', 'favicon', 'banner-light', 'banner-dark'];

    function getApiHeaders() {
        if (!window.ApiClient) return {};
        var token = ApiClient.accessToken();
        var t = 'MediaBrowser Client="Jellyfin Web", Device="Dashboard", DeviceId="BrandingCfg", Version="1.0.0", Token="' + token + '"';
        return { 'Authorization': t, 'X-Emby-Authorization': t };
    }

    // ── Status Check (on page load) ──────────────────────────────────────────

    function checkBrandingStatus() {
        fetch('/Branding/Status', { headers: getApiHeaders() })
            .then(function (r) { return r.json(); })
            .then(function (status) {
                if (status.iconTransparent) setPreviewFromServer('icon-transparent');
                if (status.favicon) setPreviewFromServer('favicon');
                if (status.bannerLight) setPreviewFromServer('banner-light');
                if (status.bannerDark) setPreviewFromServer('banner-dark');
            })
            .catch(function () {});
    }

    function setPreviewFromServer(type) {
        var zone = document.querySelector('[data-branding-type="' + type + '"]');
        if (!zone) return;
        var img = new Image();
        img.onload = function () {
            showPreview(zone, img.src, img.naturalWidth, img.naturalHeight);
        };
        img.src = '/Branding/' + type + '?t=' + Date.now();
    }

    // ── Upload Zones Setup ───────────────────────────────────────────────────

    function setupZone(zone) {
        var type = zone.getAttribute('data-branding-type');
        var fileInput = zone.querySelector('input[type="file"]');
        var uploadArea = zone.querySelector('.lm-upload-area');
        var deleteBtn = zone.querySelector('.lm-upload-delete');

        if (!fileInput || !uploadArea) return;

        // Click to open file picker
        uploadArea.addEventListener('click', function (e) {
            if (e.target === deleteBtn || deleteBtn && deleteBtn.contains(e.target)) return;
            fileInput.click();
        });

        // File picker change
        fileInput.addEventListener('change', function () {
            if (fileInput.files && fileInput.files[0]) {
                uploadFile(zone, type, fileInput.files[0]);
            }
        });

        // Drag-and-drop
        uploadArea.addEventListener('dragover', function (e) {
            e.preventDefault();
            uploadArea.classList.add('lm-drag-over');
        });
        uploadArea.addEventListener('dragleave', function () {
            uploadArea.classList.remove('lm-drag-over');
        });
        uploadArea.addEventListener('drop', function (e) {
            e.preventDefault();
            uploadArea.classList.remove('lm-drag-over');
            var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            if (file) uploadFile(zone, type, file);
        });

        // Delete button
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                deleteBrandingImage(zone, type);
            });
        }
    }

    // ── File Upload ──────────────────────────────────────────────────────────

    function uploadFile(zone, type, file) {
        // Validate size
        if (file.size > 10 * 1024 * 1024) {
            showZoneError(zone, 'File exceeds 10MB limit.');
            return;
        }

        var formData = new FormData();
        formData.append('file', file);

        setZoneLoading(zone, true);

        var headers = getApiHeaders();
        // Don't set Content-Type — browser sets it with multipart boundary

        fetch('/Branding/' + type, {
            method: 'POST',
            headers: headers,
            body: formData
        })
        .then(function (r) {
            if (!r.ok) throw new Error(r.status);
            // Show preview using FileReader
            var reader = new FileReader();
            reader.onload = function (ev) {
                var img = new Image();
                img.onload = function () {
                    showPreview(zone, ev.target.result, img.naturalWidth, img.naturalHeight);
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        })
        .catch(function (err) {
            showZoneError(zone, 'Upload failed: ' + err.message);
        })
        .finally(function () {
            setZoneLoading(zone, false);
        });
    }

    // ── Delete Image ─────────────────────────────────────────────────────────

    function deleteBrandingImage(zone, type) {
        if (!confirm('Delete this branding image? Jellyfin\'s default will be restored.')) return;

        fetch('/Branding/' + type, { method: 'DELETE', headers: getApiHeaders() })
            .then(function (r) {
                if (!r.ok) throw new Error(r.status);
                clearPreview(zone);
            })
            .catch(function (err) {
                showZoneError(zone, 'Delete failed: ' + err.message);
            });
    }

    // ── UI Helpers ───────────────────────────────────────────────────────────

    function showPreview(zone, src, w, h) {
        var uploadArea = zone.querySelector('.lm-upload-area');
        var placeholder = zone.querySelector('.lm-upload-placeholder');
        var preview = zone.querySelector('.lm-upload-preview');
        var previewImg = preview && preview.querySelector('img');
        var dimEl = preview && preview.querySelector('.lm-upload-dims');
        var deleteBtn = zone.querySelector('.lm-upload-delete');

        if (placeholder) placeholder.style.display = 'none';
        if (preview) preview.style.display = 'flex';
        if (previewImg) previewImg.src = src;
        if (dimEl) dimEl.textContent = w + ' × ' + h + 'px';
        if (deleteBtn) deleteBtn.style.display = 'inline-flex';
        if (uploadArea) uploadArea.classList.add('lm-has-image');
    }

    function clearPreview(zone) {
        var placeholder = zone.querySelector('.lm-upload-placeholder');
        var preview = zone.querySelector('.lm-upload-preview');
        var previewImg = preview && preview.querySelector('img');
        var deleteBtn = zone.querySelector('.lm-upload-delete');
        var uploadArea = zone.querySelector('.lm-upload-area');
        var fileInput = zone.querySelector('input[type="file"]');

        if (placeholder) placeholder.style.display = 'flex';
        if (preview) { preview.style.display = 'none'; }
        if (previewImg) previewImg.src = '';
        if (deleteBtn) deleteBtn.style.display = 'none';
        if (uploadArea) uploadArea.classList.remove('lm-has-image');
        if (fileInput) fileInput.value = '';
    }

    function setZoneLoading(zone, loading) {
        var uploadArea = zone.querySelector('.lm-upload-area');
        if (!uploadArea) return;
        if (loading) {
            uploadArea.style.opacity = '0.5';
            uploadArea.style.pointerEvents = 'none';
        } else {
            uploadArea.style.opacity = '';
            uploadArea.style.pointerEvents = '';
        }
    }

    function showZoneError(zone, msg) {
        var errEl = zone.querySelector('.lm-upload-error');
        if (!errEl) {
            errEl = document.createElement('div');
            errEl.className = 'lm-upload-error';
            errEl.style.cssText = 'color:#ef5350;font-size:0.8em;margin-top:4px;';
            zone.appendChild(errEl);
        }
        errEl.textContent = msg;
        setTimeout(function () { errEl.textContent = ''; }, 4000);
    }

    // ── Init ─────────────────────────────────────────────────────────────────

    function init() {
        document.querySelectorAll('[data-branding-type]').forEach(setupZone);
        checkBrandingStatus();
    }

    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('[LatestMedia] branding.js loaded (config page)');
})();
