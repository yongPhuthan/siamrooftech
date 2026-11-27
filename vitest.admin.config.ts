import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: { jsx: 'automatic' },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: { environment: 'node', include: ['src/app/api/admin/crm/*.test.ts', 'src/lib/api-auth.test.ts', 'src/lib/projects-agent-auth.test.ts', 'src/lib/image-loader.test.ts', 'src/features/projects/**/*.test.ts', 'src/app/api/health/**/*.test.ts', 'src/app/api/upload/**/*.test.ts', 'src/features/auth/**/*.test.ts', 'src/features/auth/**/*.test.tsx', 'src/features/openai-ads/**/*.test.ts'], clearMocks: true, testTimeout: 20000 },
});
