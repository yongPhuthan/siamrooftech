import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawn } from 'node:child_process';

const port = process.argv[2] ?? '3000';
if (!/^\d+$/.test(port) || Number(port) < 1024 || Number(port) > 65535) throw new Error('Choose a local port between 1024 and 65535.');
const configPath = 'wrangler.preview.generated.jsonc';
const config = JSON.parse(readFileSync('wrangler.jsonc', 'utf8'));
if (!config.account_id) throw new Error('Configure the Cloudflare account before enabling email delivery.');
// Clone one configuration; only email is remote. D1/R2 keep their local bindings.
config.send_email = config.send_email.map((binding) => ({ ...binding, remote: true }));
config.d1_databases = config.d1_databases.map((binding) => ({ ...binding, remote: false }));
config.r2_buckets = config.r2_buckets.map((binding) => ({ ...binding, remote: false }));
config.vars.AUTH_EMAIL_DELIVERY = 'live';
writeFileSync(configPath, JSON.stringify(config, null, 2));
const child = spawn('node_modules/.bin/wrangler', [
  'dev', '--config', configPath, '--port', port, '--var', `BETTER_AUTH_URL:http://localhost:${port}`,
], { stdio: 'inherit', env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: config.account_id } });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', (code) => {
  try { unlinkSync(configPath); } catch { /* Generated config may already have been removed. */ }
  process.exitCode = code ?? 0;
});
