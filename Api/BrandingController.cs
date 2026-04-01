using System;
using System.IO;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin_Latestmedia.Api
{
    /// <summary>
    /// API controller for managing custom branding images.
    /// Supports upload (from computer), serve, delete, and status check for
    /// icon-transparent, favicon, banner-light, and banner-dark.
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    public class BrandingController : ControllerBase
    {
        private static readonly Dictionary<string, string[]> AllowedExtensions = new()
        {
            { "icon-transparent", new[] { ".png" } },
            { "favicon", new[] { ".ico", ".png", ".svg" } },
            { "banner-light", new[] { ".png", ".jpg", ".jpeg", ".webp" } },
            { "banner-dark", new[] { ".png", ".jpg", ".jpeg", ".webp" } }
        };

        private static readonly Dictionary<string, string> MimeTypes = new()
        {
            { ".png", "image/png" },
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".webp", "image/webp" },
            { ".ico", "image/x-icon" },
            { ".svg", "image/svg+xml" }
        };

        private readonly ILogger<BrandingController> _logger;
        private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10 MB

        public BrandingController(ILogger<BrandingController> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// GET /Branding/{type} — Serves the uploaded branding image. No auth required.
        /// type: icon-transparent | favicon | banner-light | banner-dark
        /// </summary>
        [HttpGet("{type}")]
        [AllowAnonymous]
        public IActionResult GetBrandingImage(string type)
        {
            var cfg = Plugin.Instance?.Configuration;
            if (cfg == null || !cfg.EnableCustomBranding)
                return NotFound();

            var filePath = FindBrandingFile(type);
            if (filePath == null)
                return NotFound();

            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            var mime = MimeTypes.TryGetValue(ext, out var m) ? m : "application/octet-stream";

            // Set cache headers — 1 hour
            Response.Headers["Cache-Control"] = "public, max-age=3600";
            return PhysicalFile(filePath, mime);
        }

        /// <summary>
        /// POST /Branding/{type} — Upload a branding image. Admin only.
        /// </summary>
        [HttpPost("{type}")]
        [Authorize(Policy = "RequiresElevation")]
        [RequestSizeLimit(MaxFileSizeBytes)]
        public async Task<IActionResult> UploadBrandingImage(string type, IFormFile file)
        {
            if (!AllowedExtensions.ContainsKey(type))
                return BadRequest("Unknown branding type. Use: icon-transparent, favicon, banner-light, banner-dark.");

            if (file == null || file.Length == 0)
                return BadRequest("No file provided.");

            if (file.Length > MaxFileSizeBytes)
                return BadRequest("File exceeds 10MB limit.");

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!Array.Exists(AllowedExtensions[type], e => e == ext))
                return BadRequest($"Invalid file type for {type}. Allowed: {string.Join(", ", AllowedExtensions[type])}");

            var brandingDir = Plugin.BrandingDirectory;
            if (string.IsNullOrWhiteSpace(brandingDir))
                return StatusCode(500, "Branding directory not configured.");

            Directory.CreateDirectory(brandingDir);

            // Remove any existing file for this type (may have different extension)
            DeleteExistingBrandingFiles(type, brandingDir);

            var destinationPath = Path.Combine(brandingDir, type + ext);
            try
            {
                using var stream = System.IO.File.Create(destinationPath);
                await file.CopyToAsync(stream);
                _logger.LogInformation("[LatestMedia] Branding image uploaded: {Type} → {Path}", type, destinationPath);
                return Ok(new { success = true, path = destinationPath });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[LatestMedia] Failed to save branding image {Type}", type);
                return StatusCode(500, "Failed to save image.");
            }
        }

        /// <summary>
        /// DELETE /Branding/{type} — Delete a branding image. Admin only.
        /// </summary>
        [HttpDelete("{type}")]
        [Authorize(Policy = "RequiresElevation")]
        public IActionResult DeleteBrandingImage(string type)
        {
            if (!AllowedExtensions.ContainsKey(type))
                return BadRequest("Unknown branding type.");

            var brandingDir = Plugin.BrandingDirectory;
            if (string.IsNullOrWhiteSpace(brandingDir))
                return NotFound();

            var deleted = DeleteExistingBrandingFiles(type, brandingDir);
            if (!deleted)
                return NotFound("No branding image found for this type.");

            _logger.LogInformation("[LatestMedia] Branding image deleted: {Type}", type);
            return Ok(new { success = true });
        }

        /// <summary>
        /// GET /Branding/Status — Returns which branding images exist. Requires login.
        /// </summary>
        [HttpGet("Status")]
        [AllowAnonymous]
        public IActionResult GetBrandingStatus()
        {
            var brandingDir = Plugin.BrandingDirectory;
            return Ok(new
            {
                iconTransparent = FindBrandingFile("icon-transparent") != null,
                favicon = FindBrandingFile("favicon") != null,
                bannerLight = FindBrandingFile("banner-light") != null,
                bannerDark = FindBrandingFile("banner-dark") != null,
                enabled = Plugin.Instance?.Configuration?.EnableCustomBranding ?? false
            });
        }

        // ── Helpers ──────────────────────────────────────────────────────────

        private static string? FindBrandingFile(string type)
        {
            var brandingDir = Plugin.BrandingDirectory;
            if (string.IsNullOrWhiteSpace(brandingDir) || !Directory.Exists(brandingDir))
                return null;

            if (!AllowedExtensions.TryGetValue(type, out var exts)) return null;

            foreach (var ext in exts)
            {
                var path = Path.Combine(brandingDir, type + ext);
                if (System.IO.File.Exists(path)) return path;
            }
            return null;
        }

        private static bool DeleteExistingBrandingFiles(string type, string brandingDir)
        {
            if (!AllowedExtensions.TryGetValue(type, out var exts)) return false;
            var deleted = false;
            foreach (var ext in exts)
            {
                var path = Path.Combine(brandingDir, type + ext);
                if (System.IO.File.Exists(path))
                {
                    System.IO.File.Delete(path);
                    deleted = true;
                }
            }
            return deleted;
        }
    }
}
