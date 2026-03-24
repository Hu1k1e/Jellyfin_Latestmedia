using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Data;
using Jellyfin_Latestmedia.Models;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Querying;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediaBrowser.Controller.Entities;
using Jellyfin.Data.Enums;
using Jellyfin.Extensions;

namespace Jellyfin_Latestmedia.Api
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]  // Standard auth — we check IsAdministrator manually to avoid RequiresElevation (needs API key, not user token)
    public class MediaMgmtController : ControllerBase
    {
        private readonly ILibraryManager _libraryManager;
        private readonly IUserDataManager _userDataManager;
        private readonly IUserManager _userManager;
        private readonly PluginRepository _repository;

        public MediaMgmtController(
            ILibraryManager libraryManager,
            IUserDataManager userDataManager,
            IUserManager userManager)
        {
            _libraryManager = libraryManager;
            _userDataManager = userDataManager;
            _userManager = userManager;
            _repository = Plugin.Instance.Repository;
        }

        private Guid GetUserId()
        {
            var str = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            return Guid.TryParse(str, out var g) ? g : Guid.Empty;
        }

        private bool IsAdmin()
        {
            // Jellyfin sets the "Administrator" role claim for admin users in the JWT
            return User.IsInRole("Administrator");
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

                string id = item.Id.ToString("N");
                bool isScheduled = scheduledDict.TryGetValue(id, out var schedule);

                result.Add(new
                {
                    Id = id,
                    Title = item.Name,
                    Year = item.ProductionYear,
                    Rating = item.CommunityRating,
                    Size = size,
                    Status = isScheduled
                        ? $"Scheduled for deletion in {Math.Max(0, (schedule!.ScheduledTime - DateTime.UtcNow).TotalDays):F1} days"
                        : "Active",
                    DeleteScheduledDate = isScheduled ? (DateTime?)schedule!.ScheduledTime : null
                });
            }

            return Ok(result);
        }

        [HttpPost("Items/{itemId}/ScheduleDelete")]
        public async Task<ActionResult> ScheduleDelete(string itemId, [FromQuery] int days)
        {
            if (!IsAdmin()) return Forbid();

            if (days != 1 && days != 3 && days != 7 && days != 14 && days != 30)
                return BadRequest("Invalid days. Allowed: 1, 3, 7, 14, 30");

            if (!Guid.TryParse(itemId, out var parsedGuid))
                return BadRequest("Invalid item ID format");

            var item = _libraryManager.GetItemById(parsedGuid);
            if (item == null)
                return NotFound("Media item not found in library");

            var uid = GetUserId();
            var user = _userManager.GetUserById(uid);
            var userName = user?.Username ?? "Admin";

            var scheduledDeletions = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            scheduledDeletions.RemoveAll(x => x.ItemId == itemId);
            scheduledDeletions.Add(new ScheduledDeletion
            {
                ItemId = itemId,
                ScheduledTime = DateTime.UtcNow.AddDays(days),
                ScheduledByUserId = uid,
                ScheduledByName = userName
            });

            await _repository.WriteListAsync("scheduled_deletions", scheduledDeletions);
            return Ok();
        }

        [HttpDelete("Items/{itemId}/CancelDelete")]
        public async Task<ActionResult> CancelDelete(string itemId)
        {
            if (!IsAdmin()) return Forbid();

            var scheduledDeletions = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            int before = scheduledDeletions.Count;
            scheduledDeletions.RemoveAll(x => x.ItemId == itemId);

            if (scheduledDeletions.Count < before)
            {
                await _repository.WriteListAsync("scheduled_deletions", scheduledDeletions);
                return Ok();
            }

            return NotFound("Item was not scheduled for deletion");
        }
    }
}
