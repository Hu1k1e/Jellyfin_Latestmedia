using System;

namespace Jellyfin_Latestmedia.Models
{
    public class UserPublicKey
    {
        public Guid UserId { get; set; }
        public string PublicKey { get; set; } = string.Empty; // Base64 encoded X25519 public key
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
