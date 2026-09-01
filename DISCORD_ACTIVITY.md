# Discord Activity deployment — v1.7

Application ID: `1544123374513430528`

## Files to update on GitHub
For the v1.7 Activity build, replace/upload:

- `index.html`
- `style.css`
- `discord-activity.js`

The item data files and `app.js` do not need to change for this Activity-specific update.

## Discord Developer Portal
Keep the existing Activity URL mapping pointed at:

`celtichero2026.github.io/Celtic-Heroes-Encyclopedia/`

No OAuth scopes are required for this version.

## What this build does
When loaded normally from GitHub Pages, the encyclopedia behaves like a normal website.

When Discord launches it as an Activity, `discord-activity.js`:
1. detects the Discord Activity environment,
2. creates a `DiscordSDK` using the public Application ID,
3. waits for Discord's READY handshake,
4. enables the compact Activity-specific layout.

If the SDK cannot initialize, the encyclopedia falls back to normal website behavior instead of blocking the app.

## Testing
After GitHub Pages redeploys:
1. Close the existing Activity instance.
2. Relaunch CH Encyclopedia from Discord.
3. Test Items & Loot, Quest Guides, Favorites, and a few long item/set pages.
4. Resize the Activity window and verify the result/detail panels scroll independently.
