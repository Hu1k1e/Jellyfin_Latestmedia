using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Data;
using Jellyfin_Latestmedia.Models;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Tasks;
using Microsoft.Extensions.Logging;

namespace Jellyfin_Latestmedia.Services
{
    public class DeletionSchedulerService : IScheduledTask
    {
        private readonly ILogger<DeletionSchedulerService> _logger;
        private readonly PluginRepository _repository;
        private readonly ILibraryManager _libraryManager;

        public DeletionSchedulerService(
            ILogger<DeletionSchedulerService> logger,
            ILibraryManager libraryManager)
        {
            _logger = logger;
            _repository = Plugin.Instance.Repository;
            _libraryManager = libraryManager;
        }

        public string Name => "Mange Media: Scheduled Deletions";

        public string Key => "LatestMediaDeletionTask";

        public string Description => "Checks for media items scheduled for deletion and removes them.";

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
                                    
                                _libraryManager.DeleteItem(libraryItem, new DeleteOptions
                                {
                                    DeleteFileLocation = true
                                }, true);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to delete item {ItemId}", item.ItemId);
                        // Add back to remaining so we try again next time
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
    }
}
