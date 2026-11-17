import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

export default defineCloudflareConfig({
  // R2 stays the source of truth; the Cache API copy in the visitor's data center
  // (Bangkok for Thai visitors) avoids an R2 round trip on hits. Without automatic
  // cache purge the tag cache is still consulted on every hit, so publish and
  // unpublish invalidation remains immediate.
  incrementalCache: withRegionalCache(r2IncrementalCache, { mode: "long-lived" }),
  queue: doQueue,
  tagCache: d1NextTagCache,
  // Serve ISR hits from the routing layer without booting the Next.js server.
  // Middleware runs before interception, so its publication 404 gate still applies.
  // Must be false if Partial Prerendering is ever enabled.
  enableCacheInterception: true,
});
