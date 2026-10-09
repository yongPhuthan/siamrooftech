import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const wrangler = 'node_modules/.bin/wrangler';
execFileSync(wrangler, ['types', '--env-interface', 'CloudflareEnv', '--include-runtime', 'false'], { stdio: 'inherit' });
execFileSync(wrangler, ['types', 'cloudflare-runtime.d.ts', '--include-env', 'false'], { stdio: 'inherit' });
// Scope generated workerd declarations so they do not replace Next.js browser DOM types.
const runtimeTypes = readFileSync('cloudflare-runtime.d.ts', 'utf8')
  .replace(/\n?export type \{ SendEmail, EmailMessageBuilder \};\s*$/gm, '')
  .trimEnd();
writeFileSync('cloudflare-runtime.d.ts', `${runtimeTypes}\n\nexport type { SendEmail, EmailMessageBuilder };\n`);
writeFileSync('worker-configuration.d.ts', "type SendEmail = import('./cloudflare-runtime').SendEmail;\n" + readFileSync('worker-configuration.d.ts', 'utf8'));
