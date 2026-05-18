# Jellyfin Latest Media & Management — Developer & AI Instructions

---

## ⚡ AI ASSISTANT: START HERE

**Before doing anything else in this project, read `project_specs.md` in full.**
It contains:
- A complete description of what the plugin does and why
- The full folder and file structure with explanations of every file
- The entire implementation history (what was built, in what order, and how)
- Known constraints and critical rules you must not violate
- The next steps and planned features backlog

**Do not skip this step.** Making changes without reading `project_specs.md` risks breaking versioning, architecture patterns, or established conventions.

---

## 🤖 AI Behavior Rules

1. **Always check `project_specs.md` first** — understand the current state before proposing changes.
2. **Respect the versioning rules** — never touch the version without explicit instruction (see Section 4).
3. **Match established patterns** — new API controllers follow the same DI, auth, and logging patterns as existing controllers. New JS modules are registered in `Plugin.cs` `GetPages()` and embedded in the `.csproj`.
4. **Do not break existing endpoints** — the plugin is live in production. All API route changes must be backward-compatible.
5. **JSON data files are managed by `PluginRepository` only** — never write data files from controllers directly.
6. **Ask before creating new dependencies** — the project uses zero NuGet packages beyond the Jellyfin SDK. Propose before adding.
7. **Update `project_specs.md`** after completing significant feature work — keep the implementation history current.

---

## Plugin Repository URL (for Jellyfin)

```
https://raw.githubusercontent.com/Hu1k1e/Jellyfin_Latestmedia/main/manifest.json
```

---

## How Releases Work

This project uses a **GitHub Actions CI/CD pipeline** (`.github/workflows/build-release.yml`). When triggered by a version tag, it automatically:

1. Builds the plugin DLL on Ubuntu using the **.NET 9 SDK** against **Jellyfin 10.11.5 stable**
2. Zips only the DLL (Jellyfin runtime deps are excluded via `ExcludeAssets`)
3. Computes the MD5 checksum of the zip
4. Prepends a new version entry to `manifest.json` on the `main` branch
5. Creates a GitHub Release with the `.zip` attached and the tag as the version label

---

## How to Push a New Release

> [!IMPORTANT]
> **GitHub Actions only triggers from the `main` branch.** Pushing to `master` or any other branch will NOT trigger the CI pipeline. Always verify you are on `main` before committing.

### Pre-flight check — confirm you are on `main`

```bash
git branch          # active branch must be: * main
git remote -v       # must point to: https://github.com/Hu1k1e/Jellyfin_Latestmedia.git
```

If you are on `master` or any other branch, switch before doing anything:

```bash
git fetch origin main
git checkout main
# If main doesn't exist locally:
git checkout -b main origin/main
```

---

### Step 1 — Bump the version in `Jellyfin_Latestmedia.csproj`

> **⚠️ CRITICAL — Do this BEFORE committing.**
> All three version fields must be bumped to exactly match your intended git tag.
> If you push code without bumping the version, GitHub Actions will zip the DLL with the old version number inside a new tag — users will install the wrong binary.

Open `Jellyfin_Latestmedia.csproj` and update:

```xml
<Version>3.4.8.5</Version>
<AssemblyVersion>3.4.8.5</AssemblyVersion>
<FileVersion>3.4.8.5</FileVersion>
```

Replace `3.4.8.5` with your actual next version.

### Step 2 — Commit on `main` and push the branch

```bash
git add .
git commit -m "feat: describe your change here"
git push origin main
```

### Step 3 — Create and push a version tag (triggers the CI build)

```bash
git tag v3.4.8.5
git push origin v3.4.8.5
```

> **Tags must be pushed separately from the branch.** `git push origin main` does NOT push tags. Both commands are required.

Wait **1–2 minutes** for the GitHub Action to build and publish the release.

### Step 4 — Pull the updated manifest

```bash
git pull origin main
```

The CI will have updated `manifest.json` with the new version entry, checksum, and download URL. Pull this back so your local copy stays in sync.

---

