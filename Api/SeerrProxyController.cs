using System;
using System.Collections.Concurrent;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace Jellyfin_Latestmedia.Api
{
    /// <summary>
    /// Backend proxy for all Jellyseerr/Overseerr API calls.
    /// Keeps the API key server-side (never exposed to browser).
    /// Caches responses in-memory with configurable TTL to prevent excessive external calls.
    /// </summary>
    [ApiController]
    [Route("[controller]")]
    public class SeerrController : ControllerBase
    {
        private static readonly HttpClient _http = new HttpClient { Timeout = TimeSpan.FromSeconds(15) };

        // Response cache: key → (expiry, json body)
        private static readonly ConcurrentDictionary<string, (DateTime Expiry, string Json)> _cache = new();

        // Jellyfin userId → Seerr userId cache
        private static readonly ConcurrentDictionary<string, (DateTime Expiry, int SeerrUserId)> _userCache = new();

        private readonly ILogger<SeerrController> _logger;

        public SeerrController(ILogger<SeerrController> logger)
        {
            _logger = logger;
        }

        // ── Config ──────────────────────────────────────────────────────────

        /// <summary>GET /Seerr/Config — Returns Seerr feature flags (no API key).</summary>
        [HttpGet("Config")]
        [Authorize]
        public IActionResult GetConfig()
        {
            var cfg = Plugin.Instance?.Configuration;
            if (cfg == null) return StatusCode(500);
            return Ok(new
            {
                enabled = cfg.JellyseerrEnabled,
                showSearchResults = cfg.JellyseerrShowSearchResults,
                showCollections = cfg.ShowCollectionsInSearch,
                enable4K = cfg.JellyseerrEnable4KRequests,
                enable4KTv = cfg.JellyseerrEnable4KTvRequests,
                showAdvanced = cfg.JellyseerrShowAdvanced,
                showReportButton = cfg.JellyseerrShowReportButton,
                showIssueIndicator = cfg.JellyseerrShowIssueIndicator,
                showSimilar = cfg.JellyseerrShowSimilar,
                showRecommended = cfg.JellyseerrShowRecommended,
                showNetworkDiscovery = cfg.JellyseerrShowNetworkDiscovery,
                showGenreDiscovery = cfg.JellyseerrShowGenreDiscovery,
                showTagDiscovery = cfg.JellyseerrShowTagDiscovery,
                showPersonDiscovery = cfg.JellyseerrShowPersonDiscovery,
                showCollectionDiscovery = cfg.JellyseerrShowCollectionDiscovery,
                excludeLibraryItems = cfg.JellyseerrExcludeLibraryItems,
                excludeBlocklisted = cfg.JellyseerrExcludeBlocklistedItems,
                useMoreInfoModal = cfg.JellyseerrUseMoreInfoModal,
                addToWatchlist = cfg.AddRequestedMediaToWatchlist,
                syncWatchlist = cfg.SyncJellyseerrWatchlist,
                preventReAddition = cfg.PreventWatchlistReAddition,
                watchlistRetentionDays = cfg.WatchlistMemoryRetentionDays,
                hasTmdbKey = !string.IsNullOrWhiteSpace(cfg.TMDB_API_KEY)
            });
        }

        // ── Search ──────────────────────────────────────────────────────────

        /// <summary>GET /Seerr/Search?query=...&page=1</summary>
        [HttpGet("Search")]
        [Authorize]
        public Task<IActionResult> Search([FromQuery] string query, [FromQuery] int page = 1)
            => ProxyGet($"api/v1/search?query={Uri.EscapeDataString(query ?? "")}&page={page}");

        // ── Movie ────────────────────────────────────────────────────────────

        /// <summary>GET /Seerr/Movie/{tmdbId}</summary>
        [HttpGet("Movie/{tmdbId}")]
        [Authorize]
        public Task<IActionResult> GetMovie(int tmdbId)
            => ProxyGet($"api/v1/movie/{tmdbId}");

        /// <summary>GET /Seerr/Movie/{tmdbId}/Similar</summary>
        [HttpGet("Movie/{tmdbId}/Similar")]
        [Authorize]
        public Task<IActionResult> GetMovieSimilar(int tmdbId)
            => ProxyGet($"api/v1/movie/{tmdbId}/similar");

        /// <summary>GET /Seerr/Movie/{tmdbId}/Recommendations</summary>
        [HttpGet("Movie/{tmdbId}/Recommendations")]
        [Authorize]
        public Task<IActionResult> GetMovieRecommendations(int tmdbId)
            => ProxyGet($"api/v1/movie/{tmdbId}/recommendations");

        // ── TV ───────────────────────────────────────────────────────────────

        /// <summary>GET /Seerr/Tv/{tmdbId}</summary>
        [HttpGet("Tv/{tmdbId}")]
        [Authorize]
        public Task<IActionResult> GetTv(int tmdbId)
            => ProxyGet($"api/v1/tv/{tmdbId}");

        /// <summary>GET /Seerr/Tv/{tmdbId}/Similar</summary>
        [HttpGet("Tv/{tmdbId}/Similar")]
        [Authorize]
        public Task<IActionResult> GetTvSimilar(int tmdbId)
            => ProxyGet($"api/v1/tv/{tmdbId}/similar");

        /// <summary>GET /Seerr/Tv/{tmdbId}/Recommendations</summary>
        [HttpGet("Tv/{tmdbId}/Recommendations")]
        [Authorize]
        public Task<IActionResult> GetTvRecommendations(int tmdbId)
            => ProxyGet($"api/v1/tv/{tmdbId}/recommendations");

        // ── Discovery ────────────────────────────────────────────────────────

        /// <summary>GET /Seerr/Discover/{type}?... — type: movies, tv, keyword, etc.</summary>
        [HttpGet("Discover/{type}")]
        [Authorize]
        public Task<IActionResult> Discover(string type, [FromQuery] string? genreId,
            [FromQuery] string? keywords, [FromQuery] int page = 1)
        {
            var qs = $"page={page}";
            if (!string.IsNullOrWhiteSpace(genreId)) qs += $"&genre={Uri.EscapeDataString(genreId)}";
            if (!string.IsNullOrWhiteSpace(keywords)) qs += $"&keywords={Uri.EscapeDataString(keywords)}";
            return ProxyGet($"api/v1/discover/{type}?{qs}");
        }

        // ── Requests ─────────────────────────────────────────────────────────

        /// <summary>POST /Seerr/Request — Submit a media request.</summary>
        [HttpPost("Request")]
        [Authorize]
        public Task<IActionResult> CreateRequest()
            => ProxyPost("api/v1/request");

        /// <summary>DELETE /Seerr/Request/{requestId} — Cancel a request.</summary>
        [HttpDelete("Request/{requestId}")]
        [Authorize]
        public Task<IActionResult> DeleteRequest(int requestId)
            => ProxyDelete($"api/v1/request/{requestId}");

        // ── Advanced Request Options (Radarr / Sonarr) ────────────────────────

        /// <summary>GET /Seerr/Radarr — List all configured Radarr servers.</summary>
        [HttpGet("Radarr")]
        [Authorize]
        public Task<IActionResult> GetRadarrServers()
            => ProxyGet("api/v1/radarr");

        /// <summary>GET /Seerr/Radarr/{serverId} — Radarr server details (profiles + root folders).</summary>
        [HttpGet("Radarr/{serverId}")]
        [Authorize]
        public Task<IActionResult> GetRadarrServerDetails(int serverId)
            => ProxyGet($"api/v1/radarr/{serverId}");

        /// <summary>GET /Seerr/Sonarr — List all configured Sonarr servers.</summary>
        [HttpGet("Sonarr")]
        [Authorize]
        public Task<IActionResult> GetSonarrServers()
            => ProxyGet("api/v1/sonarr");

        /// <summary>GET /Seerr/Sonarr/{serverId} — Sonarr server details (profiles + root folders).</summary>
        [HttpGet("Sonarr/{serverId}")]
        [Authorize]
        public Task<IActionResult> GetSonarrServerDetails(int serverId)
            => ProxyGet($"api/v1/sonarr/{serverId}");

        // ── User ─────────────────────────────────────────────────────────────

        /// <summary>GET /Seerr/User — Gets Seerr user corresponding to current Jellyfin session.</summary>
        [HttpGet("User")]
        [Authorize]
        public Task<IActionResult> GetUser()
            => ProxyGet("api/v1/auth/me");

        /// <summary>GET /Seerr/RequestCount — Get request quota for current user.</summary>
        [HttpGet("RequestCount")]
        [Authorize]
        public Task<IActionResult> GetRequestCount()
            => ProxyGet("api/v1/request?skip=0&take=1&filter=all&sort=added&requestedBy=0");

        // ── Test (Admin) ──────────────────────────────────────────────────────

        /// <summary>POST /Seerr/Test — Test Seerr API connectivity.</summary>
        [HttpPost("Test")]
        [Authorize(Policy = "RequiresElevation")]
        public async Task<IActionResult> TestSeerr()
        {
            var cfg = Plugin.Instance?.Configuration;
            if (cfg == null) return StatusCode(500);
            if (string.IsNullOrWhiteSpace(cfg.JellyseerrUrls))
                return BadRequest("No Seerr URL configured.");

            var baseUrl = GetSeerrBaseUrl();
            if (baseUrl == null) return BadRequest("Invalid Seerr URL.");

            try
            {
                using var req = new HttpRequestMessage(HttpMethod.Get, baseUrl + "api/v1/settings/public");
                req.Headers.Add("X-Api-Key", cfg.JellyseerrApiKey);
                var resp = await _http.SendAsync(req);
                if (resp.IsSuccessStatusCode)
                    return Ok(new { success = true, statusCode = (int)resp.StatusCode });
                return Ok(new { success = false, statusCode = (int)resp.StatusCode });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[LatestMedia] Seerr connectivity test failed");
                return Ok(new { success = false, error = ex.Message });
            }
        }

        /// <summary>POST /Seerr/TestTmdb — Test TMDB API key.</summary>
        [HttpPost("TestTmdb")]
        [Authorize(Policy = "RequiresElevation")]
        public async Task<IActionResult> TestTmdb()
        {
            var cfg = Plugin.Instance?.Configuration;
            if (cfg == null) return StatusCode(500);
            if (string.IsNullOrWhiteSpace(cfg.TMDB_API_KEY))
                return BadRequest("No TMDB API key configured.");

            try
            {
                using var req = new HttpRequestMessage(HttpMethod.Get,
                    $"https://api.themoviedb.org/3/configuration?api_key={cfg.TMDB_API_KEY}");
                var resp = await _http.SendAsync(req);
                return Ok(new { success = resp.IsSuccessStatusCode, statusCode = (int)resp.StatusCode });
            }
            catch (Exception ex)
            {
                return Ok(new { success = false, error = ex.Message });
            }
        }

        // ── Proxy Helpers ────────────────────────────────────────────────────

        private string? GetSeerrBaseUrl()
        {
            var cfg = Plugin.Instance?.Configuration;
            if (cfg == null || string.IsNullOrWhiteSpace(cfg.JellyseerrUrls)) return null;

            // Support multiple URLs — try first non-empty one
            var url = cfg.JellyseerrUrls.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)[0];
            if (!url.EndsWith('/')) url += '/';
            return url;
        }

        private async Task<IActionResult> ProxyGet(string seerrPath)
        {
            var cfg = Plugin.Instance?.Configuration;
            if (cfg == null || !cfg.JellyseerrEnabled)
                return StatusCode(503, "Seerr integration is disabled.");

            var baseUrl = GetSeerrBaseUrl();
            if (baseUrl == null)
                return StatusCode(503, "Seerr URL not configured.");

            var cacheKey = seerrPath;
            var ttl = cfg.JellyseerrDisableCache ? 0 : cfg.JellyseerrResponseCacheTtlMinutes;

            // Check cache
            if (ttl > 0 && _cache.TryGetValue(cacheKey, out var cached) && cached.Expiry > DateTime.UtcNow)
            {
                return Content(cached.Json, "application/json");
            }

            try
            {
                using var req = new HttpRequestMessage(HttpMethod.Get, baseUrl + seerrPath);
                req.Headers.Add("X-Api-Key", cfg.JellyseerrApiKey);
                var resp = await _http.SendAsync(req);
                var body = await resp.Content.ReadAsStringAsync();

                if (resp.IsSuccessStatusCode && ttl > 0)
                {
                    _cache[cacheKey] = (DateTime.UtcNow.AddMinutes(ttl), body);
                }

                Response.StatusCode = (int)resp.StatusCode;
                return Content(body, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[LatestMedia] Seerr proxy GET failed: {Path}", seerrPath);
                return StatusCode(502, "Seerr request failed: " + ex.Message);
            }
        }

        private async Task<IActionResult> ProxyPost(string seerrPath)
        {
            var cfg = Plugin.Instance?.Configuration;
            if (cfg == null || !cfg.JellyseerrEnabled)
                return StatusCode(503, "Seerr integration is disabled.");

            var baseUrl = GetSeerrBaseUrl();
            if (baseUrl == null)
                return StatusCode(503, "Seerr URL not configured.");

            try
            {
                var bodyStr = await new System.IO.StreamReader(Request.Body).ReadToEndAsync();
                using var req = new HttpRequestMessage(HttpMethod.Post, baseUrl + seerrPath);
                req.Headers.Add("X-Api-Key", cfg.JellyseerrApiKey);
                req.Content = new StringContent(bodyStr, Encoding.UTF8, "application/json");
                var resp = await _http.SendAsync(req);
                var body = await resp.Content.ReadAsStringAsync();
                Response.StatusCode = (int)resp.StatusCode;
                return Content(body, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[LatestMedia] Seerr proxy POST failed: {Path}", seerrPath);
                return StatusCode(502, "Seerr request failed: " + ex.Message);
            }
        }

        private async Task<IActionResult> ProxyDelete(string seerrPath)
        {
            var cfg = Plugin.Instance?.Configuration;
            if (cfg == null || !cfg.JellyseerrEnabled)
                return StatusCode(503, "Seerr integration is disabled.");

            var baseUrl = GetSeerrBaseUrl();
            if (baseUrl == null)
                return StatusCode(503, "Seerr URL not configured.");

            try
            {
                using var req = new HttpRequestMessage(HttpMethod.Delete, baseUrl + seerrPath);
                req.Headers.Add("X-Api-Key", cfg.JellyseerrApiKey);
                var resp = await _http.SendAsync(req);
                var body = await resp.Content.ReadAsStringAsync();
                Response.StatusCode = (int)resp.StatusCode;
                return Content(body, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[LatestMedia] Seerr proxy DELETE failed: {Path}", seerrPath);
                return StatusCode(502, "Seerr request failed: " + ex.Message);
            }
        }
    }
}
