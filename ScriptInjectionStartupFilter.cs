using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;

namespace Jellyfin_Latestmedia;

/// <summary>
/// Startup filter that registers the ScriptInjectionMiddleware into the 
/// ASP.NET Core pipeline at application startup. Pattern from K3ntas/jellyfin-plugin-ratings.
/// </summary>
public class ScriptInjectionStartupFilter : IStartupFilter
{
    private readonly ILogger<ScriptInjectionStartupFilter> _logger;

    public ScriptInjectionStartupFilter(ILogger<ScriptInjectionStartupFilter> logger)
    {
        _logger = logger;
    }

    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
    {
        _logger.LogInformation("[LatestMedia] Registering ScriptInjectionMiddleware in the ASP.NET Core pipeline");

        return app =>
        {
            // Insert our middleware before the rest of the pipeline so we can intercept responses
            app.UseMiddleware<ScriptInjectionMiddleware>();
            next(app);
        };
    }
}
