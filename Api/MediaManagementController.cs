using System;
using System.Collections.Generic;
using System.Linq;
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
        private readonly PluginRepository _repository;

        public MediaMgmtController(ILibraryManager libraryManager, IUserManager userManager, ISessionManager sessionManager)
        {
            _libraryManager = libraryManager;
            _userManager = userManager;
            _sessionManager = sessionManager;
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
                    Status = isScheduled
                        ? $"Deleting in {Math.Max(0, (schedule!.ScheduledTime - DateTime.UtcNow).TotalDays):F0}d"
                        : "Active"
                });
            }

            return Ok(result);
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
                string seriesStatus = seriesSched && schedDict.TryGetValue(seriesIdN, out var ss)
                    ? $"Deleting in {Math.Max(0, (ss.ScheduledTime - DateTime.UtcNow).TotalDays):F0}d" : "Active";

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
                    string seasonStatus = seasonSched && schedDict.TryGetValue(seasonIdN, out var ses)
                        ? $"Deleting in {Math.Max(0, (ses.ScheduledTime - DateTime.UtcNow).TotalDays):F0}d" : "Active";

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
                        string epStatus = epSched && schedDict.TryGetValue(epIdN, out var es)
                            ? $"Deleting in {Math.Max(0, (es.ScheduledTime - DateTime.UtcNow).TotalDays):F0}d" : "Active";

                        long sz = 0;
                        if (!string.IsNullOrEmpty(ep.Path) && System.IO.File.Exists(ep.Path))
                        { try { sz = new System.IO.FileInfo(ep.Path).Length; } catch { } }

                        return new
                        {
                            Id = ep.Id.ToString("N"),
                            Title = ep.Name,
                            Episode = ep.IndexNumber,
                            Size = sz,
                            Status = epStatus
                        };
                    }).ToList();

                    seasonList.Add(new
                    {
                        Id = season.Id.ToString("N"),
                        Title = season.Name,
                        SeasonNumber = season.IndexNumber,
                        EpisodeCount = epList.Count,
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


    }
}