## ⚠️ Common Push Mistakes (Read Before Pushing)

| Mistake | Symptom | Fix |
|---|---|---|
| Pushed to `master` instead of `main` | No GitHub Action runs, release never appears | `git checkout main`, cherry-pick or re-commit your changes, push to `main` |
| Pushed branch but forgot the tag | No GitHub Action runs | `git tag vX.X.X.X` then `git push origin vX.X.X.X` |
| Tag pushed before branch | CI can't find the commit | Push `main` first, then the tag |
| Stale tag from a bad push | CI fails or creates wrong release | `git tag -d vX.X.X.X && git push origin :refs/tags/vX.X.X.X` then re-tag |
| 5-part version (e.g. `v3.4.8.5.1`) | Crashes Jellyfin plugin catalog for ALL users | Use only 4-part `Major.Minor.Build.Revision` format |



## ⚠️ Critical Versioning Rules

> **VERSION FORMAT:** Jellyfin uses .NET's `Version` class which supports **only** `Major.Minor.Build.Revision` (4 numbers). Using 5-part version tags (e.g., `v2.0.0.0.1`) causes a parsing exception that **crashes the entire Jellyfin plugin catalog page** for all users. Do not do this.

> **TAG FORMAT:** The CI pipeline handles both 3-part tags (`v1.0.4` → auto-appends `.0`) and 4-part tags (`v3.4.8.5` → used as-is). Either format works, but be consistent.

> **csproj MUST match tag:** The `<Version>`, `<AssemblyVersion>`, and `<FileVersion>` in the `.csproj` must be bumped to match the intended git tag *before* the commit is pushed. Otherwise the zipped DLL carries the old version and Jellyfin shows the wrong "Active" version string in its UI.

---

## Option B: Manual Build Trigger (No Tag Needed)

1. Go to **GitHub → Actions → Build & Release Plugin**
2. Click **Run workflow → Run workflow**
3. The pipeline will use version `1.0.1` by default (only for testing — do not use for real releases)

---

## Installing in Jellyfin

1. Open Jellyfin Web UI → **Dashboard → Plugins → Repositories**
2. Click **Add** and paste:
   ```
   https://raw.githubusercontent.com/Hu1k1e/Jellyfin_Latestmedia/main/manifest.json
   ```
3. Go to the **Catalog** tab → find **Latest Media & Management** → click **Install**
4. ⚠️ **REQUIRED DEPENDENCY:** Search the catalog for **File Transformation** (a standard community plugin) and install it. Without it, Jellyfin's security policy blocks the plugin's UI injection mechanism. The plugin will appear to load but no header UI will appear.
5. **Restart Jellyfin** completely (not just a soft reload).

> **Plugin catalog caching:** GitHub's raw CDN and Jellyfin's plugin catalog both cache. If a new version doesn't appear immediately, go to **Dashboard → Plugins → Catalog** and click the **Refresh** icon, or wait ~5 minutes.

---

## Project Structure

