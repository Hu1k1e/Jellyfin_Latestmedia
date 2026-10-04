# Web/src — readable sources for the embedded scripts

`Web/latestmedia.js`, `Web/chat.js` and `Web/star-ratings.js` are **minified builds** of the files in this folder.
Only the files in `Web/` are embedded in the plugin DLL; `Web/src/` is for humans (and AI assistants) to edit.

| Source | Build output | Loaded |
|---|---|---|
| `latestmedia.src.js` | `Web/latestmedia.js` | always (core UI: header buttons, Latest Media, announcements, media management, maintenance banner) |
| `chat.src.js` | `Web/chat.js` | only when **Enable Chat** is on (chat, E2E DMs, DM notifications) |
| `star-ratings.src.js` | `Web/star-ratings.js` | only when **Show star rating on cards** is on |

## Rebuild after editing a source file

Requires Node.js. Nothing is added to the repo or to the plugin build (`npx` downloads terser on demand):

```bash
cd Web
npx terser src/latestmedia.src.js  -c -m -o latestmedia.js
npx terser src/chat.src.js         -c -m -o chat.js
npx terser src/star-ratings.src.js -c -m -o star-ratings.js
node --check latestmedia.js && node --check chat.js && node --check star-ratings.js
```

Commit the source **and** the rebuilt file together, otherwise they drift apart.

## How the modules fit together

- `latestmedia.js` exposes shared helpers on `window.__lmCore` (`S, api, esc, ICO, G, outsideClose, removeOverlay`) and an empty `chat` object (`LMC` in the source).
- `chat.js` reads `window.__lmCore`, and registers `openChat, closeChat, refreshBadge, injectToastContainer, destroyToastContainer, startNotificationPolling, tryInjectPlayerChat, resetUser` on `window.__lmCore.chat`.
  The core calls them with optional chaining (`LMC.openChat?.()`), so a missing/failed module never breaks the rest of the UI.
- All module URLs carry `&v=<plugin version>` (read from the core script tag) so the server can send a long-lived `Cache-Control`.
- A single shared timer (3 s) drives the heartbeat; the chat badge (~30 s) and the "slow" tasks in `LM_SLOW` (announcements, countdowns, maintenance banner, ~60 s) hang off it.
- When you add a new module: add `<EmbeddedResource>` in the csproj, a `PluginPageInfo` in `Plugin.cs`, and its name to `OwnPageNames` in `ScriptInjectionMiddleware.cs`.
