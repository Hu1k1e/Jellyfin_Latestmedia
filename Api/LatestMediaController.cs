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
    [Authorize]
    public class LatestMediaController : ControllerBase
    {
        private readonly ILibraryManager _libraryManager;
        private readonly IDtoService _dtoService;
        private readonly PluginRepository _repository;

        public LatestMediaController(
            ILibraryManager libraryManager,
            IDtoService dtoService)
        {
            _libraryManager = libraryManager;
            _dtoService = dtoService;
            _repository = Plugin.Instance.Repository;
        }

        [HttpGet("Items")]
        public ActionResult<IEnumerable<LatestMediaItem>> GetLatestItems()
        {
            var config = Plugin.Instance?.Configuration;
            if (config != null && !config.EnableLatestMediaButton)
            {
                return BadRequest("Latest Media feature is disabled.");
            }

            int count = config?.LatestMediaCount ?? 50;
            
            // Query for latest added items, ensuring we only get video media (Movies, Episodes, Anime)
            var query = new InternalItemsQuery
            {
                IncludeItemTypes = new[] { BaseItemKind.Movie, BaseItemKind.Episode, BaseItemKind.Series },
                IsFolder = false,
                Recursive = true
            };

            var items = _libraryManager.GetItemList(query)
                .OrderByDescending(i => i.DateCreated)
                .Take(count);
            var result = new List<LatestMediaItem>();

            foreach (var item in items)
            {
                string type = item.GetType().Name;
                if (item.Genres != null && item.Genres.Any(g => g.Contains("Anime", StringComparison.OrdinalIgnoreCase)))
                {
                    type = "Anime";
                }
                
                result.Add(new LatestMediaItem
                {
                    Id = item.Id.ToString("N"),
                    Title = item.Name,
                    Type = type,
                    ProductionYear = item.ProductionYear,
                    DateAdded = item.DateCreated,
                    PosterUrl = $"/Items/{item.Id}/Images/Primary"
                });
            }

            return Ok(result);
        }

        [HttpGet("LeavingSoon")]
        public async Task<ActionResult<IEnumerable<LeavingSoonItem>>> GetLeavingSoon()
        {
            var scheduled = await _repository.ReadListAsync<ScheduledDeletion>("scheduled_deletions");
            
            var result = new List<LeavingSoonItem>();
            var now = DateTime.UtcNow;

            foreach (var s in scheduled)
            {
                if (Guid.TryParse(s.ItemId, out var parsedGuid))
                {
                    var item = _libraryManager.GetItemById(parsedGuid);
                    if (item != null)
                    {
                        var remaining = (s.ScheduledTime - now).TotalDays;
                        int daysRemaining = remaining < 0 ? 0 : (int)Math.Ceiling(remaining);
                        
                        string type = item.GetType().Name;
                        if (item.Genres != null && item.Genres.Any(g => g.Contains("Anime", StringComparison.OrdinalIgnoreCase)))
                        {
                            type = "Anime";
                        }

                        // Get series/season context for episodes
                        string seriesName = null;
                        string seasonName = null;
                        if (type == "Episode" && item.ParentId != Guid.Empty)
                        {
                            var season = _libraryManager.GetItemById(item.ParentId);
                            if (season != null)
                            {
                                seasonName = season.Name;
                                if (season.ParentId != Guid.Empty)
                                {
                                    var series = _libraryManager.GetItemById(season.ParentId);
                                    if (series != null) seriesName = series.Name;
                                }
                            }
                        }

                        result.Add(new LeavingSoonItem
                        {
                            Id = s.ItemId,
                            Title = item.Name,
                            ScheduledDate = s.ScheduledTime,
                            DaysRemaining = daysRemaining,
                            Type = type,
                            PosterUrl = $"/Items/{parsedGuid}/Images/Primary",
                            SeriesName = seriesName,
                            SeasonName = seasonName
                        });
                    }
                }
            }
            
            // Order by closest deletion date
            return Ok(result.OrderBy(x => x.ScheduledDate).ToList());
        }
    }
}