```
Jellyfin_Latestmedia/
├── .github/workflows/build-release.yml  # CI/CD pipeline
├── Api/
│   ├── AnnouncementController.cs        # Announcement CRUD + badge
│   ├── ArrController.cs                 # Sonarr/Radarr proxy (queue, profiles, test)
│   ├── BrandingController.cs            # Custom branding image upload/serve
│   ├── ChatController.cs                # Public chat + E2E encrypted DMs
│   ├── LatestMediaController.cs         # Latest media + Leaving Soon list
│   ├── MediaManagementController.cs     # Admin: schedule/cancel deletions
│   ├── RatingsCacheController.cs        # Trigger/read community ratings cache
│   ├── ScheduledTaskController.cs       # Trigger Jellyfin scheduled tasks
│   └── SeerrProxyController.cs          # Full Jellyseerr API proxy
├── Configuration/
│   ├── PluginConfiguration.cs           # All plugin settings
│   └── configPage.html                  # Dashboard config UI (embedded)
├── Data/
│   └── PluginRepository.cs              # Thread-safe JSON persistence
├── Models/                              # DTOs (no business logic)
├── Services/
│   ├── AnnouncementSchedulerService.cs  # Recurring announcements
│   ├── ChatCleanupService.cs            # Chat retention cleanup
│   ├── CommunityRatingsCacheTask.cs     # Pre-warms RT/IMDb ratings
│   ├── DeletionSchedulerService.cs      # Executes scheduled deletions (Jellyfin + Radarr/Sonarr + disk)
│   └── WatchlistMonitor.cs             # IHostedService: auto-adds requested media to user watchlists
├── Web/
│   ├── inject.js                        # Bootloader (injected into index.html)
│   ├── latestmedia.js                   # Core UI: header, chat, media management
│   ├── playback-controls.js             # Auto-pause/resume/PiP tab controls
│   ├── random-button.js                 # Random play header button
│   ├── seerr-integration.js             # Jellyseerr search, request, discovery
│   ├── branding.js                      # Reads server branding config
│   ├── apply-branding.js                # Applies logos, favicons, CSS
│   ├── arr-integration.js               # *arr queue panel + quick links
│   └── requests-page.js                 # Requests management full-page view
├── Plugin.cs                            # Plugin entry point + GetPages()
├── PluginServiceRegistrar.cs            # DI service registration
├── Jellyfin_Latestmedia.csproj          # net9.0 project file
├── manifest.json                        # Auto-updated by CI
├── instructions.md                      # ← This file
└── project_specs.md                     # Full implementation history + next steps (READ FIRST)
```

---

## Key `.csproj` Settings (Critical for Jellyfin Compatibility)

```xml
<!-- Pin to STABLE Jellyfin packages, NOT unstable wildcards -->
<PackageReference Include="Jellyfin.Controller" Version="10.11.5">
  <ExcludeAssets>runtime</ExcludeAssets>
</PackageReference>
<PackageReference Include="Jellyfin.Model" Version="10.11.5">
  <ExcludeAssets>runtime</ExcludeAssets>
</PackageReference>

<!-- Every Web/*.js and Configuration/*.html file must be an EmbeddedResource -->
<None Remove="Web\latestmedia.js" />
<EmbeddedResource Include="Web\latestmedia.js" />
```

> **WARNING:** Using `10.11.0-unstable.*` wildcard packages causes the plugin to fail silently at runtime. Always pin to a tested stable version.

> **WARNING:** If you add a new JS file to `Web/`, you must:
> 1. Add `<None Remove>` + `<EmbeddedResource Include>` entries to the `.csproj`
> 2. Add a new `PluginPageInfo` entry in `Plugin.cs` `GetPages()`
> 3. Load it from `inject.js` (the bootloader)

---

## Architecture Notes

- **UI Injection:** `ScriptInjectionStartupFilter` (IStartupFilter) wraps the response pipeline and appends `inject.js` to every `index.html` response. This requires the **File Transformation** community plugin.
- **JS Module Loading:** `inject.js` dynamically fetches each module via Jellyfin's `/web/configurationpage?name=<module-name>` endpoint.
- **Data Persistence:** All state is JSON files managed by `PluginRepository`. Files live in Jellyfin's plugin data directory alongside the config XML.
- **Auth:** Controllers use `User.IsInRole("Administrator")` (JWT claim) with a reflection-based fallback for Jellyfin 10.11 compatibility.
- **WebCrypto E2E Chat:** ECDH key exchange with keys stored server-side. All decryption is client-side only. Keys are memoized in a Map for O(1) repeated decryption.
- **Deletion Flow:** `DeletionSchedulerService` first calls Radarr/Sonarr (delete + import exclusion) while provider IDs are still accessible, *then* calls `_libraryManager.DeleteItem`.

---

## Jellyfin Catalog Update Note

GitHub's raw CDN and Jellyfin both cache manifests. After a release:
- Force refresh in Jellyfin: **Dashboard → Plugins → Catalog → Refresh icon**
- Or wait ~5 minutes for GitHub's CDN cache to expire
