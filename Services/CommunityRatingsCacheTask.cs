using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MediaBrowser.Model.Tasks;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Dto;
using Jellyfin.Data.Enums;

namespace Jellyfin_Latestmedia.Services
{
    public class CommunityRatingsCacheTask : IScheduledTask
    {
        private readonly ILibraryManager _libraryManager;
        private readonly ILogger<CommunityRatingsCacheTask> _logger;

        public CommunityRatingsCacheTask(ILibraryManager libraryManager, ILogger<CommunityRatingsCacheTask> logger)
        {
            _libraryManager = libraryManager;
            _logger = logger;
        }

        public string Name => "Cache Community Ratings for UI Fast-Loading";

        public string Key => "LatestMediaCommunityRatingsCache";

        public string Description => "Extracts and caches CommunityRatings from all media items to an internal JSON file so the frontend UI can hydrate star ratings on cards entirely instantaneously without iterative REST queries.";

        public string Category => "Latest Media";

        public IEnumerable<TaskTriggerInfo> GetDefaultTriggers()
        {
            return new[]
            {
                new TaskTriggerInfo
                {
                    Type = TaskTriggerInfoType.IntervalTrigger,
                    IntervalTicks = TimeSpan.FromHours(12).Ticks
                }
            };
        }

        public async Task ExecuteAsync(IProgress<double> progress, CancellationToken cancellationToken)
        {
            progress.Report(0);

            var query = new InternalItemsQuery
            {
                IncludeItemTypes = new[] { BaseItemKind.Movie, BaseItemKind.Series, BaseItemKind.Season, BaseItemKind.Episode },
                IsVirtualItem = false
            };

            var items = _libraryManager.GetItemList(query);
            var ratingsDict = new Dictionary<string, float>();

            int total = items.Count;
            int current = 0;

            foreach (var item in items)
            {
                cancellationToken.ThrowIfCancellationRequested();

                if (item.CommunityRating.HasValue)
                {
                    ratingsDict[item.Id.ToString("N")] = item.CommunityRating.Value;
                }

                current++;
                if (current % 100 == 0)
                {
                    double percent = ((double)current / total) * 95.0;
                    progress.Report(percent);
                }
            }

            // Write dictionary to plugin repository using standard infrastructure
            await Plugin.Instance.Repository.WriteItemAsync("community_ratings_cache", ratingsDict);

            progress.Report(100);
            _logger.LogInformation("Successfully cached {Count} community ratings for fast-loading UI.", ratingsDict.Count);
        }
    }
}
