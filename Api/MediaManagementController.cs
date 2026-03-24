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

namespace Jellyfin_Latestmedia.Api
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class MediaMgmtController : ControllerBase
    {
        private readonly ILibraryManager _libraryManager;
        private readonly IUserManager _userManager;
        private readonly PluginRepository _repository;

        public MediaMgmtController(ILibraryManager libraryManager, IUserManager userManager)
        {
            _libraryManager = libraryManager;
            _userManager = userManager;
            _repository = Plugin.Instance.Repository;
        }

        private Guid GetRequestUserId()
        {
            var str = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            return Guid.TryParse(str, out var g) ? g : Guid.Empty;
        }

        private bool IsAdmin()
        {
            // Jellyfin 10.11 sets an "Administrator" role claim on the JWT for admin users
            if (User.IsInRole("Administrator")) return true;

            // Fallback: check via user manager without any extension methods
            var uid = GetRequestUserId();
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
            if (!IsAdmin()) return Forbid();

            var scheduledDeletions = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            var scheduledDict = scheduledDeletions.ToDictionary(k => k.ItemId, v => v);

            var query = new InternalItemsQuery
            {
                IncludeItemTypes = new[] { BaseItemKind.Movie, BaseItemKind.Series, BaseItemKind.Episode },
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

                // Use both N-format (no hyphens) and standard format for matching
                string idN = item.Id.ToString("N");
                string idD = item.Id.ToString("D"); // with hyphens
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

        // Accept days as string to avoid automatic model-binding 400 on parse failure
        [HttpPost("Items/{itemId}/ScheduleDelete")]
        public async Task<ActionResult> ScheduleDelete(string itemId, [FromQuery] string? days)
        {
            if (!IsAdmin()) return Forbid();

            if (!int.TryParse(days, out var daysInt) || daysInt <= 0 || daysInt > 365)
                return BadRequest($"Invalid days value: '{days}'. Must be a positive integer up to 365.");

            if (string.IsNullOrWhiteSpace(itemId))
                return BadRequest("itemId is required.");

            // Normalise to N format (no hyphens) for consistent storage
            string normalizedId = itemId.Replace("-", "").ToLowerInvariant();

            var uid = GetRequestUserId();
            var user = _userManager.GetUserById(uid);
            var name = user?.Username ?? "Admin";

            var deletions = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            deletions.RemoveAll(x => x.ItemId.Replace("-", "").ToLowerInvariant() == normalizedId);
            deletions.Add(new ScheduledDeletion
            {
                ItemId = normalizedId,
                ScheduledTime = DateTime.UtcNow.AddDays(daysInt),
                ScheduledByUserId = uid,
                ScheduledByName = name
            });

            await _repository.WriteListAsync("scheduled_deletions", deletions);
            return Ok();
        }

        [HttpDelete("Items/{itemId}/CancelDelete")]
        public async Task<ActionResult> CancelDelete(string itemId)
        {
            if (!IsAdmin()) return Forbid();

            string normalizedId = itemId.Replace("-", "").ToLowerInvariant();
            var deletions = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            int before = deletions.Count;
            deletions.RemoveAll(x => x.ItemId.Replace("-", "").ToLowerInvariant() == normalizedId);

            if (deletions.Count < before)
            {
                await _repository.WriteListAsync("scheduled_deletions", deletions);
                return Ok();
            }
            return NotFound("Item not scheduled for deletion.");
        }
    }
}
