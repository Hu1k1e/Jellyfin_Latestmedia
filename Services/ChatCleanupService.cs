using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Jellyfin_Latestmedia.Data;
using Jellyfin_Latestmedia.Models;
using MediaBrowser.Model.Tasks;
using Microsoft.Extensions.Logging;

namespace Jellyfin_Latestmedia.Services
{
    public class ChatCleanupService : IScheduledTask
    {
        private readonly ILogger<ChatCleanupService> _logger;
        private readonly PluginRepository _repository;

        public ChatCleanupService(ILogger<ChatCleanupService> logger)
        {
            _logger = logger;
            _repository = Plugin.Instance.Repository;
        }

        public string Name => "Manage Media: Chat Cleanup";

        public string Key => "LatestMediaChatCleanupTask";

        public string Description => "Cleans up old chat logs (24h for public, 7d for DMs) and broadcast messages.";

        public string Category => "Latest Media & Management";

        public IEnumerable<TaskTriggerInfo> GetDefaultTriggers()
        {
            return new[]
            {
                new TaskTriggerInfo
                {
                    Type = TaskTriggerInfoType.IntervalTrigger,
                    IntervalTicks = TimeSpan.FromHours(6).Ticks
                }
            };
        }

        public async Task ExecuteAsync(IProgress<double> progress, CancellationToken cancellationToken)
        {
            _logger.LogInformation("Starting Chat Cleanup run");
            
            var config = Plugin.Instance?.Configuration;
            int publicRetentionHours = config?.PublicChatRetentionHours ?? 24;
            int dmRetentionDays = config?.DmRetentionDays ?? 7;

            DateTime publicCutoff = DateTime.UtcNow.AddHours(-publicRetentionHours);
            DateTime dmCutoff = DateTime.UtcNow.AddDays(-dmRetentionDays);

            // Cleanup Public Chat
            var publicChat = await _repository.ReadListAsync<ChatMessage>("chat_public");
            int pubInitialCount = publicChat.Count;
            if (pubInitialCount > 0)
            {
                publicChat.RemoveAll(m => m.Timestamp < publicCutoff);
                if (publicChat.Count < pubInitialCount)
                {
                    await _repository.WriteListAsync("chat_public", publicChat);
                    _logger.LogInformation("Cleaned up {Count} public chat messages", pubInitialCount - publicChat.Count);
                }
            }
            progress.Report(30);
            
            // Cleanup Broadcast Messages
            var broadcasts = await _repository.ReadListAsync<BroadcastMessage>("broadcast_messages");
            int bInitialCount = broadcasts.Count;
            if (bInitialCount > 0)
            {
                broadcasts.RemoveAll(m => m.Timestamp < publicCutoff);
                if (broadcasts.Count < bInitialCount)
                {
                    await _repository.WriteListAsync("broadcast_messages", broadcasts);
                    _logger.LogInformation("Cleaned up {Count} broadcast messages", bInitialCount - broadcasts.Count);
                }
            }
            progress.Report(50);

            // Cleanup DMs
            if (Directory.Exists(_repository.DataDirectory))
            {
                var dictFiles = Directory.GetFiles(_repository.DataDirectory, "chat_dm_*.json");
                int processed = 0;
                int totalCleaned = 0;
                
                foreach(var file in dictFiles)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    
                    var filename = Path.GetFileNameWithoutExtension(file);
                    var dmChat = await _repository.ReadListAsync<EncryptedPrivateMessage>(filename);
                    
                    int initialDmCount = dmChat.Count;
                    if (initialDmCount > 0)
                    {
                        dmChat.RemoveAll(m => m.Timestamp < dmCutoff);
                        if (dmChat.Count < initialDmCount)
                        {
                            await _repository.WriteListAsync(filename, dmChat);
                            totalCleaned += (initialDmCount - dmChat.Count);
                        }
                    }
                    else if (dmChat.Count == 0 && initialDmCount == 0)
                    {
                        // File is empty, we could potentially delete it to save inodes
                        // Not deleting for now to just avoid io issues
                    }
                    
                    processed++;
                    progress.Report(50 + ((double)processed / dictFiles.Length * 50));
                }
                
                if (totalCleaned > 0)
                {
                    _logger.LogInformation("Cleaned up {Count} private encrypted DM messages", totalCleaned);
                }
            }

            progress.Report(100);
            _logger.LogInformation("Chat Cleanup run complete");
        }
    }
}
