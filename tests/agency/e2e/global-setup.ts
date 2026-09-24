import { execSync, spawn, type ChildProcess } from "node:child_process";
import type { TestProject } from "vitest/node";

const PORT = 3210;
export const SLACK_PORT = 4599;
const DAILY_LIMIT = 5;

declare module "vitest" {
  export interface ProvidedContext {
    baseUrl: string;
    supabaseUrl: string;
    supabaseSecretKey: string;
    slackPort: number;
    dailyLimit: number;
  }
}

export default async function setup(project: TestProject) {
  const status = JSON.parse(execSync("npx supabase status -o json", { encoding: "utf8" }));
  const supabaseUrl: string = status.API_URL;
  const supabaseSecretKey: string = status.SECRET_KEY;

  execSync("npx supabase db reset --local", { stdio: "inherit" });

  const server: ChildProcess = spawn("node_modules/.bin/next", ["start", "-p", String(PORT)], {
    detached: true,
    env: {
      ...process.env,
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SECRET_KEY: supabaseSecretKey,
      SLACK_WEBHOOK_URL: `http://127.0.0.1:${SLACK_PORT}/slack`,
      DEVREL_DAILY_REQUEST_LIMIT: String(DAILY_LIMIT),
    },
    stdio: ["ignore", "inherit", "inherit"],
  });

  const baseUrl = `http://127.0.0.1:${PORT}`;
  await waitFor(`${baseUrl}/api/agency/requests`);

  project.provide("baseUrl", baseUrl);
  project.provide("supabaseUrl", supabaseUrl);
  project.provide("supabaseSecretKey", supabaseSecretKey);
  project.provide("slackPort", SLACK_PORT);
  project.provide("dailyLimit", DAILY_LIMIT);

  return () => {
    if (server.pid) process.kill(-server.pid, "SIGTERM");
  };
}

async function waitFor(url: string, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}
