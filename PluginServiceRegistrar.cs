using Jellyfin_Latestmedia.Data;
using Jellyfin_Latestmedia.Services;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Plugins;
using MediaBrowser.Model.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace Jellyfin_Latestmedia;

public class PluginServiceRegistrar : IPluginServiceRegistrator
{
    public void RegisterServices(IServiceCollection serviceCollection, IServerApplicationHost applicationHost)
    {
        // Data repository
        serviceCollection.AddSingleton<PluginRepository>();

        // HTTP middleware for injecting latestmedia.js into index.html responses
        // This is the primary injection mechanism (same approach as K3ntas/jellyfin-plugin-ratings)
        serviceCollection.AddSingleton<IStartupFilter, ScriptInjectionStartupFilter>();

        // Scheduled background tasks (implement Jellyfin's IScheduledTask)
        serviceCollection.AddSingleton<IScheduledTask, DeletionSchedulerService>();
        serviceCollection.AddSingleton<IScheduledTask, ChatCleanupService>();
        serviceCollection.AddSingleton<IScheduledTask, AnnouncementSchedulerService>();
    }
}
