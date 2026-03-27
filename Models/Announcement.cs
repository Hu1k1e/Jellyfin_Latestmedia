using System;

namespace Jellyfin_Latestmedia.Models
{
    public class Announcement
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Title { get; set; } = string.Empty;
        public string Version { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;       // Markdown content
        public Guid AuthorId { get; set; }
        public string AuthorName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
