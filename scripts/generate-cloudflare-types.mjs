import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';

const wrangler = 'node_modules/.bin/wrangler';
execFileSync(wrangler, ['types', '--env-interface', 'CloudflareEnv', '--include-runtime', 'false'], { stdio: 'inherit' });
execFileSync(wrangler, ['types', 'cloudflare-runtime.d.ts', '--include-env', 'false'], { stdio: 'inherit' });
// Scope generated workerd declarations so they do not replace Next.js browser DOM types.
appendFileSync('cloudflare-runtime.d.ts', '\nexport type { SendEmail, EmailMessageBuilder };\n');
writeFileSync('worker-configuration.d.ts', "type SendEmail = import('./cloudflare-runtime').SendEmail;\n" + readFileSync('worker-configuration.d.ts', 'utf8'));
