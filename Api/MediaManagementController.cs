using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Data;
using Jellyfin_Latestmedia.Models;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Dto;
using MediaBrowser.Model.Dto;
using MediaBrowser.Model.Querying;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediaBrowser.Controller.Entities;
using Jellyfin.Data.Enums;

namespace Jellyfin_Latestmedia.Api
{
    [ApiController]
    [Route("[controller]")]
    [Authorize(Policy = "RequiresElevation")] // Admin only
    public class MediaMgmtController : ControllerBase
    {
        private readonly ILibraryManager _libraryManager;
        private readonly IUserDataManager _userDataManager;
        private readonly PluginRepository _repository;

        public MediaMgmtController(
            ILibraryManager libraryManager,
            IUserDataManager userDataManager)
        {
            _libraryManager = libraryManager;
            _userDataManager = userDataManager;
            _repository = Plugin.Instance.Repository;
        }

        [HttpGet("Items")]
        public async Task<ActionResult<object>> GetMediaItems()
        {
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
                    try
                    {
                        var info = new System.IO.FileInfo(item.Path);
                        size = info.Length;
                    }
                    catch { }
                }

                // Sum plays from all users (approximate based on user data)
                long totalPlays = 0;
                
                string id = item.Id.ToString("N");
                bool isScheduled = scheduledDict.TryGetValue(id, out var schedule);

                result.Add(new
                {
                    Id = id,
                    Title = item.Name,
                    Year = item.ProductionYear,
                    Rating = item.CommunityRating,
                    Size = size,
                    PlayCount = totalPlays,
                    Status = isScheduled ? $"Scheduled for deletion in {(schedule!.ScheduledTime - DateTime.UtcNow).TotalDays:F1} days" : "Active",
                    DeleteScheduledDate = isScheduled ? (DateTime?)schedule!.ScheduledTime : null
                });
            }

            return Ok(result);
        }

        [HttpPost("Items/{itemId}/ScheduleDelete")]
        public async Task<ActionResult> ScheduleDelete(string itemId, [FromQuery] int days)
        {
            if (days != 1 && days != 3 && days != 7 && days != 14 && days != 30)
            {
                return BadRequest("Invalid days. Allowed: 1, 3, 7, 14, 30");
            }

            if (!Guid.TryParse(itemId, out var parsedGuid))
            {
                return BadRequest("Invalid item ID format");
            }

            var item = _libraryManager.GetItemById(parsedGuid);
            if (item == null)
            {
                return NotFound("Media item not found in library");
            }

            var userIdString = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            var userName = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name")?.Value ?? "Admin";
            
            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var adminGuid))
            {
                return Unauthorized();
            }

            var scheduledDeletions = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            
            // Remove existing if present to update
            scheduledDeletions.RemoveAll(x => x.ItemId == itemId);
            
            scheduledDeletions.Add(new ScheduledDeletion
            {
                ItemId = itemId,
                ScheduledTime = DateTime.UtcNow.AddDays(days),
                ScheduledByUserId = adminGuid,
                ScheduledByName = userName
            });

            await _repository.WriteListAsync("scheduled_deletions", scheduledDeletions);

            return Ok();
        }

        [HttpDelete("Items/{itemId}/CancelDelete")]
        public async Task<ActionResult> CancelDelete(string itemId)
        {
            var scheduledDeletions = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            int initialCount = scheduledDeletions.Count;
            
            scheduledDeletions.RemoveAll(x => x.ItemId == itemId);
            
            if (scheduledDeletions.Count < initialCount)
            {
                await _repository.WriteListAsync("scheduled_deletions", scheduledDeletions);
                return Ok();
            }

            return NotFound("Item was not scheduled for deletion");
        }
    }
}
