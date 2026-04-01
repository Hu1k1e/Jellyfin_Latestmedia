using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Configuration;
using MediaBrowser.Controller.Library;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin_Latestmedia.Api
{
    /// <summary>
    /// Lightweight proxy for Sonarr / Radarr API calls used by the *arr integration frontend.
    /// All endpoints require Jellyfin authentication. Admin-only endpoints are tagged accordingly.
    /// </summary>
    [ApiController]
    [Route("Arr")]
    [Authorize]
    public class ArrController : ControllerBase
    {
        private readonly ILogger<ArrController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;

        public ArrController(ILogger<ArrController> logger, IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        // ── Helper ────────────────────────────────────────────────────────────

        private PluginConfiguration Config =>
            Plugin.Instance?.Configuration ?? new PluginConfiguration();

        private async Task<IActionResult> ProxyGet(string baseUrl, string apiKey, string path)
        {
            if (string.IsNullOrWhiteSpace(baseUrl) || string.IsNullOrWhiteSpace(apiKey))
                return BadRequest(new { error = "Service URL or API key not configured." });

            var cleanBase = baseUrl.TrimEnd('/');
            var url = $"{cleanBase}{path}";

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
                client.Timeout = TimeSpan.FromSeconds(10);

                using var response = await client.GetAsync(url).ConfigureAwait(false);
                var body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("[ArrController] {Url} returned {Status}", url, response.StatusCode);
                    return StatusCode((int)response.StatusCode, new { error = body });
                }

                // Parse and re-serialize to strip any unexpected fields / normalise encoding
                using var doc = JsonDocument.Parse(body);
                return Ok(doc.RootElement);
            }
            catch (TaskCanceledException)
            {
                return StatusCode(504, new { error = "Upstream request timed out." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ArrController] Proxy error for {Url}", url);
                return StatusCode(502, new { error = ex.Message });
            }
        }

        // ── Sonarr Queue ────────────────────────────────────────────────────

        /// <summary>Returns the current Sonarr download queue.</summary>
        [HttpGet("SonarrQueue")]
        public Task<IActionResult> SonarrQueue()
        {
            var cfg = Config;
            return ProxyGet(cfg.SonarrUrl, cfg.SonarrApiKey, "/api/v3/queue?pageSize=100&includeUnknownSeriesItems=true");
        }

        // ── Radarr Queue ─────────────────────────────────────────────────────

        /// <summary>Returns the current Radarr download queue.</summary>
        [HttpGet("RadarrQueue")]
        public Task<IActionResult> RadarrQueue()
        {
            var cfg = Config;
            return ProxyGet(cfg.RadarrUrl, cfg.RadarrApiKey, "/api/v3/queue?pageSize=100&includeUnknownMovieItems=true");
        }

        // ── Sonarr Series Slug (for Quick Links) ──────────────────────────

        /// <summary>
        /// Looks up the Sonarr titleSlug for a series by TVDB ID.
        /// Used by the arr-links frontend to construct a deep link into Sonarr.
        /// </summary>
        [HttpGet("SeriesSlug")]
        public async Task<IActionResult> SeriesSlug([FromQuery] string tvdbId)
        {
            if (string.IsNullOrWhiteSpace(tvdbId))
                return BadRequest(new { error = "tvdbId is required." });

            var cfg = Config;
            if (string.IsNullOrWhiteSpace(cfg.SonarrUrl) || string.IsNullOrWhiteSpace(cfg.SonarrApiKey))
                return BadRequest(new { error = "Sonarr not configured." });

            var cleanBase = cfg.SonarrUrl.TrimEnd('/');
            var url = $"{cleanBase}/api/v3/series?tvdbId={Uri.EscapeDataString(tvdbId)}";

            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("X-Api-Key", cfg.SonarrApiKey);
                client.Timeout = TimeSpan.FromSeconds(8);

                using var response = await client.GetAsync(url).ConfigureAwait(false);
                var body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (!response.IsSuccessStatusCode)
                    return StatusCode((int)response.StatusCode, new { error = body });

                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;
                if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
                {
                    var first = root[0];
                    if (first.TryGetProperty("titleSlug", out var slug))
                        return Ok(new { titleSlug = slug.GetString() });
                }

                return NotFound(new { error = "Series not found in Sonarr." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[ArrController] SeriesSlug error for tvdbId={TvdbId}", tvdbId);
                return StatusCode(502, new { error = ex.Message });
            }
        }

        // ── Combined Queue (for Downloads page) ─────────────────────────────

        /// <summary>
        /// Returns a unified download queue object: { sonarr: [...], radarr: [...] }.
        /// Each inner array contains the raw queue records from the respective *arr instance.
        /// Both fetch concurrently. If one fails, the other's results are still returned.
        /// </summary>
        [HttpGet("Queue")]
        public async Task<IActionResult> Queue()
        {
            var cfg = Config;

            var sonarrTask = FetchQueue(cfg.SonarrUrl, cfg.SonarrApiKey,
                "/api/v3/queue?pageSize=100&includeUnknownSeriesItems=true");
            var radarrTask = FetchQueue(cfg.RadarrUrl, cfg.RadarrApiKey,
                "/api/v3/queue?pageSize=100&includeUnknownMovieItems=true");

            await Task.WhenAll(sonarrTask, radarrTask).ConfigureAwait(false);

            return Ok(new
            {
                sonarr = sonarrTask.Result,
                radarr = radarrTask.Result
            });
        }

        private async Task<object> FetchQueue(string baseUrl, string apiKey, string path)
        {
            if (string.IsNullOrWhiteSpace(baseUrl) || string.IsNullOrWhiteSpace(apiKey))
                return null;

            var cleanBase = baseUrl.TrimEnd('/');
            var url = $"{cleanBase}{path}";
            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
                client.Timeout = TimeSpan.FromSeconds(10);

                using var response = await client.GetAsync(url).ConfigureAwait(false);
                if (!response.IsSuccessStatusCode) return null;

                var body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                using var doc = JsonDocument.Parse(body);

                // Sonarr/Radarr queue API wraps results in { records: [...] }
                if (doc.RootElement.TryGetProperty("records", out var records))
                    return JsonSerializer.Deserialize<object[]>(records.GetRawText());

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[ArrController] FetchQueue failed for {Url}", url);
                return null;
            }
        }
        // ── Test connectivity ─────────────────────────────────────────────────

        /// <summary>Tests Sonarr connectivity. Returns { success, version }.</summary>
        [HttpPost("TestSonarr")]
        [Authorize(Policy = "RequiresElevation")]
        public Task<IActionResult> TestSonarr() => TestService(Config.SonarrUrl, Config.SonarrApiKey, "Sonarr");

        /// <summary>Tests Radarr connectivity. Returns { success, version }.</summary>
        [HttpPost("TestRadarr")]
        [Authorize(Policy = "RequiresElevation")]
        public Task<IActionResult> TestRadarr() => TestService(Config.RadarrUrl, Config.RadarrApiKey, "Radarr");

        private async Task<IActionResult> TestService(string baseUrl, string apiKey, string label)
        {
            if (string.IsNullOrWhiteSpace(baseUrl) || string.IsNullOrWhiteSpace(apiKey))
                return Ok(new { success = false, error = $"{label} URL or API key not configured." });

            var url = $"{baseUrl.TrimEnd('/')}/api/v3/system/status";
            try
            {
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
                client.Timeout = TimeSpan.FromSeconds(8);

                using var response = await client.GetAsync(url).ConfigureAwait(false);
                var body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);

                if (!response.IsSuccessStatusCode)
                    return Ok(new { success = false, error = $"HTTP {(int)response.StatusCode}" });

                using var doc = JsonDocument.Parse(body);
                var version = doc.RootElement.TryGetProperty("version", out var v) ? v.GetString() : "?";
                return Ok(new { success = true, version });
            }
            catch (TaskCanceledException)
            {
                return Ok(new { success = false, error = "Request timed out." });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[ArrController] TestService failed for {Label}", label);
                return Ok(new { success = false, error = ex.Message });
            }
        }
    }
}
