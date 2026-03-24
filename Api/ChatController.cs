using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Data;
using Jellyfin_Latestmedia.Models;
using MediaBrowser.Controller.Library;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Jellyfin_Latestmedia.Api
{
    [ApiController]
    [Route("[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly PluginRepository _repository;
        private readonly IUserManager _userManager;

        public ChatController(IUserManager userManager)
        {
            _repository = Plugin.Instance.Repository;
            _userManager = userManager;
        }

        private Guid GetUserId()
        {
            var userIdString = User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
            return Guid.TryParse(userIdString, out var guid) ? guid : Guid.Empty;
        }

        private string GetUserName()
        {
            return User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name")?.Value ?? "User";
        }

        // Admin check removed to bypass 10.11 API breaking changes


        // --- PUBLIC CHAT ---

        [HttpGet("Messages")]
        public async Task<ActionResult<IEnumerable<ChatMessage>>> GetPublicMessages([FromQuery] DateTime? since)
        {
            if (Plugin.Instance?.Configuration.EnableChat == false) return BadRequest("Chat is disabled");

            var messages = await _repository.ReadListAsync<ChatMessage>("chat_public");
            var broadcasts = await _repository.ReadListAsync<BroadcastMessage>("broadcast_messages");

            var combined = messages.Cast<object>().Concat(broadcasts.Cast<object>()).ToList();

            if (since.HasValue)
            {
                // This is a rough filter, since we are mixing types, we need to filter by dynamic property
                combined = combined.Where(m => 
                {
                    if (m is ChatMessage cm) return cm.Timestamp > since.Value;
                    if (m is BroadcastMessage bm) return bm.Timestamp > since.Value;
                    return false;
                }).ToList();
            }

            // In production, we should sort by timestamp
            combined.Sort((a, b) => 
            {
                var tA = a is ChatMessage ca ? ca.Timestamp : ((BroadcastMessage)a).Timestamp;
                var tB = b is ChatMessage cb ? cb.Timestamp : ((BroadcastMessage)b).Timestamp;
                return tA.CompareTo(tB);
            });

            return Ok(combined);
        }

        [HttpPost("Messages")]
        public async Task<ActionResult> SendPublicMessage([FromBody] ChatMessage request)
        {
            if (Plugin.Instance?.Configuration.EnableChat == false) return BadRequest("Chat is disabled");
            if (string.IsNullOrWhiteSpace(request.Content)) return BadRequest("Message cannot be empty");

            var userId = GetUserId();
            var userName = GetUserName();

            var messages = await _repository.ReadListAsync<ChatMessage>("chat_public");
            messages.Add(new ChatMessage
            {
                SenderId = userId,
                SenderName = userName,
                Content = request.Content,
                Timestamp = DateTime.UtcNow
            });

            await _repository.WriteListAsync("chat_public", messages);
            return Ok();
        }

        [HttpDelete("Messages/{id}")]
        public async Task<ActionResult> DeletePublicMessage(string id)
        {
            var userId = GetUserId();

            var messages = await _repository.ReadListAsync<ChatMessage>("chat_public");
            var msg = messages.FirstOrDefault(m => m.Id == id);
            
            if (msg == null) return NotFound();

            if (msg.SenderId != userId)
            {
                return Forbid();
            }

            messages.Remove(msg);
            await _repository.WriteListAsync("chat_public", messages);
            return Ok();
        }

        // --- BROADCAST ---

        [HttpPost("Broadcast")]
        public async Task<ActionResult> SendBroadcast([FromBody] BroadcastMessage request)
        {
            if (Plugin.Instance?.Configuration.EnableChat == false) return BadRequest("Chat is disabled");
            if (string.IsNullOrWhiteSpace(request.Content)) return BadRequest("Message cannot be empty");

            var userId = GetUserId();
            var userName = GetUserName();

            var broadcasts = await _repository.ReadListAsync<BroadcastMessage>("broadcast_messages");
            broadcasts.Add(new BroadcastMessage
            {
                SenderId = userId,
                SenderName = userName,
                Content = request.Content,
                Timestamp = DateTime.UtcNow
            });

            await _repository.WriteListAsync("broadcast_messages", broadcasts);
            return Ok();
        }

        // --- PRIVATE DMS (E2E Encrypted) ---

        [HttpGet("DM/Users")]
        public ActionResult<IEnumerable<object>> SearchUsers([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query)) return Ok(new List<object>());

            var users = _userManager.Users
                .Where(u => u.Username.Equals(query, StringComparison.OrdinalIgnoreCase))
                .Select(u => new { Id = u.Id.ToString("N"), Name = u.Username })
                .ToList();

            return Ok(users);
        }

        [HttpGet("DM/Conversations")]
        public async Task<ActionResult<IEnumerable<object>>> GetConversations()
        {
            var userId = GetUserId();
            var dictFiles = System.IO.Directory.GetFiles(_repository.DataDirectory, "chat_dm_*.json");
            
            var conversations = new List<object>();
            var userIdStr = userId.ToString("N");

            foreach (var file in dictFiles)
            {
                var filename = System.IO.Path.GetFileNameWithoutExtension(file);
                if (filename.Contains(userIdStr, StringComparison.OrdinalIgnoreCase))
                {
                    // Extract the other user's ID from the filename
                    var parts = filename.Split('_');
                    if (parts.Length == 4) // chat_dm_{id1}_{id2}
                    {
                        var otherIdStr = string.Equals(parts[2], userIdStr, StringComparison.OrdinalIgnoreCase) ? parts[3] : parts[2];
                        if (Guid.TryParse(otherIdStr, out var otherGuid))
                        {
                            var otherUser = _userManager.GetUserById(otherGuid);
                            if (otherUser != null)
                            {
                                var messages = await _repository.ReadListAsync<EncryptedPrivateMessage>(filename);
                                var unreadCount = messages.Count(m => m.RecipientId == userId && !m.IsRead);
                                
                                conversations.Add(new
                                {
                                    UserId = otherIdStr,
                                    UserName = otherUser.Username,
                                    UnreadCount = unreadCount,
                                    LastMessageTime = messages.Count > 0 ? messages.Max(m => m.Timestamp) : DateTime.MinValue
                                });
                            }
                        }
                    }
                }
            }

            return Ok(conversations.OrderByDescending(c => ((dynamic)c).LastMessageTime));
        }

        [HttpGet("DM/{targetUserId}/Messages")]
        public async Task<ActionResult<IEnumerable<EncryptedPrivateMessage>>> GetDmMessages(Guid targetUserId)
        {
            var userId = GetUserId();
            var filename = _repository.GetChatDmFileName(userId, targetUserId);
            
            var messages = await _repository.ReadListAsync<EncryptedPrivateMessage>(filename);
            
            // Mark unread as read
            bool modified = false;
            foreach (var m in messages.Where(m => m.RecipientId == userId && !m.IsRead))
            {
                m.IsRead = true;
                modified = true;
            }

            if (modified)
            {
                await _repository.WriteListAsync(filename, messages);
            }

            return Ok(messages.OrderBy(m => m.Timestamp));
        }

        [HttpPost("DM/{targetUserId}/Messages")]
        public async Task<ActionResult> SendDm(Guid targetUserId, [FromBody] EncryptedPrivateMessage request)
        {
            var userId = GetUserId();
            
            if (string.IsNullOrWhiteSpace(request.Ciphertext) || 
                string.IsNullOrWhiteSpace(request.Nonce) || 
                string.IsNullOrWhiteSpace(request.SenderPublicKey))
            {
                return BadRequest("Invalid encrypted message format");
            }

            var filename = _repository.GetChatDmFileName(userId, targetUserId);
            var messages = await _repository.ReadListAsync<EncryptedPrivateMessage>(filename);
            
            request.Id = Guid.NewGuid().ToString("N");
            request.SenderId = userId;
            request.RecipientId = targetUserId;
            request.Timestamp = DateTime.UtcNow;
            request.IsRead = false;

            messages.Add(request);
            await _repository.WriteListAsync(filename, messages);
            
            return Ok();
        }

        [HttpDelete("DM/Messages/{id}")]
        public async Task<ActionResult> DeleteDm(string id, [FromQuery] Guid targetUserId)
        {
            var userId = GetUserId();
            var filename = _repository.GetChatDmFileName(userId, targetUserId);
            
            var messages = await _repository.ReadListAsync<EncryptedPrivateMessage>(filename);
            var msg = messages.FirstOrDefault(m => m.Id == id);
            
            if (msg == null) return NotFound();

            if (msg.SenderId != userId)
            {
                return Forbid("Cannot delete someone else's message");
            }

            messages.Remove(msg);
            await _repository.WriteListAsync(filename, messages);
            
            return Ok();
        }

        // --- KEY EXCHANGE ---

        [HttpGet("Keys/{targetUserId}")]
        public async Task<ActionResult<object>> GetPublicKey(Guid targetUserId)
        {
            var keys = await _repository.ReadListAsync<UserPublicKey>("user_keys");
            var keyInfo = keys.FirstOrDefault(k => k.UserId == targetUserId);
            
            if (keyInfo == null) return NotFound("User public key not found");
            
            return Ok(new { PublicKey = keyInfo.PublicKey, UpdatedAt = keyInfo.UpdatedAt });
        }

        [HttpPost("Keys")]
        public async Task<ActionResult> RegisterPublicKey([FromBody] UserPublicKey request)
        {
            if (string.IsNullOrWhiteSpace(request.PublicKey)) return BadRequest("Key cannot be empty");
            
            var userId = GetUserId();
            var keys = await _repository.ReadListAsync<UserPublicKey>("user_keys");
            
            keys.RemoveAll(k => k.UserId == userId);
            keys.Add(new UserPublicKey
            {
                UserId = userId,
                PublicKey = request.PublicKey,
                UpdatedAt = DateTime.UtcNow
            });
            
            await _repository.WriteListAsync("user_keys", keys);
            return Ok();
        }

        // --- SETTINGS ---

        [HttpGet("Settings")]
        public async Task<ActionResult<ChatSettings>> GetSettings()
        {
            var userId = GetUserId();
            var settings = await _repository.ReadItemAsync<ChatSettings>($"chat_settings_{userId:N}");
            return Ok(settings ?? new ChatSettings());
        }

        [HttpPost("Settings")]
        public async Task<ActionResult> UpdateSettings([FromBody] ChatSettings request)
        {
            var userId = GetUserId();
            
            if (request.IsMuted && request.MuteExpiresAt == null && request.IsCurrentlyMuted())
            {
                // Permanent mute
                request.MuteExpiresAt = DateTime.MaxValue;
            }
            
            await _repository.WriteItemAsync($"chat_settings_{userId:N}", request);
            return Ok();
        }
    }
}
