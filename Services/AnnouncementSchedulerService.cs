using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Data;
using Jellyfin_Latestmedia.Models;
using MediaBrowser.Model.Tasks;
using Microsoft.Extensions.Logging;

namespace Jellyfin_Latestmedia.Services
{
    public class AnnouncementSchedulerService : IScheduledTask
    {
        private readonly ILogger<AnnouncementSchedulerService> _logger;
        private readonly PluginRepository _repository;

        public AnnouncementSchedulerService(ILogger<AnnouncementSchedulerService> logger)
        {
            _logger = logger;
            _repository = Plugin.Instance.Repository;
        }

        public string Name => "Manage Media: Scheduled Announcements";
        public string Key => "LatestMediaAnnouncementSchedulerTask";
        public string Description => "Auto-posts scheduled announcements and calculates recurrence patterns.";
        public string Category => "Latest Media & Management";

        public IEnumerable<TaskTriggerInfo> GetDefaultTriggers()
        {
            return new[]
            {
                new TaskTriggerInfo
                {
                    Type = TaskTriggerInfoType.IntervalTrigger,
                    IntervalTicks = TimeSpan.FromHours(1).Ticks
                }
            };
        }

        public async Task ExecuteAsync(IProgress<double> progress, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting Scheduled Announcement run");
            
            var schedule = await _repository.ReadListAsync<ScheduledTask>("scheduled_announcements");
            var announcements = await _repository.ReadListAsync<Announcement>("announcements");
            
            if (schedule.Count == 0 && !announcements.Any(a => a.IsScheduled))
            {
                progress.Report(100);
                return;
            }

            var now = DateTime.UtcNow;
            bool scheduleChanged = false;
            bool announcementsChanged = false;

            for (int i = 0; i < schedule.Count; i++)
            {
                var task = schedule[i];

                // Remove orphaned 
                if (!string.IsNullOrEmpty(task.GeneratedAnnouncementId) && !announcements.Any(a => a.Id == task.GeneratedAnnouncementId))
                {
                    task.GeneratedAnnouncementId = null;
                    scheduleChanged = true;
                }

                // Parse Event DateTime using target TimeZone
                DateTime eventDtBase = DateTime.SpecifyKind(task.EventDate.Date, DateTimeKind.Unspecified);
                if (TimeSpan.TryParse(task.EventTime, out TimeSpan time))
                {
                    eventDtBase = eventDtBase.Add(time);
                }
                
                DateTime eventDt;
                try
                {
                    string tzId = task.TimeZone ?? "UTC";
                    TimeZoneInfo tzInfo = null;
                    if (System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.Windows) && TimeZoneInfo.TryConvertIanaIdToWindowsId(tzId, out string winId))
                    {
                        try { tzInfo = TimeZoneInfo.FindSystemTimeZoneById(winId); } catch {}
                    }
                    if (tzInfo == null) tzInfo = TimeZoneInfo.FindSystemTimeZoneById(tzId);
                    
                    eventDt = TimeZoneInfo.ConvertTimeToUtc(eventDtBase, tzInfo);
                }
                catch
                {
                    // Fallback to local machine timezone if specified timezone is invalid
                    try { eventDt = TimeZoneInfo.ConvertTimeToUtc(eventDtBase, TimeZoneInfo.Local); }
                    catch { eventDt = eventDtBase.ToUniversalTime(); }
                }

                // Check Expired (Event passed)
                if (eventDt <= now)
                {
                    // Remove generated announcement if it exists
                    if (!string.IsNullOrEmpty(task.GeneratedAnnouncementId))
                    {
                        announcements.RemoveAll(a => a.Id == task.GeneratedAnnouncementId);
                        task.GeneratedAnnouncementId = null;
                        announcementsChanged = true;
                        scheduleChanged = true;
                    }

                    if (task.Recurrence == "none")
                    {
                        schedule.RemoveAt(i);
                        i--;
                        scheduleChanged = true;
                        continue;
                    }
                    else
                    {
                        // Calculate next occurrence
                        task.EventDate = CalculateNextOccurrence(task.EventDate, task.Recurrence, task.OriginalEventDate);
                        scheduleChanged = true;
                        
                        // Re-parse with new date for the posting window trigger
                        DateTime newEventDt = DateTime.SpecifyKind(task.EventDate.Date, DateTimeKind.Unspecified);
                        if (TimeSpan.TryParse(task.EventTime, out TimeSpan newTime))
                        {
                            newEventDt = newEventDt.Add(newTime);
                        }
                        try
                        {
                            string tzId = task.TimeZone ?? "UTC";
                            TimeZoneInfo tzInfo = null;
                            if (System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.Windows) && TimeZoneInfo.TryConvertIanaIdToWindowsId(tzId, out string winId))
                            {
                                try { tzInfo = TimeZoneInfo.FindSystemTimeZoneById(winId); } catch {}
                            }
                            if (tzInfo == null) tzInfo = TimeZoneInfo.FindSystemTimeZoneById(tzId);
                            
                            eventDt = TimeZoneInfo.ConvertTimeToUtc(newEventDt, tzInfo);
                        }
                        catch
                        {
                            try { eventDt = TimeZoneInfo.ConvertTimeToUtc(newEventDt, TimeZoneInfo.Local); }
                            catch { eventDt = newEventDt.ToUniversalTime(); }
                        }
                    }
                }

