import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { test } from "node:test";

const commands = [];

function start(command, args, env) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...env },
    stdio: "ignore",
  });
  commands.push(child);
  return child;
}

async function waitForHealth(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // The development server has not started yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Health check did not become ready: ${url}`);
}

test.after(() => commands.forEach((child) => child.kill()));

test("portal and auth report ready after their database schemas are available", async () => {
  const databaseUrl = "postgres://portal:portal@localhost:5433/usstm";
  const authDatabaseUrl = "postgres://auth:auth@localhost:5433/usstm";

  start("docker", ["compose", "up", "--wait", "postgres"]);
  start("pnpm", ["--filter", "portal", "dev"], { DATABASE_URL: databaseUrl });
  start("pnpm", ["--filter", "auth", "dev"], {
    DATABASE_URL: authDatabaseUrl,
    BETTER_AUTH_SECRET: "integration-test-secret-at-least-32-characters",
    GOOGLE_CLIENT_ID: "integration-test-google-client",
    GOOGLE_CLIENT_SECRET: "integration-test-google-secret",
  });

  const [portal, auth] = await Promise.all([
    waitForHealth("http://localhost:3000/health"),
    waitForHealth("http://localhost:3001/health"),
  ]);

  assert.deepEqual(await portal.json(), { status: "ready" });
  assert.deepEqual(await auth.json(), { status: "ready" });
});
