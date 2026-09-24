const VERCEL_HOST = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.NEXT_PUBLIC_VERCEL_URL;

export const SITE = {
  name: "AI Native DevRel",
  founder: "Shawn Esquivel",
  url: VERCEL_HOST ? `https://${VERCEL_HOST}` : "https://www.shawn-builds.com",
  email: "shawn@amihanventures.ca",
  description:
    "DevRel as a subscription. Submit a ticket (or let your agent do it) and get blogs, long-form YouTube, X content, and cookbooks shipped by a developer who builds with AI every day.",
};

export const IMAGES = {
  avatar: "/agency/shawn.png",
  cursorVancouver: "/about-me-cursor-workshops.png",
  cursorThailand: "/about-me-cursor-thailand.png",
};

export const CTA = {
  label: "Book an intro call",
  href: "https://cal.com/shawn-ai/30min",
};

export const SOCIALS = [
  { label: "YouTube", href: "https://www.youtube.com/@shawn.builds" },
  { label: "X", href: "https://x.com/shawnbuilds" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/shawnesquivel/" },
  { label: "GitHub", href: "https://github.com/shawnesquivel" },
  { label: "Instagram", href: "https://www.instagram.com/shawn.builds/" },
];

export const STATS = [
  { value: "26K+", label: "YouTube subscribers" },
  { value: "8.5M", label: "sub FreeCodeCamp feature" },
  { value: "4K+", label: "students taught" },
  { value: "500K+", label: "impressions from one event" },
];

export type WorkCategory = "Long-form video" | "Short-form" | "Writing" | "Cookbooks & code" | "Courses" | "Community";

export type WorkItem = {
  title: string;
  category: WorkCategory;
  metric?: string;
  description: string;
  href: string;
  brand?: string;
  youtubeId?: string;
};

export const WORK: WorkItem[] = [
  {
    title: "Build an AI agent with Vercel, Composio and Cursor",
    category: "Long-form video",
    brand: "freeCodeCamp",
    metric: "8.5M-sub channel",
    description: "Full-length course on freeCodeCamp: ship a tool-using agent with Vercel AI SDK, Composio, and Cursor.",
    href: "https://www.youtube.com/watch?v=hIh2O9OL69o",
    youtubeId: "hIh2O9OL69o",
  },
  {
    title: "Explaining Gumloop Skills",
    category: "Long-form video",
    brand: "Gumloop",
    description: "Product explainer that walks developers through Gumloop Skills from zero to working automation.",
    href: "https://www.youtube.com/watch?v=3b25TnusP7I",
    youtubeId: "3b25TnusP7I",
  },
  {
    title: "@shawn.builds on YouTube",
    category: "Long-form video",
    metric: "26K+ subscribers",
    description: "Tutorials on Cursor, Claude Code, MCP, and shipping AI apps.",
    href: "https://www.youtube.com/@shawn.builds",
  },
  {
    title: "Viral Instagram reel",
    category: "Short-form",
    metric: "180K+ views",
    description: "Short-form AI coding content that reached well beyond the developer bubble.",
    href: "https://www.instagram.com/reels/DNM8aS6y3dh/",
  },
  {
    title: "RentAHuman launch reaction",
    category: "Short-form",
    metric: "90K+ views",
    description: "Timely X post riding a breaking AI news cycle.",
    href: "https://x.com/shawnbuilds/status/2032550830042394979",
  },
  {
    title: "Composio is now available on Warp",
    category: "Short-form",
    brand: "Composio",
    metric: "10K+ views",
    description: "Launch post announcing Composio's Warp integration.",
    href: "https://x.com/shawnbuilds/status/2076653097338724843",
  },
  {
    title: "Composio as a Cursor plugin",
    category: "Short-form",
    brand: "Cursor × Composio",
    metric: "5K+ views",
    description: "Built and shipped the plugin, then launched it on X.",
    href: "https://x.com/shawnbuilds/status/2075271401263476808",
  },
  {
    title: "Stop wasting your time watching Claude Code",
    category: "Short-form",
    brand: "Claude Code",
    description: "LinkedIn developer-activation post on running Claude Code in the background.",
    href: "https://www.linkedin.com/posts/shawnesquivel_stop-wasting-your-time-watching-claude-code-activity-7444382942673547265-es02",
  },
  {
    title: "Claude Code can now build and run AI-powered apps",
    category: "Short-form",
    brand: "Claude Code",
    description: "LinkedIn walkthrough driving developers to try a new Claude Code workflow.",
    href: "https://www.linkedin.com/posts/shawnesquivel_claude-code-can-now-build-and-run-ai-powered-activity-7444850140575715329-JfIk",
  },
  {
    title: "We just solved OAuth",
    category: "Short-form",
    brand: "Composio",
    description: "LinkedIn post explaining agent OAuth in one scroll.",
    href: "https://www.linkedin.com/posts/shawnesquivel_we-just-solved-oauth-just-grant-apps-access-activity-7445487603325411329-uGN5",
  },
  {
    title: "AEO technical writing for Composio",
    category: "Writing",
    brand: "Composio",
    description: "Answer-engine-optimized technical articles for Composio's developer blog.",
    href: "https://composio.dev/blog",
  },
  {
    title: "Composio plugins for Claude, ChatGPT, OpenClaw & Cursor",
    category: "Cookbooks & code",
    brand: "Composio",
    description: "Shipped official plugins that connect agents to 1,000+ apps.",
    href: "https://github.com/ComposioHQ/composio-mcp-plugin",
  },
  {
    title: "jupyterlab-git (MLH Fellowship)",
    category: "Cookbooks & code",
    brand: "Jupyter",
    description: "Merged open-source contributions to the JupyterLab Git extension.",
    href: "https://github.com/jupyterlab/jupyterlab-git",
  },
  {
    title: "Matchya: AI wellness companion",
    category: "Cookbooks & code",
    metric: "8,000+ users",
    description: "Solo-built AI mobile app with a 5-star App Store rating.",
    href: "https://apps.apple.com/ca/app/matchya-wellness-companion/id6752518461",
  },
  {
    title: "LangChain & Cursor courses on Udemy",
    category: "Courses",
    metric: "4K+ students",
    description: "Hands-on courses on building AI apps with LangChain and Cursor.",
    href: "https://www.udemy.com/user/shawn-esquivel-2/",
  },
  {
    title: "Build Apps with Cursor",
    category: "Courses",
    metric: "800+ students",
    description: "Paid Cursor course covering agents, rules, MCP, and background agents.",
    href: "https://shawn-builds.com",
  },
  {
    title: "Cursor hackathon: 80 people showed up to build Canada",
    category: "Community",
    brand: "Cursor",
    metric: "500K+ impressions",
    description: "Organized an 80-builder hackathon that generated 500K+ impressions across X and LinkedIn.",
    href: "https://www.linkedin.com/posts/shawnesquivel_80-people-showed-up-to-build-canada-activity-7444429338130731008-ftql",
  },
  {
    title: "IRL events for Cursor, Codex & OpenClaw",
    category: "Community",
    brand: "Cursor · Codex · OpenClaw",
    metric: "200+ attendees",
    description: "Cursor Vancouver meetups, a 100-guest Cursor meetup in Thailand, and more on Luma.",
    href: "https://luma.com/user/usr-aAbNymCdKuliJCa",
  },
];

export const TWEET_IDS = ["2032550830042394979", "2076653097338724843", "2075271401263476808"];

export const FAQ = [
  {
    q: "How does the subscription work?",
    a: "You pay one flat monthly fee and get access to the request queue. Add as many requests as you want (blogs, videos, threads, cookbooks) and they get shipped one by one in priority order. No contracts, no hiring process.",
  },
  {
    q: "Is it really unlimited requests?",
    a: "Yes. Your queue has no cap. Requests are worked on one at a time so each piece gets full attention, and most land within a few business days. Bigger items (like a 20-minute YouTube tutorial) are split into milestones so you see progress fast.",
  },
  {
    q: "Isn't this just AI-generated content?",
    a: "No. AI is in the workflow, not in charge of it. Every piece is planned, built, and reviewed by a developer who has actually run the code. Cookbooks are tested against the latest SDK, videos are recorded on real projects, and nothing ships that reads like slop.",
  },
  {
    q: "Do I need to hire a video editor?",
    a: "No. Scripting, recording, editing, captions, and thumbnails are included. You get a publish-ready video for YouTube, X, Reels, or Shorts.",
  },
  {
    q: "How do I send requests?",
    a: "Two ways. Connect the official AI Native DevRel MCP server to Cursor, Claude Code, or Codex, and your agent can file requests, check their status, and grab the finished link without leaving your editor. Or skip the setup entirely: you get a private Slack channel where you send requests, updates, and feedback, and drafts come back in the same thread.",
  },
  {
    q: "Is the MCP server safe to connect?",
    a: "Each team gets its own API key, and your agent can only ever see your own requests. Keys can be revoked instantly, and every request is validated and rate limited before it reaches the queue.",
  },
  {
    q: "Who owns the content?",
    a: "You do. Everything is delivered for you to publish under your brand, on your blog, docs, and socials.",
  },
  {
    q: "What topics do you cover?",
    a: "AI developer tools and infrastructure: coding agents, MCP, LLM APIs, agent frameworks, and SDKs in TypeScript and Python. If your users are developers building with AI, it's a fit.",
  },
  {
    q: "Can I pause or cancel?",
    a: "Anytime. Pause when your launch calendar is quiet and pick up where you left off. Cancel with one email.",
  },
];
