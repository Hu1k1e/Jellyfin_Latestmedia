using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Configuration;
using Jellyfin.Data.Enums;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Entities;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin_Latestmedia.Services
{
    /// <summary>
    /// Monitors library additions to automatically add requested media to user watchlists.
    /// Queries Jellyseerr's /api/v1/request bulk endpoint (same as JellyfinEnhanced).
    /// </summary>
    public class WatchlistMonitor : IHostedService
    {
        private readonly ILibraryManager _libraryManager;
        private readonly IUserDataManager _userDataManager;
        private readonly IUserManager _userManager;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<WatchlistMonitor> _logger;

        // Cache: jellyseerrUrl → (requests, cachedAt)
        private readonly Dictionary<string, (List<RequestItemWithUser> Items, DateTime CachedAt)> _requestsCache = new();
        private readonly object _cacheLock = new();
        private readonly ConcurrentDictionary<string, Task<List<RequestItemWithUser>?>> _inFlight = new();

        private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(30);

        public WatchlistMonitor(
            ILibraryManager libraryManager,
            IUserDataManager userDataManager,
            IUserManager userManager,
            IHttpClientFactory httpClientFactory,
            ILogger<WatchlistMonitor> logger)
        {
            _libraryManager = libraryManager;
            _userDataManager = userDataManager;
            _userManager = userManager;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public Task StartAsync(CancellationToken cancellationToken)
        {
            var config = Plugin.Instance?.Configuration;
            if (config == null || !config.JellyseerrEnabled || !config.AddRequestedMediaToWatchlist)
            {
                _logger.LogInformation("[WatchlistMonitor] Watchlist monitoring disabled — not subscribing to library events");
                return Task.CompletedTask;
            }

            _libraryManager.ItemAdded += OnItemAdded;
            _libraryManager.ItemUpdated += OnItemUpdated;
            _logger.LogInformation("[WatchlistMonitor] Subscribed to ItemAdded + ItemUpdated");
            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _libraryManager.ItemAdded -= OnItemAdded;
            _libraryManager.ItemUpdated -= OnItemUpdated;
            return Task.CompletedTask;
        }

        private void OnItemAdded(object sender, ItemChangeEventArgs e)
            => Task.Run(() => ProcessItem(e.Item));

        private void OnItemUpdated(object sender, ItemChangeEventArgs e)
            => Task.Run(() => ProcessItem(e.Item));

        private async Task ProcessItem(BaseItem? item)
        {
            try
            {
                if (item == null) return;
                var kind = item.GetBaseItemKind();
                if (kind != BaseItemKind.Movie && kind != BaseItemKind.Series) return;

                var config = Plugin.Instance?.Configuration;
                if (config == null || !config.JellyseerrEnabled || !config.AddRequestedMediaToWatchlist)
                    return;

                if (item.ProviderIds == null || !item.ProviderIds.TryGetValue("Tmdb", out var tmdbIdStr)
                    || !int.TryParse(tmdbIdStr, out var tmdbId))
                    return;

                var mediaType = kind == BaseItemKind.Movie ? "movie" : "tv";
                var baseUrl = config.JellyseerrUrls?
                    .Split(new[] { '\r', '\n', ',' }, StringSplitOptions.RemoveEmptyEntries)
                    .FirstOrDefault()?.Trim().TrimEnd('/');

                if (string.IsNullOrEmpty(baseUrl) || string.IsNullOrEmpty(config.JellyseerrApiKey))
                    return;

                // Fetch ALL requests in one bulk call (same pattern as JellyfinEnhanced)
                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("X-Api-Key", config.JellyseerrApiKey);
                client.Timeout = TimeSpan.FromSeconds(20);

                var allRequests = await GetAllRequestsCached(client, baseUrl).ConfigureAwait(false);
                if (allRequests == null || allRequests.Count == 0) return;

                // Find requests matching this TMDB ID + media type
                var matching = allRequests
                    .Where(r => r.TmdbId == tmdbId && r.MediaType == mediaType
                                && !string.IsNullOrEmpty(r.JellyfinUserId))
                    .ToList();

                if (matching.Count == 0) return;

                // Build fast lookup: normalized user ID → user
                var userLookup = _userManager.Users
                    .GroupBy(u => Normalize(u.Id.ToString()), StringComparer.OrdinalIgnoreCase)
                    .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

                int added = 0;
                foreach (var req in matching)
                {
                    var normId = Normalize(req.JellyfinUserId!);
                    if (!userLookup.TryGetValue(normId, out var user)) continue;

                    var userData = _userDataManager.GetUserData(user, item);
                    if (userData != null && userData.Likes != true)
                    {
                        // Jellyfin's "watchlist" in the context of Jellyseerr requests is stored as Likes
                        userData.Likes = true;
                        _userDataManager.SaveUserData(user, item, userData, UserDataSaveReason.UpdateUserRating, default);
                        added++;
                        _logger.LogInformation("[WatchlistMonitor] Added '{Title}' to watchlist for {User}", item.Name, user.Username);
                    }
                }

                if (added == 0)
                    _logger.LogDebug("[WatchlistMonitor] '{Title}' already in watchlist for all matching users", item.Name);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[WatchlistMonitor] Error in ProcessItem for {Name}", item?.Name);
            }
        }

        /// <summary>
        /// Fetches all Jellyseerr requests in a single API call with 30-second caching.
        /// Deduplicates in-flight fetches to avoid parallel calls for simultaneous library events.
        /// </summary>
        private async Task<List<RequestItemWithUser>?> GetAllRequestsCached(HttpClient client, string baseUrl)
        {
            var cacheKey = baseUrl;

            lock (_cacheLock)
            {
                if (_requestsCache.TryGetValue(cacheKey, out var cached)
                    && DateTime.UtcNow - cached.CachedAt < CacheTtl)
                    return cached.Items;
            }

            var fetchTask = _inFlight.GetOrAdd(cacheKey, _ => FetchAllRequests(client, baseUrl));
            try
            {
                var items = await fetchTask.ConfigureAwait(false);
                if (items != null)
                {
                    lock (_cacheLock)
                        _requestsCache[cacheKey] = (items, DateTime.UtcNow);
                }
                return items;
            }
            finally
            {
                _inFlight.TryRemove(cacheKey, out _);
            }
        }

        private async Task<List<RequestItemWithUser>?> FetchAllRequests(HttpClient client, string baseUrl)
        {
            try
            {
                var url = $"{baseUrl}/api/v1/request?take=1000&skip=0&sort=added&filter=all";
                using var response = await client.GetAsync(url).ConfigureAwait(false);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("[WatchlistMonitor] Jellyseerr request list returned {Status}", response.StatusCode);
                    return null;
                }

                var body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                using var doc = JsonDocument.Parse(body);

                if (!doc.RootElement.TryGetProperty("results", out var results))
                {
                    _logger.LogWarning("[WatchlistMonitor] Jellyseerr response missing 'results' array");
                    return null;
                }

                var list = new List<RequestItemWithUser>();
                foreach (var item in results.EnumerateArray())
                {
                    var parsed = ParseRequest(item);
                    if (parsed != null) list.Add(parsed);
                }
                return list;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[WatchlistMonitor] Error fetching Jellyseerr requests");
                return null;
            }
        }

        private static RequestItemWithUser? ParseRequest(JsonElement item)
        {
            try
            {
                // Get media type from root "type" field
                string? mediaType = null;
                if (item.TryGetProperty("type", out var typeEl))
                    mediaType = typeEl.GetString() switch { "movie" => "movie", "tv" => "tv", _ => null };

                // Get TMDB ID from media.tmdbId
                int? tmdbId = null;
                if (item.TryGetProperty("media", out var mediaEl)
                    && mediaEl.TryGetProperty("tmdbId", out var tmdbEl)
                    && tmdbEl.ValueKind == JsonValueKind.Number)
                    tmdbId = tmdbEl.GetInt32();

                // Get requesting user's Jellyfin ID from requestedBy.jellyfinUserId
                string? jellyfinUserId = null;
                if (item.TryGetProperty("requestedBy", out var reqByEl)
                    && reqByEl.TryGetProperty("jellyfinUserId", out var uidEl))
                    jellyfinUserId = uidEl.GetString();

                if (tmdbId.HasValue && mediaType != null && !string.IsNullOrEmpty(jellyfinUserId))
                    return new RequestItemWithUser { TmdbId = tmdbId.Value, MediaType = mediaType, JellyfinUserId = jellyfinUserId };
            }
            catch { /* swallow parse errors per item */ }
            return null;
        }

        private static string Normalize(string? id)
            => string.IsNullOrEmpty(id) ? string.Empty : id.Replace("-", string.Empty, StringComparison.Ordinal);

        private class RequestItemWithUser
        {
            public int TmdbId { get; set; }
            public string MediaType { get; set; } = string.Empty;
            public string? JellyfinUserId { get; set; }
        }
    }
}
