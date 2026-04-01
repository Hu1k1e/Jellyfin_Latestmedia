using System;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Configuration;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Entities;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin_Latestmedia.Services
{
    public class WatchlistMonitor : IHostedService
    {
        private readonly ILibraryManager _libraryManager;
        private readonly IUserDataManager _userDataManager;
        private readonly IUserManager _userManager;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<WatchlistMonitor> _logger;

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
            _libraryManager.ItemAdded += OnItemAdded;
            _logger.LogInformation("[WatchlistMonitor] Subscribed to LibraryManager.ItemAdded");
            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken cancellationToken)
        {
            _libraryManager.ItemAdded -= OnItemAdded;
            return Task.CompletedTask;
        }

        private void OnItemAdded(object sender, ItemChangeEventArgs e)
        {
            // Fully detach from the event thread to prevent any UI or ingestion lag
            Task.Run(() => ProcessItemForWatchlist(e.Item));
        }

        private async Task ProcessItemForWatchlist(BaseItem item)
        {
            try
            {
                if (item == null) return;
                var kind = item.GetBaseItemKind();
                if (kind != BaseItemKind.Movie && kind != BaseItemKind.Series) return;

                var config = Plugin.Instance?.Configuration;
                if (config == null || !config.JellyseerrEnabled || !config.AddRequestedMediaToWatchlist)
                    return;

                if (!item.ProviderIds.TryGetValue("Tmdb", out var tmdbIdStr) || !int.TryParse(tmdbIdStr, out var tmdbId))
                    return;

                var mediaType = kind == BaseItemKind.Movie ? "movie" : "tv";
                var urlStr = config.JellyseerrUrls?.Split(new[] { '\r', '\n', ',' }, StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim().TrimEnd('/');
                if (string.IsNullOrEmpty(urlStr) || string.IsNullOrEmpty(config.JellyseerrApiKey))
                    return;

                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("X-Api-Key", config.JellyseerrApiKey);
                client.Timeout = TimeSpan.FromSeconds(15);

                var reqUrl = $"{urlStr}/api/v1/{mediaType}/{tmdbId}";
                using var response = await client.GetAsync(reqUrl).ConfigureAwait(false);
                if (!response.IsSuccessStatusCode) return;

                var body = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
                using var doc = JsonDocument.Parse(body);
                
                if (!doc.RootElement.TryGetProperty("mediaInfo", out var mediaInfo) || mediaInfo.ValueKind != JsonValueKind.Object)
                    return;

                if (!mediaInfo.TryGetProperty("requests", out var requests) || requests.ValueKind != JsonValueKind.Array)
                    return;

                int addedCount = 0;
                foreach (var req in requests.EnumerateArray())
                {
                    if (req.TryGetProperty("requestedBy", out var requestedBy) && requestedBy.ValueKind == JsonValueKind.Object)
                    {
                        var jfUserId = requestedBy.TryGetProperty("jellyfinUserId", out var uid) ? uid.GetString() : null;
                        if (string.IsNullOrEmpty(jfUserId))
                            jfUserId = requestedBy.TryGetProperty("jellyfinAuthId", out var authId) ? authId.GetString() : null;

                        if (!string.IsNullOrEmpty(jfUserId))
                        {
                            var cleanId = jfUserId.Replace("-", "");
                            var user = _userManager.Users.FirstOrDefault(u => u.Id.ToString("N").Equals(cleanId, StringComparison.OrdinalIgnoreCase));
                            if (user != null)
                            {
                                var userData = _userDataManager.GetUserData(user, item);
                                if (userData != null && userData.Likes != true)
                                {
                                    userData.Likes = true;
                                    _userDataManager.SaveUserData(user, item, userData, UserDataSaveReason.UpdateUserRating, default);
                                    addedCount++;
                                    _logger.LogInformation("[WatchlistMonitor] Added {Title} to watchlist for {User}", item.Name, user.Username);
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[WatchlistMonitor] Error processing ItemAdded for Watchlist sync.");
            }
        }
    }
}
