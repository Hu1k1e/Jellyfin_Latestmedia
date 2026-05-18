using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Data;
using Jellyfin_Latestmedia.Models;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Tasks;
using Jellyfin.Data.Enums;
using Microsoft.Extensions.Logging;

namespace Jellyfin_Latestmedia.Services
{
    public class DeletionSchedulerService : IScheduledTask
    {
        private readonly ILogger<DeletionSchedulerService> _logger;
        private readonly PluginRepository _repository;
        private readonly ILibraryManager _libraryManager;
        private readonly IHttpClientFactory _httpClientFactory;

        public DeletionSchedulerService(
            ILogger<DeletionSchedulerService> logger,
            ILibraryManager libraryManager,
            IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _repository = Plugin.Instance.Repository;
            _libraryManager = libraryManager;
            _httpClientFactory = httpClientFactory;
        }

        public string Name => "Mange Media: Scheduled Deletions";
        public string Key => "LatestMediaDeletionTask";
        public string Description => "Checks for media items scheduled for deletion and removes them from Jellyfin, Radarr and Sonarr.";
        public string Category => "Latest Media & Management";

        public IEnumerable<TaskTriggerInfo> GetDefaultTriggers()
        {
            return new[]
            {
                new TaskTriggerInfo
                {
                    Type = TaskTriggerInfoType.IntervalTrigger,
                    IntervalTicks = TimeSpan.FromMinutes(15).Ticks
                }
            };
        }

