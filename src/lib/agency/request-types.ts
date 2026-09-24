export const REQUEST_TYPES = {
  blog: {
    label: "Blog post",
    description: "SEO/AEO-optimized technical blog post (1,200–2,000 words).",
    deliverables: ["Markdown draft", "Cover image", "Code snippets tested end-to-end"],
    turnaroundDays: 3,
  },
  article: {
    label: "Long-form article",
    description: "Deep-dive guide or launch article with diagrams (2,500+ words).",
    deliverables: ["Markdown draft", "Diagrams", "Companion repo"],
    turnaroundDays: 5,
  },
  shortform: {
    label: "Short-form video",
    description: "Vertical 30–90s video for X, Reels, Shorts, and TikTok.",
    deliverables: ["Edited vertical video", "Captions", "Post copy"],
    turnaroundDays: 3,
  },
  longform: {
    label: "Long-form video",
    description: "10–30 minute YouTube tutorial, scripted, recorded, and edited.",
    deliverables: ["Edited 16:9 video", "Thumbnail", "Chapters + description"],
    turnaroundDays: 7,
  },
  thread: {
    label: "X / LinkedIn thread",
    description: "Launch thread or developer-activation post with visuals.",
    deliverables: ["Thread copy", "Screenshots / GIFs", "Posting schedule"],
    turnaroundDays: 2,
  },
  cookbook: {
    label: "Cookbook",
    description: "Runnable example app or notebook that shows your API in action.",
    deliverables: ["GitHub repo or notebook", "README walkthrough", "Tested on latest SDK"],
    turnaroundDays: 5,
  },
} as const;

export type RequestType = keyof typeof REQUEST_TYPES;
export const TYPE_KEYS = Object.keys(REQUEST_TYPES) as [RequestType, ...RequestType[]];

export const AUDIENCES = ["beginner", "intermediate", "advanced"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const PRIORITIES = ["normal", "rush"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const REQUEST_STATUSES = ["queued", "in_progress", "in_review", "shipped", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
