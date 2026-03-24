using System.Collections.Generic;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;
using Microsoft.Extensions.Logging;
using Jellyfin_Latestmedia.Configuration;
using Jellyfin_Latestmedia.Data;

namespace Jellyfin_Latestmedia
{
    public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
    {
        public override string Name => "Latest Media & Management";

        public override Guid Id => Guid.Parse("A1B2C3D4-E5F6-4A5B-8C9D-0E1F2A3B4C5D"); // Example GUID, should be consistent

        public override string Description => "Adds Latest Media, Media Management, and Chat to the Jellyfin header.";

        public PluginRepository Repository { get; private set; }

        public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer, ILoggerFactory loggerFactory) 
            : base(applicationPaths, xmlSerializer)
        {
            Instance = this;
            Repository = new PluginRepository(applicationPaths, loggerFactory.CreateLogger<PluginRepository>());
        }

        public static Plugin? Instance { get; private set; }

        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = "Latest Media & Management",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.configPage.html",
                    EnableInMainMenu = true
                },
                new PluginPageInfo
                {
                    Name = "LatestMediaUI",
                    EmbeddedResourcePath = GetType().Namespace + ".Web.latestmedia.js",
                    EnableInMainMenu = false
                }
            };
        }
    }
}