        public async Task ExecuteAsync(IProgress<double> progress, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting Scheduled Deletion run");
            const string filename = "scheduled_deletions";

            var schedule = await _repository.ReadListAsync<ScheduledDeletion>(filename);
            if (schedule.Count == 0)
            {
                progress.Report(100);
                return;
            }

            var now = DateTime.UtcNow;
            var toDelete = schedule.Where(x => x.ScheduledTime <= now).ToList();
            var remaining = schedule.Where(x => x.ScheduledTime > now).ToList();

            if (toDelete.Count > 0)
            {
                int processed = 0;
                foreach (var item in toDelete)
                {
                    cancellationToken.ThrowIfCancellationRequested();

                    try
                    {
                        if (Guid.TryParse(item.ItemId, out var parsedGuid))
                        {
                            var libraryItem = _libraryManager.GetItemById(parsedGuid);
                            if (libraryItem != null)
                            {
                                _logger.LogInformation("Deleting scheduled item {ItemName} ({ItemId}), scheduled by {ScheduledBy}",
                                    libraryItem.Name, item.ItemId, item.ScheduledByName);

                                var kind = libraryItem.GetBaseItemKind();

                                // ── Step 1: Remove from Radarr/Sonarr with import exclusion ──
                                // This must happen BEFORE the Jellyfin deletion so we still
                                // have provider IDs and can look up the item in the *arr DB.
                                if (kind == BaseItemKind.Movie)
                                {
                                    await DeleteFromRadarr(libraryItem.Name, libraryItem.ProviderIds).ConfigureAwait(false);
                                }
                                else if (kind == BaseItemKind.Series)
                                {
                                    // Series carries the TVDB ID directly.
                                    await DeleteFromSonarr(libraryItem.Name, libraryItem.ProviderIds).ConfigureAwait(false);
                                }
                                else if (kind == BaseItemKind.Season || kind == BaseItemKind.Episode)
                                {
                                    // Seasons and episodes don't carry the TVDB ID themselves —
                                    // walk up to the parent Series to get it.
                                    var seriesItem = GetParentSeries(libraryItem);
                                    if (seriesItem != null)
                                        await DeleteFromSonarr(seriesItem.Name, seriesItem.ProviderIds).ConfigureAwait(false);
                                    else
                                        _logger.LogWarning("[ArrDelete] Could not find parent Series for {Name} — skipping Sonarr delete", libraryItem.Name);
                                }

                                // ── Step 2: Delete from Jellyfin and from disk ──
                                _libraryManager.DeleteItem(libraryItem, new DeleteOptions
                                {
                                    DeleteFileLocation = true
                                }, true);

                                _logger.LogInformation("Deleted '{ItemName}' from Jellyfin library and disk.", libraryItem.Name);
                            }
                            else
                            {
                                _logger.LogWarning("Scheduled item {ItemId} not found in Jellyfin library — removing from schedule.", item.ItemId);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to delete item {ItemId}", item.ItemId);
                        remaining.Add(item);
                    }

                    processed++;
                    progress.Report((double)processed / toDelete.Count * 90);
                }

                await _repository.WriteListAsync(filename, remaining);
                _logger.LogInformation("Scheduled Deletion run complete. Deleted {Count} items.", processed);
            }

            progress.Report(100);
        }

        /// <summary>
        /// Walks up the Jellyfin item hierarchy to find the Series parent.
        /// Used for Season and Episode items that don't carry a direct TVDB ID.
        /// </summary>
        private MediaBrowser.Controller.Entities.BaseItem? GetParentSeries(MediaBrowser.Controller.Entities.BaseItem item)
        {
            var parent = item.GetParent();
            while (parent != null)
            {
                if (parent.GetBaseItemKind() == BaseItemKind.Series)
                    return parent;
                parent = parent.GetParent();
            }
            return null;
        }

        /// <summary>
        /// Deletes a movie from Radarr using its TMDB ID so it won't be re-imported.
        /// </summary>
        private async Task DeleteFromRadarr(string name, IReadOnlyDictionary<string, string> providerIds)
        {
            try
            {
                var config = Plugin.Instance?.Configuration;
                if (config == null || string.IsNullOrEmpty(config.RadarrUrl) || string.IsNullOrEmpty(config.RadarrApiKey))
                    return;

                if (!providerIds.TryGetValue("Tmdb", out var tmdbId))
                {
                    _logger.LogDebug("[ArrDelete] No TMDB ID on {Name} — skipping Radarr delete", name);
                    return;
                }

                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("X-Api-Key", config.RadarrApiKey);
                client.Timeout = TimeSpan.FromSeconds(15);
                var baseUrl = config.RadarrUrl.TrimEnd('/');

                // Look up by TMDB ID
                var lookupResp = await client.GetAsync($"{baseUrl}/api/v3/movie?tmdbId={tmdbId}").ConfigureAwait(false);
                if (!lookupResp.IsSuccessStatusCode) return;

                var body = await lookupResp.Content.ReadAsStringAsync().ConfigureAwait(false);
                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;

                // Radarr returns an array
                JsonElement? movie = null;
                if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
                    movie = root[0];
                else if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("id", out _))
                    movie = root;

                if (movie == null || !movie.Value.TryGetProperty("id", out var idEl)) return;
                var radarrId = idEl.GetInt32();

                // Delete from Radarr — deleteFiles=true removes the disk copy,
                // addImportExclusion=true prevents Radarr from ever re-adding this movie.
                var delResp = await client.DeleteAsync($"{baseUrl}/api/v3/movie/{radarrId}?deleteFiles=true&addImportExclusion=true").ConfigureAwait(false);
                if (delResp.IsSuccessStatusCode)
                    _logger.LogInformation("[ArrDelete] Deleted '{Name}' (Radarr ID {Id}) from Radarr with import exclusion", name, radarrId);
                else
                    _logger.LogWarning("[ArrDelete] Radarr delete returned {Status} for '{Name}'", delResp.StatusCode, name);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[ArrDelete] Error deleting '{Name}' from Radarr", name);
            }
        }

        /// <summary>
        /// Deletes a series from Sonarr using its TVDB ID so it won't be re-imported.
        /// </summary>
        private async Task DeleteFromSonarr(string name, IReadOnlyDictionary<string, string> providerIds)
        {
            try
            {
                var config = Plugin.Instance?.Configuration;
                if (config == null || string.IsNullOrEmpty(config.SonarrUrl) || string.IsNullOrEmpty(config.SonarrApiKey))
                    return;

                if (!providerIds.TryGetValue("Tvdb", out var tvdbId))
                {
                    _logger.LogDebug("[ArrDelete] No TVDB ID on {Name} — skipping Sonarr delete", name);
                    return;
                }

                var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("X-Api-Key", config.SonarrApiKey);
                client.Timeout = TimeSpan.FromSeconds(15);
                var baseUrl = config.SonarrUrl.TrimEnd('/');

                // Look up by TVDB ID
                var lookupResp = await client.GetAsync($"{baseUrl}/api/v3/series?tvdbId={tvdbId}").ConfigureAwait(false);
                if (!lookupResp.IsSuccessStatusCode) return;

                var body = await lookupResp.Content.ReadAsStringAsync().ConfigureAwait(false);
                using var doc = JsonDocument.Parse(body);
                var root = doc.RootElement;

                JsonElement? series = null;
                if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
                    series = root[0];

                if (series == null || !series.Value.TryGetProperty("id", out var idEl)) return;
                var sonarrId = idEl.GetInt32();

                // Delete from Sonarr — deleteFiles=true removes the disk copy,
                // addImportExclusion=true prevents Sonarr from ever re-adding this series.
                var delResp = await client.DeleteAsync($"{baseUrl}/api/v3/series/{sonarrId}?deleteFiles=true&addImportExclusion=true").ConfigureAwait(false);
                if (delResp.IsSuccessStatusCode)
                    _logger.LogInformation("[ArrDelete] Deleted '{Name}' (Sonarr ID {Id}) from Sonarr with import exclusion", name, sonarrId);
                else
                    _logger.LogWarning("[ArrDelete] Sonarr delete returned {Status} for '{Name}'", delResp.StatusCode, name);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[ArrDelete] Error deleting '{Name}' from Sonarr", name);
            }
        }
    }
}
