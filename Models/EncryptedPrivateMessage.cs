using System;

namespace Jellyfin_Latestmedia.Models
{
    public class EncryptedPrivateMessage
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public Guid SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public Guid RecipientId { get; set; }
        /// <summary>Plain text content (used when E2E is not set up).</summary>
        public string Content { get; set; } = string.Empty;
        /// <summary>Base64 encoded AES-GCM ciphertext (optional, for E2E encrypted DMs).</summary>
        public string Ciphertext { get; set; } = string.Empty;
        public string Nonce { get; set; } = string.Empty;
        public string SenderPublicKey { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
    }
}
