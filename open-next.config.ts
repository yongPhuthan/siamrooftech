import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

// The current production Worker bundle was generated with the workerd condition
// disabled. Keeping that behavior avoids a jose/jwks-rsa resolution issue from
// firebase-admin during OpenNext server bundling.
config.cloudflare = {
  ...config.cloudflare,
  useWorkerdCondition: false,
};

export default config;
