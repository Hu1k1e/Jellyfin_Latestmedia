using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Data;
using Jellyfin_Latestmedia.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Session;

namespace Jellyfin_Latestmedia.Api
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class ScheduledTaskController : ControllerBase
    {
        private readonly PluginRepository _repository;
        private readonly IUserManager _userManager;
        private readonly ISessionManager _sessionManager;

        public ScheduledTaskController(IUserManager userManager, ISessionManager sessionManager)
        {
            _repository = Plugin.Instance.Repository;
            _userManager = userManager;
            _sessionManager = sessionManager;
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
            if (User.IsInRole("Administrator")) return true;

            var uid = await GetRequestUserIdAsync().ConfigureAwait(false);
            if (uid == Guid.Empty) return false;
            var user = _userManager.GetUserById(uid);
            if (user == null) return false;
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

        /// <summary>
        /// Resolves the next future execution UTC for a task.
        /// For recurring tasks whose stored date is in the past, advances by the recurrence period.
        /// </summary>
        private static (DateTime eventDt, string iso) ResolveNextEventUtc(ScheduledTask task)
        {
            DateTime eventDt = DateTime.MaxValue;

            if (!string.IsNullOrEmpty(task.EventUtcIso) &&
                DateTime.TryParse(task.EventUtcIso, null, System.Globalization.DateTimeStyles.RoundtripKind, out var parsed))
            {
                eventDt = DateTime.SpecifyKind(parsed, DateTimeKind.Utc);
            }

            // For recurring tasks whose stored date is past, fast-forward to the next occurrence
            if (!string.Equals(task.Recurrence, "none", StringComparison.OrdinalIgnoreCase) && eventDt <= DateTime.UtcNow)
            {
                var daySteps = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
                {
                    ["daily"] = 1, ["weekly"] = 7, ["biweekly"] = 14,
                    ["monthly"] = 30, ["bimonthly"] = 60, ["6months"] = 182, ["yearly"] = 365
                };

                if (daySteps.TryGetValue(task.Recurrence, out int days))
                {
                    while (eventDt <= DateTime.UtcNow)
                        eventDt = eventDt.AddDays(days);
                }
                else if (string.Equals(task.Recurrence, "15th-30th", StringComparison.OrdinalIgnoreCase))
                {
                    // Advance by approximately 2 weeks at a time
                    while (eventDt <= DateTime.UtcNow) eventDt = eventDt.AddDays(15);
                }
            }

            return (eventDt, eventDt == DateTime.MaxValue ? (task.EventUtcIso ?? "") : eventDt.ToString("O"));
        }

        /// <summary>
        /// Immediately evaluates whether an announcement should be created/updated for a task.
        /// Called after any create or update so users don't have to wait for the hourly scheduler.
        /// </summary>
        private static bool EvaluateAndPostAnnouncement(ScheduledTask task, List<Announcement> announcements)
        {
            var (eventDt, resolvedIso) = ResolveNextEventUtc(task);
            if (eventDt == DateTime.MaxValue) return false;

            // Update EventUtcIso if we advanced it for a recurring task
            task.EventUtcIso = resolvedIso;

            var now = DateTime.UtcNow;
            var postDate = eventDt.AddDays(-task.PostDaysBefore);

            if (now >= postDate && now < eventDt)
            {
                var newAnn = new Announcement
                {
                    Id = Guid.NewGuid().ToString("N"),
                    Title = task.Title,
                    Version = "",
                    Body = string.IsNullOrWhiteSpace(task.Description)
                        ? $"Scheduled Event: {task.Title}"
                        : task.Description,
                    AuthorId = task.CreatedBy,
                    AuthorName = task.CreatedByName,
                    CreatedAt = DateTime.UtcNow,
                    ScheduledTaskId = task.Id,
                    EventDate = eventDt,
                    IsScheduled = true
                };
                task.GeneratedAnnouncementId = newAnn.Id;
                announcements.RemoveAll(a => a.IsScheduled && a.ScheduledTaskId == task.Id);
                announcements.Insert(0, newAnn);
                return true;
            }

            return false;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ScheduledTask>>> GetAll()
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();
            
            var tasks = await _repository.ReadListAsync<ScheduledTask>("scheduled_announcements");
            foreach (var t in tasks)
            {
                if (!string.IsNullOrEmpty(t.EventUtcIso) && DateTime.TryParse(t.EventUtcIso, null, System.Globalization.DateTimeStyles.RoundtripKind, out DateTime parsedUtc))
                {
                    t.ExecutionUtc = DateTime.SpecifyKind(parsedUtc, DateTimeKind.Utc);
                }
                else
                {
                    try
                    {
                        DateTime dt = DateTime.SpecifyKind(t.EventDate.Date, DateTimeKind.Unspecified);
                        if (TimeSpan.TryParse(t.EventTime, out TimeSpan time)) dt = dt.Add(time);
                        string tzId = t.TimeZone ?? "UTC";
                        TimeZoneInfo tzInfo = null;
                        if (System.Runtime.InteropServices.RuntimeInformation.IsOSPlatform(System.Runtime.InteropServices.OSPlatform.Windows) && TimeZoneInfo.TryConvertIanaIdToWindowsId(tzId, out string winId))
                        {
                            try { tzInfo = TimeZoneInfo.FindSystemTimeZoneById(winId); } catch {}
                        }
                        if (tzInfo == null) tzInfo = TimeZoneInfo.FindSystemTimeZoneById(tzId);
                        t.ExecutionUtc = TimeZoneInfo.ConvertTimeToUtc(dt, tzInfo);
                    }
                    catch
                    {
                        DateTime dt = DateTime.SpecifyKind(t.EventDate.Date, DateTimeKind.Unspecified);
                        if (TimeSpan.TryParse(t.EventTime, out TimeSpan time)) dt = dt.Add(time);
                        try { t.ExecutionUtc = TimeZoneInfo.ConvertTimeToUtc(dt, TimeZoneInfo.Local); }
                        catch { t.ExecutionUtc = dt.ToUniversalTime(); }
                    }
                }
            }
            return Ok(tasks.OrderBy(t => t.EventDate));
        }

        [HttpPost]
        public async Task<ActionResult<ScheduledTask>> Create([FromBody] ScheduledTask task)
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();

            var uid = await GetRequestUserIdAsync().ConfigureAwait(false);
            var user = _userManager.GetUserById(uid);
            
            task.Id = Guid.NewGuid().ToString("N");
            task.CreatedBy = uid;
            task.CreatedByName = user?.Username ?? "Admin";
            task.CreatedAt = DateTime.UtcNow;
            task.GeneratedAnnouncementId = null;
            if (task.OriginalEventDate == null) task.OriginalEventDate = task.EventDate;

            var tasks = await _repository.ReadListAsync<ScheduledTask>("scheduled_announcements");
            tasks.Add(task);

            // Immediately evaluate whether an announcement should be posted now
            var announcements = await _repository.ReadListAsync<Announcement>("announcements");
            bool annChanged = EvaluateAndPostAnnouncement(task, announcements);

            await _repository.WriteListAsync("scheduled_announcements", tasks);
            if (annChanged) await _repository.WriteListAsync("announcements", announcements);

            return Ok(task);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ScheduledTask>> Update(string id, [FromBody] ScheduledTask update)
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();

            var tasks = await _repository.ReadListAsync<ScheduledTask>("scheduled_announcements");
            var index = tasks.FindIndex(t => t.Id == id);
            
            if (index == -1) return NotFound();

            var existing = tasks[index];

            // Remember old announcement so we can clean it up
            var oldAnnId = existing.GeneratedAnnouncementId;

            // Apply all updates
            existing.Title = update.Title;
            existing.Description = update.Description;
            existing.EventDate = update.EventDate;
            existing.EventTime = update.EventTime;
            existing.TimeZone = update.TimeZone;
            existing.EventUtcIso = update.EventUtcIso;
            existing.Recurrence = update.Recurrence;
            existing.OriginalEventDate = update.OriginalEventDate ?? update.EventDate;
            existing.PostDaysBefore = update.PostDaysBefore;
            
            // Clear stale GeneratedAnnouncementId — force re-evaluation below
            existing.GeneratedAnnouncementId = null;
            tasks[index] = existing;

            // Load announcements, remove the old generated one if it existed
            var announcements = await _repository.ReadListAsync<Announcement>("announcements");
            bool annChanged = false;
            if (!string.IsNullOrEmpty(oldAnnId))
            {
                annChanged = announcements.RemoveAll(a => a.Id == oldAnnId || (a.IsScheduled && a.ScheduledTaskId == id)) > 0;
            }
            else
            {
                // Also clean up any orphaned scheduled announcements for this task
                annChanged = announcements.RemoveAll(a => a.IsScheduled && a.ScheduledTaskId == id) > 0;
            }

            // Immediately evaluate whether a new announcement should be posted
            bool newAnnPosted = EvaluateAndPostAnnouncement(existing, announcements);
            if (newAnnPosted) annChanged = true;

            // EvaluateAndPostAnnouncement may have updated EventUtcIso (for recurring advance)
            tasks[index] = existing;

            await _repository.WriteListAsync("scheduled_announcements", tasks);
            if (annChanged) await _repository.WriteListAsync("announcements", announcements);

            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();

            var tasks = await _repository.ReadListAsync<ScheduledTask>("scheduled_announcements");
            var task = tasks.FirstOrDefault(t => t.Id == id);
            
            if (task == null) return NotFound();

            tasks.Remove(task);
            await _repository.WriteListAsync("scheduled_announcements", tasks);
            
            // Clean up the generated announcement immediately (don't wait for scheduler)
            if (!string.IsNullOrEmpty(task.GeneratedAnnouncementId))
            {
                var announcements = await _repository.ReadListAsync<Announcement>("announcements");
                if (announcements.RemoveAll(a => a.Id == task.GeneratedAnnouncementId || (a.IsScheduled && a.ScheduledTaskId == id)) > 0)
                    await _repository.WriteListAsync("announcements", announcements);
            }

            return Ok(new { success = true });
        }
    }
}
