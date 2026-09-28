# Commit 030: Every request reports where its time went

To find out why requests take 2 to 4 seconds, the site's API route (`pages/api/verde/[...path].js`) now sends the standard **`Server-Timing`** header, shown in the browser's Network tab under **Timing**:
- **This site:** the route's own time;
- **Trip to Verde and back:** the full request to Verde (measured in `lib/verdeServer.js`);
- **Verde's own breakdown,** passed through from Verde commit 528: API key, checks and the request itself.

It carries times only. Checked on a build against the mock, where the header comes through.

## Files
- `lib/verdeServer.js`
- `pages/api/verde/[...path].js`
- `DESIGN-ENGINEERING.md`
