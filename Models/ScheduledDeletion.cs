using System;

namespace Jellyfin_Latestmedia.Models
{
    public class ScheduledDeletion
    {
        public string ItemId { get; set; } = string.Empty;
        public DateTime ScheduledTime { get; set; }
        public Guid ScheduledByUserId { get; set; }
        public string ScheduledByName { get; set; } = string.Empty;
    }
}
