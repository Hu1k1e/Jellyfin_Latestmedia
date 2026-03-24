using System;
using System.IO;
using System.Reflection;
using System.Text.RegularExpressions;
using Jellyfin_Latestmedia.Models;

namespace Jellyfin_Latestmedia.Helpers;

public static class TransformationPatches
{
    public static string InjectScriptTag(PatchRequestPayload payload)
    {
        // Safety net: Always return the original contents on failure to prevent crashing Jellyfin
        if (string.IsNullOrEmpty(payload.Contents)) return string.Empty;

        try
        {
            using Stream stream = Assembly.GetExecutingAssembly()
                .GetManifestResourceStream("Jellyfin_Latestmedia.Web.inject.js")!;
                
            if (stream == null) return payload.Contents;

            using TextReader reader = new StreamReader(stream);
            string scriptContent = reader.ReadToEnd();

            return Regex.Replace(
                payload.Contents,
                @"(</body>)",
                $"<script defer>{scriptContent}</script>$1",
                RegexOptions.IgnoreCase);
        }
        catch (Exception)
        {
            // If anything goes wrong, NEVER crash the Jellyfin web host. Fallback to unmodified HTML.
            return payload.Contents;
        }
    }
}
