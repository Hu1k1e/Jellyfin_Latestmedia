using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Runtime.Loader;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Helpers;
using MediaBrowser.Model.Tasks;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Jellyfin_Latestmedia.Services;

public class StartupService : IScheduledTask
{
    public string Name => "Latest Media Injection Startup";
    public string Key => "Jellyfin_Latestmedia.Startup";
    public string Description => "Registers File Transformation to auto-inject latestmedia.js into index.html.";
    public string Category => "Startup Services";

    private readonly ILogger<StartupService> _logger;

    public StartupService(ILogger<StartupService> logger)
    {
        _logger = logger;
    }

    public Task ExecuteAsync(IProgress<double> progress, CancellationToken cancellationToken)
    {
        _logger.LogInformation("[LatestMedia] Registering File Transformation for index.html.");

        // Instead of pulling in Newtonsoft.Json, we can construct the payload dynamic dictionary
        var payload = new Dictionary<string, string>
        {
            ["id"] = "e82d1c63-4a5b-6f8c-b6e9-a3b4c5d6e7f8",
            ["fileNamePattern"] = "index.html",
            ["callbackAssembly"] = GetType().Assembly.FullName!,
            ["callbackClass"] = typeof(TransformationPatches).FullName!,
            ["callbackMethod"] = nameof(TransformationPatches.InjectScriptTag)
        };
        
        // The File Transformation plugin natively uses Newtonsoft JObject for dynamic registration.
        // We'll serialize it exactly how the plugin expects.
        string jsonPayload = JsonSerializer.Serialize(payload);

        Assembly? ftAssembly = AssemblyLoadContext.All
            .SelectMany(x => x.Assemblies)
            .FirstOrDefault(x => x.FullName?.Contains(".FileTransformation") ?? false);

        if (ftAssembly == null)
        {
            _logger.LogWarning("[LatestMedia] File Transformation Plugin not found! Javascript will not be auto-injected. Please install the 'File Transformation' plugin in Jellyfin Plugins Catalog.");
            return Task.CompletedTask;
        }

        Type? pluginInterface = ftAssembly.GetType("Jellyfin.Plugin.FileTransformation.PluginInterface");
        if (pluginInterface == null)
        {
            _logger.LogWarning("[LatestMedia] PluginInterface type not found in File Transformation.");
            return Task.CompletedTask;
        }

        try
        {
            // Because the method signature requires a JObject, and we only have strings/System.Text.Json,
            // we must use Reflection to parse our JSON into a JObject via the NewtonSoft assembly already loaded by Jellyfin.
            var newtonsoftAssembly = ftAssembly.GetReferencedAssemblies()
                .Select(Assembly.Load)
                .FirstOrDefault(a => a.GetName().Name == "Newtonsoft.Json") 
                ?? AppDomain.CurrentDomain.GetAssemblies().FirstOrDefault(a => a.GetName().Name == "Newtonsoft.Json");

            if (newtonsoftAssembly != null)
            {
                var jObjectType = newtonsoftAssembly.GetType("Newtonsoft.Json.Linq.JObject");
                var parseMethod = jObjectType!.GetMethod("Parse", new[] { typeof(string) });
                var jObjectPayload = parseMethod!.Invoke(null, new object[] { jsonPayload });

                pluginInterface.GetMethod("RegisterTransformation")?.Invoke(null, new object?[] { jObjectPayload });
                _logger.LogInformation("[LatestMedia] File Transformation injected successfully.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[LatestMedia] Failed to register transformation patches via reflection.");
        }

        return Task.CompletedTask;
    }

    public IEnumerable<TaskTriggerInfo> GetDefaultTriggers()
    {
        return new[] { new TaskTriggerInfo { Type = TaskTriggerInfoType.StartupTrigger } };
    }
}
