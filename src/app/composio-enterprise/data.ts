export const providers = [
  "OpenAI",
  "Anthropic",
  "Google",
  "xAI",
  "Meta",
  "DeepSeek",
  "Qwen",
  "Perplexity",
  "Mistral",
];

export const applications = [
  "Gmail",
  "Slack",
  "GitHub",
  "Notion",
  "Jira",
  "Salesforce",
  "HubSpot",
  "Linear",
  "Calendar",
];

export const bridgeFeatures = [
  {
    tag: "Security",
    title: "SOC 2 / ISO 27001:2022",
    description:
      "Independently audited and certified. End-to-end encryption, zero-day log retention by default, and regular third-party penetration testing.",
  },
  {
    tag: "Governance",
    title: "Stay in control",
    description:
      "Fine-grained data access controls, human-in-the-loop review policies, and configurable permission boundaries across your organization.",
  },
  {
    tag: "Observability",
    title: "Know Your Agent",
    description:
      "Complete audit trails for every tool call, auth event, and execution. Know exactly what your agents did, when, and why.",
  },
  {
    tag: "Your Infrastructure",
    title: "Deploy on your terms",
    description:
      "Run Composio on your own cloud for full control over data residency, network boundaries, and compliance requirements.",
  },
  {
    tag: "Reliability",
    title: "Ready for enterprise",
    description:
      "Automatic retries, failovers, and rate-limit handling across every integration. Your agents stay running even when upstream APIs don't.",
  },
  {
    tag: "Flexibility",
    title: "Avoid vendor lock-in",
    description:
      "Swap models and providers freely. Your tools, auth, and agent logic carry over — zero rework.",
  },
];

export const whyEnterprise = [
  {
    tag: "Security",
    title: "SOC 2 / ISO 27001:2022",
    description: "Nothing is more important than secure handling of your data.",
  },
  {
    tag: "Governance",
    title: "Stay in control",
    description: "Control and secure your data internally.",
  },
  {
    tag: "Observability",
    title: "Know your agent",
    description: "Logging ensures that you always know what your agents are doing.",
  },
  {
    tag: "Granularity",
    title: "Limit blast radius",
    description: "Limit agent access to only the tools they need.",
  },
  {
    tag: "Reliability",
    title: "Ready for enterprise",
    description: "Automatic retries and failovers keep your agents running.",
  },
  {
    tag: "Flexibility",
    title: "Avoid vendor lock-in",
    description:
      "Swap freely between all major providers without losing access to your integrations.",
  },
];

export const toolScopes: {
  app: string;
  scopes: { name: string; enabled: boolean }[];
}[] = [
  {
    app: "Gmail",
    scopes: [
      { name: "READ EMAILS", enabled: true },
      { name: "SEND EMAILS", enabled: true },
      { name: "CREATE DRAFTS", enabled: true },
      { name: "DELETE EMAILS", enabled: false },
    ],
  },
  {
    app: "Slack",
    scopes: [
      { name: "POST MESSAGES", enabled: true },
      { name: "READ CHANNELS", enabled: true },
      { name: "CREATE CHANNELS", enabled: false },
      { name: "INVITE USERS", enabled: false },
    ],
  },
  {
    app: "GitHub",
    scopes: [
      { name: "VIEW REPOS", enabled: true },
      { name: "PULL CODE", enabled: true },
      { name: "PUSH CODE", enabled: true },
      { name: "DELETE BRANCHES", enabled: false },
    ],
  },
];

export const dataHandlingCards = [
  {
    title: "SOC 2 / ISO 27001:2022",
    description: "Independently audited and certified.",
    chips: ["AICPA SOC 2 TYPE 2", "ISO 27001"],
    chipStyle: "badge" as const,
  },
  {
    title: "Governance",
    description: "Full authority over agent behavior.",
    chips: ["HUMAN REVIEW", "AUDIT LOGGING", "DATA EXPORT", "DELETE OPS"],
    chipStyle: "policy" as const,
  },
  {
    title: "Access Controls",
    description: "Principle of least privilege, enforced at every layer.",
    chips: ["ADMIN", "DEVELOPER", "AGENT", "READ ONLY", "NO DELETE"],
    chipStyle: "role" as const,
  },
];

export type PricingTier = {
  name: string;
  price: string;
  unit: string;
  calls: string;
  support: string;
  overage?: string;
  cta: string;
  highlight?: boolean;
};

export const pricingTiers: PricingTier[] = [
  {
    name: "Totally Free",
    price: "$0",
    unit: "/ month",
    calls: "20K Tool Calls/Mo",
    support: "Community Support",
    cta: "Start Building",
  },
  {
    name: "Ridiculously Cheap",
    price: "$29",
    unit: "/ month",
    calls: "200K Tool Calls/Mo",
    support: "Email Support",
    overage: "$0.299 / 1K additional calls",
    cta: "Get Started",
    highlight: true,
  },
  {
    name: "Serious Business",
    price: "$229",
    unit: "/ month",
    calls: "2M Tool Calls/Mo",
    support: "Slack Support (1K+/Month)",
    overage: "$0.249 / 1K additional calls",
    cta: "Get Started",
  },
];

export const enterpriseFeatures = [
  "Custom User Accounts",
  "Dedicated SLA & SOC-2",
  "Custom API Volume",
  "VPC / On-Prem Option",
];

export const trustedBy = ["ACME CORP", "GLOBEX", "INITECH", "UMBRELLA", "STARK LABS", "WAYNE TECH"];