                // Check Posting
                var postDate = eventDt.AddDays(-task.PostDaysBefore);
                if (string.IsNullOrEmpty(task.GeneratedAnnouncementId) && now >= postDate && now < eventDt)
                {
                    var newAnn = new Announcement
                    {
                        Id = Guid.NewGuid().ToString("N"),
                        Title = task.Title,
                        Version = "SCHEDULED", // Placeholder for backward compat if needed
                        Body = string.IsNullOrWhiteSpace(task.Description) ? $"Scheduled Event: {task.Title}" : task.Description,
                        AuthorId = task.CreatedBy,
                        AuthorName = task.CreatedByName,
                        CreatedAt = DateTime.UtcNow,
                        ScheduledTaskId = task.Id,
                        EventDate = eventDt,
                        IsScheduled = true
                    };

                    task.GeneratedAnnouncementId = newAnn.Id;
                    announcements.Insert(0, newAnn); // Always place at the top
                    announcementsChanged = true;
                    scheduleChanged = true;
                }
            }

            // Cleanup any orphaned scheduled announcements where the underlying task was deleted
            var orphanCount = announcements.RemoveAll(a => a.IsScheduled && (string.IsNullOrEmpty(a.ScheduledTaskId) || !schedule.Any(s => s.Id == a.ScheduledTaskId)));
            if (orphanCount > 0) announcementsChanged = true;

            if (scheduleChanged)
                await _repository.WriteListAsync("scheduled_announcements", schedule);
            if (announcementsChanged)
                await _repository.WriteListAsync("announcements", announcements);

            _logger.LogInformation("Scheduled Announcement run complete.");
            progress.Report(100);
        }

        private DateTime CalculateNextOccurrence(DateTime current, string recurrence, DateTime? originalDateOpt)
        {
            var next = current;
            var originalDate = originalDateOpt ?? current;

            switch(recurrence)
            {
                case "daily":
                    next = current.AddDays(1);
                    break;
                case "weekly":
                    // Snap to the original day of week. Days since original date % 7.
                    next = current.AddDays(7);
                    var diffW = (next.Date - originalDate.Date).Days;
                    if (diffW % 7 != 0) next = originalDate.Date.AddDays(diffW + (7 - (diffW % 7)));
                    break;
                case "biweekly":
                    next = current.AddDays(14);
                    var diffB = (next.Date - originalDate.Date).Days;
                    if (diffB % 14 != 0) next = originalDate.Date.AddDays(diffB + (14 - (diffB % 14)));
                    break;
                case "monthly":
                    next = current.AddMonths(1);
                    break;
                case "bimonthly":
                    next = current.AddMonths(2);
                    break;
                case "6months":
                    next = current.AddMonths(6);
                    break;
                case "yearly":
                    next = current.AddYears(1);
                    break;
                case "15th-30th":
                    if (current.Day < 15)
                    {
                        next = new DateTime(current.Year, current.Month, 15, current.Hour, current.Minute, current.Second, current.Kind);
                    }
                    else if (current.Day < 30)
                    {
                        int maxDays = DateTime.DaysInMonth(current.Year, current.Month);
                        next = new DateTime(current.Year, current.Month, Math.Min(30, maxDays), current.Hour, current.Minute, current.Second, current.Kind);
                    }
                    else
                    {
                        var nm = current.AddMonths(1);
                        next = new DateTime(nm.Year, nm.Month, 15, current.Hour, current.Minute, current.Second, current.Kind);
                    }
                    break;
                default:
                    next = current.AddDays(1);
                    break;
            }
            return next;
        }
    }
}
