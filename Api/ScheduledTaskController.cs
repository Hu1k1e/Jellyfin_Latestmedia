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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ScheduledTask>>> GetAll()
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();
            
            var tasks = await _repository.ReadListAsync<ScheduledTask>("scheduled_announcements");
            foreach (var t in tasks)
            {
                try
                {
                    DateTime dt = DateTime.SpecifyKind(t.EventDate.Date, DateTimeKind.Unspecified);
                    if (TimeSpan.TryParse(t.EventTime, out TimeSpan time)) dt = dt.Add(time);
                    var tzInfo = TimeZoneInfo.FindSystemTimeZoneById(t.TimeZone ?? "UTC");
                    t.ExecutionUtc = TimeZoneInfo.ConvertTimeToUtc(dt, tzInfo);
                }
                catch
                {
                    // Fallback to local
                    DateTime dt = DateTime.SpecifyKind(t.EventDate.Date, DateTimeKind.Unspecified);
                    if (TimeSpan.TryParse(t.EventTime, out TimeSpan time)) dt = dt.Add(time);
                    try { t.ExecutionUtc = TimeZoneInfo.ConvertTimeToUtc(dt, TimeZoneInfo.Local); }
                    catch { t.ExecutionUtc = dt.ToUniversalTime(); }
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
            if (task.OriginalEventDate == null) task.OriginalEventDate = task.EventDate;

            var tasks = await _repository.ReadListAsync<ScheduledTask>("scheduled_announcements");
            tasks.Add(task);
            await _repository.WriteListAsync("scheduled_announcements", tasks);

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
            existing.Title = update.Title;
            existing.Description = update.Description;
            existing.EventDate = update.EventDate;
            existing.EventTime = update.EventTime;
            existing.TimeZone = update.TimeZone;
            existing.Recurrence = update.Recurrence;
            existing.OriginalEventDate = update.OriginalEventDate ?? update.EventDate;
            existing.PostDaysBefore = update.PostDaysBefore;
            
            tasks[index] = existing;
            await _repository.WriteListAsync("scheduled_announcements", tasks);

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
            
            // Note: Background service will clean up the orphaned announcement 
            // since it'll no longer find the backing ScheduledTask.

            return Ok(new { success = true });
        }
    }
}
