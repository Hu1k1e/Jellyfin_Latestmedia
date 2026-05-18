using System.Text.Json.Serialization;

namespace Jellyfin_Latestmedia.Models;

/// <summary>
/// Payload type passed by the File Transformation Plugin to registered callback methods.
/// Must strictly match the deserialization layout so Jellyfin doesn't crash during intercept.
/// </summary>
public class PatchRequestPayload
{
    [JsonPropertyName("contents")]
    public string? Contents { get; set; }
}
