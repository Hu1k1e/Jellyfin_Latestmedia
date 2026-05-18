using System;

namespace Jellyfin_Latestmedia.Models
{
    public class ChatSettings
    {
        public bool IsDisabled { get; set; } = false;
        public bool IsMuted { get; set; } = false;
        public DateTime? MuteExpiresAt { get; set; }
        
        public bool IsCurrentlyMuted()
        {
            if (IsDisabled) return true;
            if (!IsMuted) return false;
            
            if (MuteExpiresAt.HasValue && DateTime.UtcNow > MuteExpiresAt.Value)
            {
                // Mute expired
                return false;
            }
            return true;
        }
    }
}
