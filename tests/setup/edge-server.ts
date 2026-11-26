/**
 * Starts the built site on a local Cloudflare runtime (wrangler dev) for the
 * duration of the test run. Redirects, headers and the 404 page are then tested
 * against the same asset-serving code that runs in production.
 *
 * Set EDGE_URL to test a deployed site instead, such as a preview or the live
 * domain: `EDGE_URL=https://yesbhautik.co.in pnpm test:live`.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    edgeUrl: string;
  }
}

const freePort = () =>
  new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });

async function waitFor(url: string, timeoutMs: number, output: () => string): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status < 500) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`wrangler dev did not start within ${timeoutMs / 1000}s.\n${output()}`);
}

export default async function setup(project: TestProject) {
  const remote = process.env.EDGE_URL?.replace(/\/+$/, '');
  if (remote) {
    project.provide('edgeUrl', remote);
    return;
  }

  const root = process.cwd();
  if (!existsSync(join(root, 'dist', 'index.html'))) {
    throw new Error('No built site in dist/. Run "pnpm build" before the tests.');
  }

  const [port, inspectorPort] = await Promise.all([freePort(), freePort()]);
  let log = '';
  const child = spawn(
    join(root, 'node_modules', '.bin', 'wrangler'),
    [
      'dev',
      '--port',
      String(port),
      '--ip',
      '127.0.0.1',
      '--inspector-port',
      String(inspectorPort),
      '--show-interactive-dev-session=false',
      '--log-level',
      'warn',
    ],
    {
      cwd: root,
      env: { ...process.env, WRANGLER_SEND_METRICS: 'false', NO_COLOR: '1' },
      stdio: ['ignore', 'pipe', 'pipe'],
      // Its own process group, so the runtime it starts can be stopped with it.
      detached: true,
    },
  );
  child.stdout.on('data', (chunk: Buffer) => (log += chunk.toString()));
  child.stderr.on('data', (chunk: Buffer) => (log += chunk.toString()));

  const url = `http://127.0.0.1:${port}`;
  try {
    await waitFor(`${url}/robots.txt`, 90_000, () => log);
  } catch (error) {
    if (child.pid) process.kill(-child.pid, 'SIGKILL');
    throw error;
  }
  project.provide('edgeUrl', url);

  return async () => {
    if (!child.pid || child.exitCode !== null) return;
    const exited = new Promise((resolve) => child.once('exit', resolve));
    process.kill(-child.pid, 'SIGTERM');
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 5_000))]);
    if (child.exitCode === null) process.kill(-child.pid, 'SIGKILL');
  };
}
