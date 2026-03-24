using System.IO;
using System.Reflection;
using System.Text.RegularExpressions;

namespace Jellyfin_Latestmedia.Helpers;

public static class TransformationPatches
{
    public static string InjectScriptTag(object payloadObj)
    {
        // Reflection to read the "Contents" property dynamically since we don't reference the FileTransformation plugin directly
        var payloadType = payloadObj.GetType();
        var contentsProp = payloadType.GetProperty("Contents");
        string contents = (string)contentsProp!.GetValue(payloadObj)!;

        using Stream stream = Assembly.GetExecutingAssembly()
            .GetManifestResourceStream("Jellyfin_Latestmedia.Web.inject.js")!;
        using TextReader reader = new StreamReader(stream);
        string scriptContent = reader.ReadToEnd();

        return Regex.Replace(
            contents,
            @"(</body>)",
            $"<script defer>{scriptContent}</script>$1",
            RegexOptions.IgnoreCase);
    }
}
