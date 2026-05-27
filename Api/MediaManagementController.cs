using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Data;
using Jellyfin_Latestmedia.Models;
using MediaBrowser.Controller.Library;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediaBrowser.Controller.Entities;
using Jellyfin.Data.Enums;
using MediaBrowser.Controller.Session;

namespace Jellyfin_Latestmedia.Api
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class MediaMgmtController : ControllerBase
    {
        private readonly ILibraryManager _libraryManager;
        private readonly IUserManager _userManager;
        private readonly ISessionManager _sessionManager;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly PluginRepository _repository;

        public MediaMgmtController(ILibraryManager libraryManager, IUserManager userManager, ISessionManager sessionManager, IHttpClientFactory httpClientFactory)
        {
            _libraryManager = libraryManager;
            _userManager = userManager;
            _sessionManager = sessionManager;
            _httpClientFactory = httpClientFactory;
            _repository = Plugin.Instance.Repository;
        }

        private async Task<Guid> GetRequestUserIdAsync()
        {
            var str = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (Guid.TryParse(str, out var g)) return g;

            var authHeader = Request.Headers["X-Emby-Authorization"].FirstOrDefault() ?? Request.Headers["Authorization"].FirstOrDefault();
            if (!string.IsNullOrEmpty(authHeader))
            {
                var match = System.Text.RegularExpressions.Regex.Match(authHeader, @"Token=""([^""]+)""");
                if (match.Success)
                {
                    var session = await _sessionManager.GetSessionByAuthenticationToken(match.Groups[1].Value, null, null).ConfigureAwait(false);
                    if (session != null) return session.UserId;
                }
            }
            return Guid.Empty;
        }

        private async Task<bool> IsAdminAsync()
        {
            // Jellyfin 10.11 sets an "Administrator" role claim on the JWT for admin users
            if (User.IsInRole("Administrator")) return true;

            // Fallback: check via user manager without any extension methods
            var uid = await GetRequestUserIdAsync().ConfigureAwait(false);
            if (uid == Guid.Empty) return false;
            var user = _userManager.GetUserById(uid);
            if (user == null) return false;
            // user.Permissions is IList<MediaBrowser.Model.Configuration.AccessSchedule> — not what we want
            // Instead read the raw JSON-serialised policy
            try
            {
                var policy = user.GetType().GetProperty("Policy")?.GetValue(user);
                if (policy != null)
                {
                    var isAdmin = policy.GetType().GetProperty("IsAdministrator")?.GetValue(policy);
                    if (isAdmin is bool b) return b;
                }
            }
            catch { }
            return false;
        }

        [HttpGet("Items")]
        public async Task<ActionResult<object>> GetMediaItems()
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();

            var scheduledDeletions = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            var scheduledDict = scheduledDeletions.ToDictionary(k => k.ItemId, v => v);

            var query = new InternalItemsQuery
            {
                IncludeItemTypes = new[] { BaseItemKind.Movie },
                IsFolder = false,
                Recursive = true
            };

            var items = _libraryManager.GetItemList(query);
            var result = new List<object>();

            foreach (var item in items)
            {
                long size = 0;
                if (!string.IsNullOrEmpty(item.Path) && System.IO.File.Exists(item.Path))
                {
                    try { size = new System.IO.FileInfo(item.Path).Length; } catch { }
                }

                string idN = item.Id.ToString("N");
                string idD = item.Id.ToString("D");
                bool isScheduled = scheduledDict.TryGetValue(idN, out var schedule) ||
                                   scheduledDict.TryGetValue(idD, out schedule);

                result.Add(new
                {
                    Id = idN,
                    Title = item.Name,
                    Year = item.ProductionYear,
                    Size = size,
                    ScheduledTime = isScheduled ? schedule?.ScheduledTime : (DateTime?)null,
                    Status = isScheduled ? "Scheduled" : "Active"
                });
            }

            return Ok(result);
        }

        [HttpGet("Scheduled")]
        public async Task<ActionResult<object>> GetScheduledItems()
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();

            var scheduledDeletions = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            var result = new List<object>();

            foreach (var sched in scheduledDeletions)
            {
                if (Guid.TryParse(sched.ItemId, out var guid))
                {
                    var item = _libraryManager.GetItemById(guid);
                    if (item != null)
                    {
                        result.Add(new
                        {
                            Id = sched.ItemId,
                            Title = item.Name,
                            Type = item.GetType().Name,
                            ScheduledByName = sched.ScheduledByName,
                            DaysRemaining = Math.Max(0, (sched.ScheduledTime - DateTime.UtcNow).TotalDays),
                            ScheduledTime = sched.ScheduledTime
                        });
                    }
                }
            }

            return Ok(result.OrderBy(r => ((dynamic)r).DaysRemaining));
        }

        [HttpGet("Series")]
        public async Task<ActionResult<object>> GetSeriesHierarchy()
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();

            var scheduledDeletions = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            var schedSet = new HashSet<string>(scheduledDeletions.Select(s => s.ItemId.Replace("-", "").ToLowerInvariant()));
            var schedDict = scheduledDeletions.ToDictionary(k => k.ItemId.Replace("-", "").ToLowerInvariant(), v => v);

            // Get all series containers
            var seriesQuery = new InternalItemsQuery
            {
                IncludeItemTypes = new[] { BaseItemKind.Series },
                Recursive = true
            };
            var allSeries = _libraryManager.GetItemList(seriesQuery);

            var result = new List<object>();

            foreach (var series in allSeries)
            {
                string seriesIdN = series.Id.ToString("N").ToLowerInvariant();
                bool seriesSched = schedSet.Contains(seriesIdN);
                DateTime? sTime = seriesSched && schedDict.TryGetValue(seriesIdN, out var ss) ? ss.ScheduledTime : (DateTime?)null;
                string seriesStatus = seriesSched ? "Scheduled" : "Active";

                // Get seasons for this series
                var seasonQuery = new InternalItemsQuery
                {
                    ParentId = series.Id,
                    IncludeItemTypes = new[] { BaseItemKind.Season },
                    Recursive = false
                };
                var seasons = _libraryManager.GetItemList(seasonQuery).OrderBy(s => s.IndexNumber ?? 0).ToList();

                var seasonList = new List<object>();
                foreach (var season in seasons)
                {
                    string seasonIdN = season.Id.ToString("N").ToLowerInvariant();
                    bool seasonSched = schedSet.Contains(seasonIdN);
                    DateTime? snTime = seasonSched && schedDict.TryGetValue(seasonIdN, out var ses) ? ses.ScheduledTime : (DateTime?)null;
                    string seasonStatus = seasonSched ? "Scheduled" : "Active";

                    // Get episodes for this season
                    var epQuery = new InternalItemsQuery
                    {
                        ParentId = season.Id,
                        IncludeItemTypes = new[] { BaseItemKind.Episode },
                        Recursive = false
                    };
                    var episodes = _libraryManager.GetItemList(epQuery).OrderBy(e => e.IndexNumber ?? 0).ToList();

                    var epList = episodes.Select(ep =>
                    {
                        string epIdN = ep.Id.ToString("N").ToLowerInvariant();
                        bool epSched = schedSet.Contains(epIdN);
                        DateTime? epTime = epSched && schedDict.TryGetValue(epIdN, out var es) ? es.ScheduledTime : (DateTime?)null;
                        string epStatus = epSched ? "Scheduled" : "Active";

                        long sz = 0;
                        if (!string.IsNullOrEmpty(ep.Path) && System.IO.File.Exists(ep.Path))
                        { try { sz = new System.IO.FileInfo(ep.Path).Length; } catch { } }

                        return new
                        {
                            Id = ep.Id.ToString("N"),
                            Title = ep.Name,
                            Episode = ep.IndexNumber,
                            Size = sz,
                            ScheduledTime = epTime,
                            Status = epStatus
                        };
                    }).ToList();

                    seasonList.Add(new
                    {
                        Id = season.Id.ToString("N"),
                        Title = season.Name,
                        SeasonNumber = season.IndexNumber,
                        EpisodeCount = epList.Count,
                        ScheduledTime = snTime,
                        Status = seasonStatus,
                        Episodes = epList
                    });
                }

                result.Add(new
                {
                    Id = series.Id.ToString("N"),
                    Title = series.Name,
                    Year = series.ProductionYear,
                    SeasonCount = seasonList.Count,
                    ScheduledTime = sTime,
                    Status = seriesStatus,
                    Seasons = seasonList
                });
            }

            return Ok(result);
        }

        // Match K3ntas route and type binding to prevent 400 errors
        [HttpPost("Items/{itemId}/ScheduleDelete")]
        public async Task<ActionResult> ScheduleDelete([FromRoute] Guid itemId, [FromQuery] int? days = null)
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();

            var actualDelayDays = days ?? 7;
            if (actualDelayDays < 1 || actualDelayDays > 365)
                return BadRequest("Invalid days value. Must be a positive integer up to 365.");

            var uid = await GetRequestUserIdAsync().ConfigureAwait(false);
            var user = _userManager.GetUserById(uid);
            var name = user?.Username ?? "Admin";

            string normalizedId = itemId.ToString("N");

            var deletions = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            deletions.RemoveAll(x => x.ItemId.Replace("-", "").ToLowerInvariant() == normalizedId);
            deletions.Add(new ScheduledDeletion
            {
                ItemId = normalizedId,
                ScheduledTime = DateTime.UtcNow.AddDays(actualDelayDays),
                ScheduledByUserId = uid,
                ScheduledByName = name
            });

            await _repository.WriteListAsync("scheduled_deletions", deletions);
            return Ok(new { success = true });
        }

        [HttpDelete("Items/{itemId}/CancelDelete")]
        public async Task<ActionResult> CancelDelete([FromRoute] Guid itemId)
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();

            string normalizedId = itemId.ToString("N");
            var deletions = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            var count = deletions.RemoveAll(x => x.ItemId.Replace("-", "").ToLowerInvariant() == normalizedId);

            if (count > 0)
                await _repository.WriteListAsync("scheduled_deletions", deletions);

            return Ok(new { success = true });
        }
        [HttpPost("Items/{itemId}/DeleteNow")]
        public async Task<ActionResult> DeleteNow([FromRoute] Guid itemId)
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();

            if (!Guid.TryParse(itemId.ToString(), out var parsedGuid))
                return BadRequest("Invalid item ID.");

            var libraryItem = _libraryManager.GetItemById(parsedGuid);
            if (libraryItem == null)
                return NotFound(new { error = "Item not found in Jellyfin library." });

            var config = Plugin.Instance?.Configuration;
            if (config == null)
                return StatusCode(500, new { error = "Plugin configuration unavailable." });

            var kind = libraryItem.GetBaseItemKind();
            bool success = false;
            string arrError = string.Empty;

            try
            {
                if (kind == BaseItemKind.Movie)
                {
                    (success, arrError) = await DeleteFromArrNow(
                        libraryItem.Name, libraryItem.ProviderIds,
                        config.RadarrUrl, config.RadarrApiKey,
                        "movie", "tmdbId", "Tmdb", "Radarr").ConfigureAwait(false);
                }
                else if (kind == BaseItemKind.Series)
                {
                    (success, arrError) = await DeleteFromArrNow(
                        libraryItem.Name, libraryItem.ProviderIds,
                        config.SonarrUrl, config.SonarrApiKey,
                        "series", "tvdbId", "Tvdb", "Sonarr").ConfigureAwait(false);
                }
                else if (kind == BaseItemKind.Season || kind == BaseItemKind.Episode)
                {
                    // Walk up to parent Series for the TVDB ID
                    var parent = libraryItem.GetParent();
                    while (parent != null && parent.GetBaseItemKind() != BaseItemKind.Series)
                        parent = parent.GetParent();

                    if (parent == null)
                        return BadRequest(new { error = "Could not resolve parent Series for this Season/Episode." });

                    (success, arrError) = await DeleteFromArrNow(
                        parent.Name, parent.ProviderIds,
                        config.SonarrUrl, config.SonarrApiKey,
                        "series", "tvdbId", "Tvdb", "Sonarr").ConfigureAwait(false);
                }
                else
                {
                    return BadRequest(new { error = $"Unsupported item type: {kind}" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }

            if (!success)
                return StatusCode(502, new { error = arrError });

            // Remove from scheduled_deletions if it was queued
            string normalizedId = itemId.ToString("N");
            var deletions = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            int removed = deletions.RemoveAll(x => x.ItemId.Replace("-", "").ToLowerInvariant() == normalizedId);
            if (removed > 0)
                await _repository.WriteListAsync("scheduled_deletions", deletions);

            return Ok(new { success = true, message = $"'{libraryItem.Name}' deleted from arr. Jellyfin will remove it on next library scan." });
        }

        /// <summary>
        /// Shared immediate-delete helper for both Radarr and Sonarr.
        /// Pings /api/v3/system/status first, then looks up and deletes the item.
        /// Returns (success, errorMessage).
        /// </summary>
        private async Task<(bool, string)> DeleteFromArrNow(
            string name,
            IReadOnlyDictionary<string, string> providerIds,
            string baseUrl,
            string apiKey,
            string resourcePath,   // "movie" or "series"
            string idQueryParam,   // "tmdbId" or "tvdbId"
            string providerKey,    // "Tmdb" or "Tvdb"
            string label)
        {
            if (string.IsNullOrEmpty(baseUrl) || string.IsNullOrEmpty(apiKey))
                return (false, $"{label} not configured in plugin settings.");

            if (!providerIds.TryGetValue(providerKey, out var externalId))
                return (false, $"No {providerKey} ID found on '{name}' — cannot look up in {label}.");

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("X-Api-Key", apiKey);
            client.Timeout = TimeSpan.FromSeconds(15);
            var cleanBase = baseUrl.TrimEnd('/');

            // 1. Connectivity check
            var pingResp = await client.GetAsync($"{cleanBase}/api/v3/system/status").ConfigureAwait(false);
            if (!pingResp.IsSuccessStatusCode)
                return (false, $"{label} is not reachable (HTTP {(int)pingResp.StatusCode}). Check your configuration.");

            // 2. Look up the item
            var lookupResp = await client.GetAsync($"{cleanBase}/api/v3/{resourcePath}?{idQueryParam}={externalId}").ConfigureAwait(false);
            if (!lookupResp.IsSuccessStatusCode)
                return (false, $"{label} lookup failed (HTTP {(int)lookupResp.StatusCode}).");

            var body = await lookupResp.Content.ReadAsStringAsync().ConfigureAwait(false);
            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;

            JsonElement? found = null;
            if (root.ValueKind == JsonValueKind.Array && root.GetArrayLength() > 0)
                found = root[0];
            else if (root.ValueKind == JsonValueKind.Object && root.TryGetProperty("id", out _))
                found = root;

            if (found == null || !found.Value.TryGetProperty("id", out var idEl))
                return (false, $"'{name}' not found in {label} library.");

            var arrId = idEl.GetInt32();

            // 3. Delete — deleteFiles=true, addImportExclusion=false
            var delResp = await client.DeleteAsync(
                $"{cleanBase}/api/v3/{resourcePath}/{arrId}?deleteFiles=true&addImportExclusion=false"
            ).ConfigureAwait(false);

            if (delResp.IsSuccessStatusCode)
                return (true, string.Empty);

            return (false, $"{label} delete returned HTTP {(int)delResp.StatusCode}.");
        }
    }
}
