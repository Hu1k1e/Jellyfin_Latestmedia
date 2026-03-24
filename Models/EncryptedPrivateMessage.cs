using System;

namespace Jellyfin_Latestmedia.Models
{
    public class EncryptedPrivateMessage
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public Guid SenderId { get; set; }
        public Guid RecipientId { get; set; }
        public string Ciphertext { get; set; } = string.Empty; // Base64 encoded AES-GCM ciphertext
        public string Nonce { get; set; } = string.Empty; // Base64 encoded 12-byte nonce
        public string SenderPublicKey { get; set; } = string.Empty; // Base64 encoded X25519 public key of sender at time of sending
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; } = false;
    }
}
