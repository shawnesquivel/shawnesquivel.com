---
title: "How to Deploy OpenClaw on Render (The Honest Guide)"
date: "2026-03-03"
description: "A step-by-step guide to hosting your own OpenClaw AI agent on Render — including the RAM gotchas, plan tradeoffs, and why Render beats AWS for this use case."
---

OpenClaw is a self-hosted AI agent that runs 24/7 on a machine you control. It connects to messaging apps — Telegram, Discord, Slack, WhatsApp — and can take real actions: send emails, create GitHub issues, browse the web, run shell commands. You message it, it does the thing.

The catch: it needs a machine to run on. This guide covers how to host it on Render, including every mistake I ran into.

---

## Why Render

There are three real options for hosting something like this:

**Raw cloud (AWS, GCP, Azure)** — you rent a virtual machine and manage everything yourself. OS updates, security, networking, scaling. Maximum control, maximum friction. Fine if you have a DevOps background. Overkill if you just want an AI agent running.

**Platform-as-a-Service (Render, Railway, Fly.io)** — you give them your code or a Docker image and they handle the machine underneath. You think about apps, not servers. This is the right tier for most people.

**No-code / managed (Vercel, Netlify)** — highly opinionated, designed for specific use cases like static sites. Not flexible enough for something like OpenClaw.

Render sits in the PaaS tier. It's the "modern Heroku" — same idea, better pricing, native Docker support. Why Render over the other PaaS options:

- **Railway** is very similar but more experimental. Render is more stable and has better documentation.
- **Fly.io** gives you more networking control, but it requires more configuration. Good if you need multi-region. Overkill otherwise.
- **DigitalOcean** has a 1-click OpenClaw Marketplace deploy, which is simpler — but you're managing a VPS, not a PaaS. More control, more responsibility.
- **Oracle Cloud Free Tier** gives you 4 cores and 24GB RAM permanently for free. The tradeoff: availability in good regions is spotty, and setup is more DIY.

Render wins for this use case because: one-click Blueprint deploy, persistent disk built-in, auto-HTTPS, and the OpenClaw team maintains an official `render.yaml` that handles all the configuration automatically.

---

## Understanding the Plans

This is the most important thing to understand before you start, because the wrong plan will waste your time.

| Plan | Cost | RAM | Spin-down | Persistent Disk |
|---|---|---|---|---|
| Free | $0 | 512 MB | After 15 min idle | ❌ Not available |
| Starter | $7/mo | 512 MB | Never | ✅ 1 GB+ |
| Standard | $25/mo | 2 GB | Never | ✅ 1 GB+ |

**The free tier has two fatal problems for OpenClaw:**

1. No persistent disk — every redeploy wipes your config, plugins, and API keys.
2. 512 MB RAM — OpenClaw's Node.js process needs at least 1 GB to start reliably. On 512 MB it crashes with a heap out-of-memory error every time.

**Starter ($7/mo) has one problem:** 512 MB RAM. Same OOM issue. You can work around it with `NODE_OPTIONS=--max-old-space-size=400`, but it's right at the edge and will fail under any real load.

**Standard ($25/mo) is what actually works.** 2 GB RAM, never spins down, persistent disk. OpenClaw's own docs recommend 2 GB. This is the one to use.

If you want to experiment first before paying $25/mo: use Starter, add the memory workaround, and accept it might be flaky. Upgrade to Standard when you want it to actually work.

---

## Step 1: Deploy with the Blueprint

OpenClaw has an official Render Blueprint — a single config file that defines your entire server setup. You don't configure anything manually.

1. Go to [render.com](https://render.com) and create an account if you don't have one.
2. Click this deploy link: **[render.com/deploy?repo=https://github.com/openclaw/openclaw](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)**
3. You'll be prompted to set one value: `SETUP_PASSWORD`. This is the password you'll use to access your OpenClaw dashboard. Pick something you'll remember.
4. Click **Apply** and wait. The first deploy takes 3–5 minutes — it's building a Docker image.

Your service URL will follow the pattern `https://openclaw-xxxx.onrender.com`.

---

## Step 2: Fix the Instance Type

Before anything else, go to your service settings and upgrade the instance.

1. In the Render Dashboard, click your `openclaw` service.
2. Go to **Settings** → find **Instance Type** → click **Update**.
3. Select **Standard** (2 CPU, 2 GB RAM).
4. Save.

If you skip this, your service will crash on every deploy with:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

---

## Step 3: Set the Node.js Memory Limit

Even on Standard with 2 GB, you need to tell Node.js it's allowed to use that memory. By default Node caps itself at ~256 MB.

1. Go to your service → **Environment** tab.
2. Find `NODE_OPTIONS` (or add it if it doesn't exist).
3. Set the value to: `--max-old-space-size=1536`
4. Click **Save Changes**. Render will trigger a redeploy automatically.

This tells Node it can use up to 1.5 GB of heap, leaving ~500 MB for the OS and container overhead on a 2 GB machine. This is exactly what OpenClaw's official Fly.io docs recommend for equivalent-size machines.

---

## Step 4: Complete the Setup Wizard

Once your deploy shows as **Live** in the Render Dashboard:

1. Navigate to `https://your-service.onrender.com/setup`
2. Enter the `SETUP_PASSWORD` you set in Step 1.
3. Select your model provider (Claude/Anthropic or OpenAI).
4. Paste your API key.
5. Optionally connect messaging channels — Telegram, Discord, Slack.
6. Click **Run Setup**.

Your control panel will be at `https://your-service.onrender.com/openclaw`.

---

## Step 5: Install the Composio Plugin (Optional)

Composio gives OpenClaw access to 1,000+ third-party tools — Gmail, GitHub, Notion, Slack, Linear, Salesforce, and more — through a single plugin. Instead of writing agent code yourself, OpenClaw becomes the agent.

First, get your consumer key from [dashboard.composio.dev](https://dashboard.composio.dev).

Then in the Render Dashboard → your service → **Shell** tab, run:

```bash
openclaw plugins install @composio/openclaw-plugin
openclaw config set plugins.entries.composio.config.consumerKey "ck_your_key_here"
openclaw gateway restart
```

Once it loads, all Composio tools are registered directly into the agent. You can message OpenClaw things like "create a GitHub issue and send me a Slack summary" and it just works.

---

## Troubleshooting

**Deploy fails with TypeScript errors during `build:plugin-sdk:dts`**

This is a known issue where broken commits land on `main`. It's not your Render config — it's a bug in OpenClaw's source code. Check [openclaw/openclaw issues](https://github.com/openclaw/openclaw/issues) to see if there's an open bug for it. Use the **Rollback** button in Render's Events tab to go back to the last working deploy while you wait for a fix.

**Service crashes with heap out of memory**

You're on a plan with insufficient RAM. 512 MB is too small. Upgrade to Standard and set `NODE_OPTIONS=--max-old-space-size=1536`.

**Config disappears after redeploy**

You're on the free tier, which has no persistent disk. Upgrade to Starter or Standard.

**Service is slow to respond the first time**

If you're on the free tier, the service spins down after 15 minutes of inactivity. First request after spin-down takes a few seconds to cold start. Upgrade to Starter or Standard for always-on.

---

## Keeping It Updated

Render won't auto-deploy when OpenClaw releases updates. To update manually:

Go to your service → click **Manual Deploy** → select **Deploy latest commit**.

You can also export your full config anytime at `/setup/export` — downloads a portable backup you can restore on any OpenClaw host.

---

Follow me on Instagram for more: [@shawnbuilds](https://instagram.com/shawnbuilds)
