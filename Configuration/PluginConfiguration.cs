using MediaBrowser.Model.Plugins;

namespace Jellyfin_Latestmedia.Configuration
{
    public class PluginConfiguration : BasePluginConfiguration
    {
        public bool EnableLatestMediaButton { get; set; } = true;
        public bool EnableMediaManagement { get; set; } = true;
        public bool EnableChat { get; set; } = true;
        public bool EnableAnnouncements { get; set; } = true;
        public bool ShowOnMobile { get; set; } = false;
        public int PublicChatRetentionHours { get; set; } = 24;
        public int DmRetentionDays { get; set; } = 7;
        public int LatestMediaCount { get; set; } = 50;
    }
}
