using MediaBrowser.Model.Plugins;

namespace Jellyfin_Latestmedia.Configuration
{
    public class PluginConfiguration : BasePluginConfiguration
    {
        // ── Existing Core Features ──
        public bool EnableLatestMediaButton { get; set; } = true;
        public bool EnableMediaManagement { get; set; } = true;
        public bool EnableChat { get; set; } = true;
        public bool EnableAnnouncements { get; set; } = true;
        public bool ShowOnMobile { get; set; } = false;
        public int PublicChatRetentionHours { get; set; } = 24;
        public int DmRetentionDays { get; set; } = 7;
        public int LatestMediaCount { get; set; } = 50;
        public string PluginTheme { get; set; } = "htv";
        public string AnnouncementHeading { get; set; } = "H-TV Announcements";

        // ── Feature 1: Playback Tab Controls (matches JE property names/defaults) ──
        public bool AutoPauseEnabled { get; set; } = true;
        public bool AutoResumeEnabled { get; set; } = false;
        public bool AutoPipEnabled { get; set; } = false;

        // ── Feature 2: Random Button (matches JE property names/defaults) ──
        public bool RandomButtonEnabled { get; set; } = true;
        public bool RandomIncludeMovies { get; set; } = true;
        public bool RandomIncludeShows { get; set; } = true;
        public bool RandomUnwatchedOnly { get; set; } = false;

        // ── Feature 3: Seerr Integration (matches JE property names/defaults) ──
        public bool JellyseerrEnabled { get; set; } = false;
        public string JellyseerrUrls { get; set; } = "";
        public string JellyseerrApiKey { get; set; } = "";
        public string TMDB_API_KEY { get; set; } = "";
        public string JellyseerrUrlMappings { get; set; } = "";

        // Seerr Search
        public bool JellyseerrShowSearchResults { get; set; } = true;
        public bool ShowCollectionsInSearch { get; set; } = true;

        // Seerr Requests
        public bool JellyseerrEnable4KRequests { get; set; } = false;
        public bool JellyseerrEnable4KTvRequests { get; set; } = false;
        public bool JellyseerrShowAdvanced { get; set; } = false;
        public string JellyseerrDefaultSonarrProfileId { get; set; } = "";
        public string JellyseerrDefaultRadarrProfileId { get; set; } = "";
        public bool JellyseerrShowReportButton { get; set; } = false;
        public bool JellyseerrShowIssueIndicator { get; set; } = false;

        // Seerr Discovery
        public bool JellyseerrShowSimilar { get; set; } = true;
        public bool JellyseerrShowRecommended { get; set; } = true;
        public bool JellyseerrShowNetworkDiscovery { get; set; } = true;
        public bool JellyseerrShowGenreDiscovery { get; set; } = true;
        public bool JellyseerrShowTagDiscovery { get; set; } = true;
        public bool JellyseerrShowPersonDiscovery { get; set; } = true;
        public bool JellyseerrShowCollectionDiscovery { get; set; } = true;

        // Seerr Filtering
        public bool JellyseerrExcludeLibraryItems { get; set; } = true;
        public bool JellyseerrExcludeBlocklistedItems { get; set; } = false;
        public bool JellyseerrUseMoreInfoModal { get; set; } = false;

        // Seerr Watchlist
        public bool AddRequestedMediaToWatchlist { get; set; } = false;
        public bool SyncJellyseerrWatchlist { get; set; } = false;
        public bool PreventWatchlistReAddition { get; set; } = true;
        public int WatchlistMemoryRetentionDays { get; set; } = 365;

        // Seerr Performance/Cache
        public bool JellyseerrDisableCache { get; set; } = false;
        public int JellyseerrResponseCacheTtlMinutes { get; set; } = 10;
        public int JellyseerrUserIdCacheTtlMinutes { get; set; } = 30;

        // ── Feature 4: Custom Branding ──
        public bool EnableCustomBranding { get; set; } = false;

        // ── Feature 5: *arr Integration ──
        public bool ArrLinksEnabled { get; set; } = false;
        public string SonarrUrl { get; set; } = "";
        public string SonarrApiKey { get; set; } = "";
        public string RadarrUrl { get; set; } = "";
        public string RadarrApiKey { get; set; } = "";
        public string BazarrUrl { get; set; } = "";

        // Arr Quick Links (Sonarr/Radarr/Bazarr buttons on item detail pages)
        public bool ArrTagsShowAsLinks { get; set; } = false;
        public string ArrTagsPrefix { get; set; } = "arr:";

        // Arr Active Downloads page (sidebar)
        public bool ArrDownloadsEnabled { get; set; } = false;
        public bool ArrDownloadsShowRequests { get; set; } = true;
    }
}
