using System.Collections.Generic;
using System.IO;
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

        public override Guid Id => Guid.Parse("f94d6caf-2a62-4dd7-9f64-684ce8efff43");

        public override string Description => "Adds Latest Media, Media Management, Chat, and Enhanced Playback Features to Jellyfin.";

        public PluginRepository Repository { get; private set; }

        public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer, ILoggerFactory loggerFactory) 
            : base(applicationPaths, xmlSerializer)
        {
            Instance = this;
            Repository = new PluginRepository(applicationPaths, loggerFactory.CreateLogger<PluginRepository>());
            // Ensure branding directory exists
            var brandingDir = BrandingDirectory;
            if (!string.IsNullOrWhiteSpace(brandingDir))
                Directory.CreateDirectory(brandingDir);
        }

        public static Plugin? Instance { get; private set; }

        /// <summary>
        /// Gets the path to the custom branding images directory.
        /// </summary>
        public static string BrandingDirectory
        {
            get
            {
                var configPath = Instance?.ConfigurationFilePath;
                if (string.IsNullOrWhiteSpace(configPath)) return string.Empty;
                var configDir = Path.GetDirectoryName(configPath);
                if (string.IsNullOrWhiteSpace(configDir)) return string.Empty;
                var pluginFolderName = Path.GetFileNameWithoutExtension(configPath) ?? "Jellyfin_Latestmedia";
                return Path.Combine(configDir, pluginFolderName, "custom_branding");
            }
        }

        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                // Config page
                new PluginPageInfo
                {
                    Name = "Latest Media & Management",
                    EmbeddedResourcePath = GetType().Namespace + ".Configuration.configPage.html",
                    EnableInMainMenu = true
                },
                // Core UI
                new PluginPageInfo
                {
                    Name = "LatestMediaUI",
                    EmbeddedResourcePath = GetType().Namespace + ".Web.latestmedia.js",
                    EnableInMainMenu = false
                },
                // v3.0.0.0 Feature Modules
                new PluginPageInfo
                {
                    Name = "playback-controls.js",
                    EmbeddedResourcePath = GetType().Namespace + ".Web.playback-controls.js",
                    EnableInMainMenu = false
                },
                new PluginPageInfo
                {
                    Name = "random-button.js",
                    EmbeddedResourcePath = GetType().Namespace + ".Web.random-button.js",
                    EnableInMainMenu = false
                },
                new PluginPageInfo
                {
                    Name = "seerr-integration.js",
                    EmbeddedResourcePath = GetType().Namespace + ".Web.seerr-integration.js",
                    EnableInMainMenu = false
                },
                new PluginPageInfo
                {
                    Name = "branding.js",
                    EmbeddedResourcePath = GetType().Namespace + ".Web.branding.js",
                    EnableInMainMenu = false
                },
                new PluginPageInfo
                {
                    Name = "apply-branding.js",
                    EmbeddedResourcePath = GetType().Namespace + ".Web.apply-branding.js",
                    EnableInMainMenu = false
                },
                new PluginPageInfo
                {
                    Name = "arr-integration.js",
                    EmbeddedResourcePath = GetType().Namespace + ".Web.arr-integration.js",
                    EnableInMainMenu = false
                },
                new PluginPageInfo
                {
                    Name = "requests-page.js",
                    EmbeddedResourcePath = GetType().Namespace + ".Web.requests-page.js",
                    EnableInMainMenu = false
                }
            };
        }
    }
}
