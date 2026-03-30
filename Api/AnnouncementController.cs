using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Data;
using Jellyfin_Latestmedia.Models;
using MediaBrowser.Controller.Session;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin_Latestmedia.Api
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class AnnouncementController : ControllerBase
    {
        private readonly PluginRepository _repository;
        private readonly ISessionManager _sessionManager;
        private const string FileName = "announcements";

        public AnnouncementController(ISessionManager sessionManager)
        {
            _repository = Plugin.Instance!.Repository;
            _sessionManager = sessionManager;
        }

        /// <summary>GET /Announcement — List all announcements, newest first.</summary>
        [HttpGet]
        public async Task<ActionResult<List<Announcement>>> GetAll()
        {
            var list = await _repository.ReadListAsync<Announcement>(FileName).ConfigureAwait(false);
            var now = DateTime.UtcNow;
            // Exclude expired scheduled announcements — event has already passed
            var filtered = list.Where(a => !a.IsScheduled || (a.EventDate.HasValue && a.EventDate.Value > now)).ToList();
            return Ok(filtered.OrderByDescending(a => a.CreatedAt).ToList());
        }

        /// <summary>POST /Announcement — Admin only: create a new announcement.</summary>
        [HttpPost]
        public async Task<ActionResult<Announcement>> Create([FromBody] Announcement dto)
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();
            if (string.IsNullOrWhiteSpace(dto.Title)) return BadRequest("Title is required.");

            var userId = await GetUserIdAsync().ConfigureAwait(false);
            var ann = new Announcement
            {
                Title = dto.Title.Trim(),
                Version = dto.Version?.Trim() ?? string.Empty,
                Body = dto.Body?.Trim() ?? string.Empty,
                AuthorId = userId,
                AuthorName = GetUserName(),
                CreatedAt = DateTime.UtcNow
            };

            var list = await _repository.ReadListAsync<Announcement>(FileName).ConfigureAwait(false);
            list.Add(ann);
            await _repository.WriteListAsync(FileName, list).ConfigureAwait(false);
            return Ok(ann);
        }

        /// <summary>PUT /Announcement/{id} — Admin only: edit an existing announcement.</summary>
        [HttpPut("{id}")]
        public async Task<ActionResult<Announcement>> Update(string id, [FromBody] Announcement dto)
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();

            var list = await _repository.ReadListAsync<Announcement>(FileName).ConfigureAwait(false);
            var existing = list.FirstOrDefault(a => a.Id == id);
            if (existing == null) return NotFound();

            if (!string.IsNullOrWhiteSpace(dto.Title)) existing.Title = dto.Title.Trim();
            if (dto.Version != null) existing.Version = dto.Version.Trim();
            if (dto.Body != null) existing.Body = dto.Body.Trim();

            await _repository.WriteListAsync(FileName, list).ConfigureAwait(false);
            return Ok(existing);
        }

        /// <summary>DELETE /Announcement/{id} — Admin only.</summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            if (!await IsAdminAsync().ConfigureAwait(false)) return Forbid();

            var list = await _repository.ReadListAsync<Announcement>(FileName).ConfigureAwait(false);
            var count = list.RemoveAll(a => a.Id == id);
            if (count == 0) return NotFound();

            await _repository.WriteListAsync(FileName, list).ConfigureAwait(false);
            return NoContent();
        }

        // ── Helpers (mirrored from ChatController) ──────────────────────────

        private async Task<Guid> GetUserIdAsync()
        {
            var userIdString = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            if (Guid.TryParse(userIdString, out var guid)) return guid;

            var authHeader = Request.Headers["X-Emby-Authorization"].FirstOrDefault()
                          ?? Request.Headers["Authorization"].FirstOrDefault();
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

        private string GetUserName()
        {
            return User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name")?.Value ?? "Admin";
        }

        private Task<bool> IsAdminAsync()
        {
            var isAdmin = User.IsInRole("Administrator")
                       || User.FindFirst("IsAdministrator")?.Value == "true"
                       || User.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value == "Administrator";
            return Task.FromResult(isAdmin);
        }
    }
}
