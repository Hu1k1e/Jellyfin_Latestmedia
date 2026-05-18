# Jellyfin Latest Media & Management 🎬

A comprehensive quality-of-life and administrative plugin for Jellyfin. This plugin directly injects a beautiful, dynamic, non-intrusive UI into the top navigation header of the Jellyfin web client, unlocking real-time interactions, media scheduling, and WebCrypto end-to-end encrypted messaging.

## ✨ Features

### 🖥️ Dynamic UI & Theming
- **Instant Header Injection:** Adds a bespoke "Latest Media" dropdown to your Jellyfin header automatically, requiring no reverse-proxy editing or core jellyfin-web modifications!
- **Zero-Latency CSS Themes:** Includes 5 gorgeous skins (H-TV Translucent, Midnight Blue, Crimson Dark, Purple Haze, and Neutral Slate) that are adjustable from the Dashboard instantly without page reloads.

### 📅 Advanced Administrative Media Management
- **Hierarchical Deletion Engine:** Schedule movies, entire series, specific seasons, or individual episodes for automated background deletion.
- **Live Real-time Countdowns:** The "Leaving Soon" UI panels provide a highly accurate `Live in Xh Ym` / `Deleting in Xh Ym` countdown string updated via a 60-second polling interval directly in the DOM.

### 📢 Server Announcements & Scheduled Tasks
- **Markdown Bulletins:** Admins can publish rich-text announcements using markdown syntax. Users receive notifications instantly via a smart notification badge.
- **Recurring Scheduled Tasks:** Set up recurring announcements for server maintenance intervals. Supports robust temporal patterns (None, Daily, Weekly, Monthly, Bimonthly, Every 6 months, Yearly, 15th&30th). 

### 💬 WebCrypto E2E Encrypted Chat
- **Secure Server Intercom:** Real-time user-to-user private messages. 
- **True End-to-End Encryption:** Mathematical key memoization over Elliptic Curve Diffie-Hellman derivations ensures your server owner cannot read your data.
- **Dynamic Avatars & Localization:** Automatically fetches circular Jellyfin profile avatars and respects timezone configurations for timestamps.

---

## 🚀 Installation & Deployment

This plugin utilizes the native Jellyfin Plugin Catalog mechanism to deliver automated `.dll` binary updates securely via GitHub Actions.

### 1. Add the Repository URL
1. Navigate to your Jellyfin Web UI.
2. Go to **Dashboard** -> **Plugins** -> **Repositories** (tab).
3. Click the `+ Add` button and paste the following manifest URL:
   ```text
   https://raw.githubusercontent.com/Hu1k1e/Jellyfin_Latestmedia/main/manifest.json
   ```

### 2. Install the Plugin
1. Switch to the **Catalog** tab.
2. Under the `General` section, locate **Latest Media & Management** and select the newest available version. Click **Install**.

### 3. Critical Dependency Requirement ⚠️
Because this plugin securely dynamically overrides Jellyfin's DOM to place custom React/Javascript buttons in the header, you **must** install a community prerequisite:
1. Stay in the **Catalog** tab.
2. Search for the standard **File Transformation** community plugin.
3. Install it. *(Without this plugin, Jellyfin strictly forbids automated UI injection).*

### 4. Restart Server
Restart your Jellyfin server. Once booted, the new dropdown menus and chat icons will appear automatically beside your profile icon in the top right.

---

## 🛠️ Build from Source

Requirements: .NET 9.0 SDK installed targeting the `Jellyfin 10.11.6` stable runtime.

```bash
git clone https://github.com/Hu1k1e/Jellyfin_Latestmedia.git
cd Jellyfin_Latestmedia
dotnet build --configuration Release
```
Place the resulting `.dll` file directly in your Jellyfin plugins directory.
