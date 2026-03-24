using System;

namespace Jellyfin_Latestmedia.Models
{
    public class ChatMessage
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public Guid SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}
