using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Jellyfin_Latestmedia;

/// <summary>
/// Middleware that injects the latestmedia.js script into any index.html response 
/// served by Jellyfin. Uses the same approach as jellyfin-plugin-ratings.
/// No external dependencies or file system write access required.
/// </summary>
public class ScriptInjectionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ScriptInjectionMiddleware> _logger;

    public ScriptInjectionMiddleware(RequestDelegate next, ILogger<ScriptInjectionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? string.Empty;

        // Only intercept requests that map to the Jellyfin web UI's index.html
        if (!IsIndexHtmlRequest(path))
        {
            await _next(context).ConfigureAwait(false);
            return;
        }

        // Remove Accept-Encoding header so the response is not compressed
        context.Request.Headers.Remove("Accept-Encoding");

        var originalBodyStream = context.Response.Body;

        try
        {
            using var memoryStream = new MemoryStream();
            context.Response.Body = memoryStream;

            await _next(context).ConfigureAwait(false);

            // Only process successful HTML responses
            if (context.Response.StatusCode != 200)
            {
                await WriteOriginalResponse(memoryStream, originalBodyStream).ConfigureAwait(false);
                return;
            }

            // Skip compressed responses
            var contentEncoding = context.Response.Headers.ContentEncoding.ToString();
            if (!string.IsNullOrEmpty(contentEncoding))
            {
                await WriteOriginalResponse(memoryStream, originalBodyStream).ConfigureAwait(false);
                return;
            }

            // Only process text/html
            var contentType = context.Response.ContentType ?? string.Empty;
            if (!contentType.StartsWith("text/html", StringComparison.OrdinalIgnoreCase))
            {
                await WriteOriginalResponse(memoryStream, originalBodyStream).ConfigureAwait(false);
                return;
            }

            memoryStream.Position = 0;
            string responseBody;
            using (var reader = new StreamReader(memoryStream, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, bufferSize: 1024, leaveOpen: true))
            {
                responseBody = await reader.ReadToEndAsync().ConfigureAwait(false);
            }

            if (string.IsNullOrEmpty(responseBody))
            {
                await WriteOriginalResponse(memoryStream, originalBodyStream).ConfigureAwait(false);
                return;
            }

            // Avoid double-injection
            if (responseBody.Contains("latestmedia.js", StringComparison.OrdinalIgnoreCase))
            {
                await WriteOriginalResponse(memoryStream, originalBodyStream).ConfigureAwait(false);
                return;
            }

            // Determine base path for reverse proxy support
            var basePath = context.Request.PathBase.Value?.TrimEnd('/') ?? string.Empty;
            if (string.IsNullOrEmpty(basePath))
            {
                var webIndex = path.IndexOf("/web/", StringComparison.OrdinalIgnoreCase);
                if (webIndex > 0)
                    basePath = path.Substring(0, webIndex);
            }

            var modifiedBody = InjectScript(responseBody, basePath);

            if (modifiedBody == responseBody)
            {
                _logger.LogWarning("[LatestMedia] ScriptInjection: No </body> tag found - could not inject");
                await WriteOriginalResponse(memoryStream, originalBodyStream).ConfigureAwait(false);
                return;
            }

            _logger.LogInformation("[LatestMedia] Successfully injected latestmedia.js into index.html");

            var modifiedBytes = Encoding.UTF8.GetBytes(modifiedBody);
            context.Response.Headers.Remove("Content-Length");
            context.Response.ContentLength = modifiedBytes.Length;
            await originalBodyStream.WriteAsync(modifiedBytes, 0, modifiedBytes.Length).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "[LatestMedia] Script injection failed, passing through original response");
            try
            {
                await WriteOriginalResponse(context.Response.Body as MemoryStream ?? new MemoryStream(), originalBodyStream).ConfigureAwait(false);
            }
            catch { }
        }
        finally
        {
            context.Response.Body = originalBodyStream;
        }
    }

    private static async Task WriteOriginalResponse(MemoryStream memoryStream, Stream originalBodyStream)
    {
        if (memoryStream.Length > 0)
        {
            memoryStream.Position = 0;
            await memoryStream.CopyToAsync(originalBodyStream).ConfigureAwait(false);
        }
    }

    private static bool IsIndexHtmlRequest(string path)
    {
        return path.Equals("/", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/index.html", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/web", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/web/", StringComparison.OrdinalIgnoreCase)
            || path.Equals("/web/index.html", StringComparison.OrdinalIgnoreCase)
            || path.EndsWith("/web", StringComparison.OrdinalIgnoreCase)
            || path.EndsWith("/web/", StringComparison.OrdinalIgnoreCase)
            || path.EndsWith("/web/index.html", StringComparison.OrdinalIgnoreCase);
    }

    private static string InjectScript(string html, string basePath)
    {
        var bodyCloseIndex = html.LastIndexOf("</body>", StringComparison.OrdinalIgnoreCase);
        if (bodyCloseIndex == -1)
            return html;

        // Serve latestmedia.js via the plugin page endpoint registered in Plugin.cs
        var safeBasePath = System.Net.WebUtility.HtmlEncode(basePath);
        var scriptTag = $"<script defer src=\"{safeBasePath}/web/ConfigurationPage?name=LatestMediaUI\"></script>";
        scriptTag += $"\n<script defer src=\"{safeBasePath}/web/ConfigurationPage?name=requests-page.js\"></script>";
        var injected = html.Insert(bodyCloseIndex, scriptTag + "\n");

        var headCloseIndex = injected.LastIndexOf("</head>", StringComparison.OrdinalIgnoreCase);
        if (headCloseIndex != -1 && Plugin.Instance?.Configuration?.EnableCustomBranding == true)
        {
            // Regex strip old Jellyfin favicons to prevent browser load race conditions against new headers
            injected = System.Text.RegularExpressions.Regex.Replace(injected, @"<link[^>]*rel=[""'][^""']*icon[^""']*[""'][^>]*>", "");
            // Must recalculate index because we changed the length
            headCloseIndex = injected.LastIndexOf("</head>", StringComparison.OrdinalIgnoreCase);

            var styleTag = $"<link rel=\"icon\" href=\"{safeBasePath}/Branding/favicon\"><style id=\"lm-branding-instant\">#splashscreen, .splashLogo {{ background-image: url({safeBasePath}/Branding/icon-transparent) !important; }} html[data-lm-home] .pageTitleWithLogo {{ background-image: url({safeBasePath}/Branding/icon-transparent) !important; }} html:not([data-lm-home]) .pageTitleWithLogo {{ display: none !important; }} .customBannerLight {{ background-image: url({safeBasePath}/Branding/banner-light) !important; }} .customBannerDark {{ background-image: url({safeBasePath}/Branding/banner-dark) !important; }}</style>";
            injected = injected.Insert(headCloseIndex, styleTag + "\n");
        }

        return injected;
    }
}
