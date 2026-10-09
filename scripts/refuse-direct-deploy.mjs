console.error([
  'Direct Cloudflare deploys are disabled for this repository.',
  'Use the protected GitHub Actions release flow so target checks and production approval are recorded.',
].join('\n'));
process.exit(1);
