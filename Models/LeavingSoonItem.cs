using System;

namespace Jellyfin_Latestmedia.Models
{
    public class LeavingSoonItem
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public DateTime ScheduledDate { get; set; }
        public int DaysRemaining { get; set; }
        public string PosterUrl { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string? SeriesName { get; set; }
        public string? SeasonName { get; set; }
    }
}
