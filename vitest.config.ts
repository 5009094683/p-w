import { defineConfig } from 'vitest/config';

/**
 * The tests check the built site in dist/, so run `pnpm build` first
 * (`pnpm verify` does). The setup file starts a local Cloudflare runtime so
 * that redirects, headers and the 404 page are tested as they will be served.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/setup/edge-server.ts'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
});
