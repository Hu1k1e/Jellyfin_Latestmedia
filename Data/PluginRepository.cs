using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MediaBrowser.Common.Configuration;

namespace Jellyfin_Latestmedia.Data
{
    public class PluginRepository
    {
        private readonly string _dataDirectory;
        private readonly ILogger<PluginRepository> _logger;
        private readonly ConcurrentDictionary<string, SemaphoreSlim> _fileLocks = new();
        private readonly JsonSerializerOptions _jsonOptions;

        public PluginRepository(IApplicationPaths appPaths, ILogger<PluginRepository> logger)
        {
            _logger = logger;
            _dataDirectory = Path.Combine(appPaths.PluginConfigurationsPath, "LatestMediaManagement");
            
            if (!Directory.Exists(_dataDirectory))
            {
                Directory.CreateDirectory(_dataDirectory);
            }

            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                WriteIndented = true
            };
        }

        private SemaphoreSlim GetLock(string filename)
        {
            return _fileLocks.GetOrAdd(filename, _ => new SemaphoreSlim(1, 1));
        }

        private string GetFilePath(string filename)
        {
            return Path.Combine(_dataDirectory, $"{filename}.json");
        }

        public async Task<List<T>> ReadListAsync<T>(string filename)
        {
            var filePath = GetFilePath(filename);
            if (!File.Exists(filePath))
            {
                return new List<T>();
            }

            var fileLock = GetLock(filename);
            await fileLock.WaitAsync();

            try
            {
                using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
                var data = await JsonSerializer.DeserializeAsync<List<T>>(stream, _jsonOptions);
                return data ?? new List<T>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading from {Filename}", filename);
                return new List<T>();
            }
            finally
            {
                fileLock.Release();
            }
        }

        public async Task WriteListAsync<T>(string filename, List<T> data)
        {
            var filePath = GetFilePath(filename);
            var fileLock = GetLock(filename);
            
            await fileLock.WaitAsync();

            try
            {
                using var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
                await JsonSerializer.SerializeAsync(stream, data, _jsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error writing to {Filename}", filename);
            }
            finally
            {
                fileLock.Release();
            }
        }

        public async Task<T?> ReadItemAsync<T>(string filename) where T : class
        {
            var filePath = GetFilePath(filename);
            if (!File.Exists(filePath))
            {
                return null;
            }

            var fileLock = GetLock(filename);
            await fileLock.WaitAsync();

            try
            {
                using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
                return await JsonSerializer.DeserializeAsync<T>(stream, _jsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading from {Filename}", filename);
                return null;
            }
            finally
            {
                fileLock.Release();
            }
        }

        public async Task WriteItemAsync<T>(string filename, T data) where T : class
        {
            var filePath = GetFilePath(filename);
            var fileLock = GetLock(filename);
            
            await fileLock.WaitAsync();

            try
            {
                using var stream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
                await JsonSerializer.SerializeAsync(stream, data, _jsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error writing to {Filename}", filename);
            }
            finally
            {
                fileLock.Release();
            }
        }

        public string GetChatDmFileName(Guid user1, Guid user2)
        {
            // Sort to ensure both users resolve to the same file
            var u1 = user1.ToString("N");
            var u2 = user2.ToString("N");
            return string.Compare(u1, u2, StringComparison.Ordinal) < 0 
                ? $"chat_dm_{u1}_{u2}" 
                : $"chat_dm_{u2}_{u1}";
        }
        
        // Expose data directory if cleanups are needed
        public string DataDirectory => _dataDirectory;
    }
}
