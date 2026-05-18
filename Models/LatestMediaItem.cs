using System;

namespace Jellyfin_Latestmedia.Models
{
    public class LatestMediaItem
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // Movie, Series, Anime
        public int? ProductionYear { get; set; }
        public string PosterUrl { get; set; } = string.Empty;
        public DateTime DateAdded { get; set; }
        public string? SeriesName { get; set; }
        public string? SeasonName { get; set; }
        public string[]? Genres { get; set; }
    }
}
