using System;

namespace Jellyfin_Latestmedia.Models
{
    public class ScheduledTask
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime EventDate { get; set; }
        public string EventTime { get; set; } = "00:00";
        public string Recurrence { get; set; } = "none";
        public int PostDaysBefore { get; set; } = 7;
        public Guid CreatedBy { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? GeneratedAnnouncementId { get; set; }
    }
}
