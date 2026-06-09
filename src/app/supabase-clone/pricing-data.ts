export type Plan = {
  name: string;
  description: string;
  priceLabel: string;
  price: string;
  priceUnit?: string;
  cta: string;
  ctaVariant: "brand" | "outline";
  highlight?: boolean;
  featuresIntro?: string;
  features: string[];
  footer?: string;
};

export const plans: Plan[] = [
  {
    name: "Free",
    description: "Perfect for passion projects & simple websites.",
    priceLabel: "Free",
    price: "$0",
    priceUnit: "/ month",
    cta: "Start for Free",
    ctaVariant: "outline",
    featuresIntro: "Get started with:",
    features: [
      "Unlimited API requests",
      "50,000 monthly active users",
      "500 MB database size",
      "Shared CPU • 500 MB RAM",
      "5 GB egress",
      "5 GB cached egress",
      "1 GB file storage",
      "Community support",
    ],
    footer: "Free projects are paused after 1 week of inactivity. Limit of 2 active projects.",
  },
  {
    name: "Pro",
    description: "For production applications with the power to scale.",
    priceLabel: "From",
    price: "$25",
    priceUnit: "/ month",
    cta: "Get Started",
    ctaVariant: "brand",
    highlight: true,
    featuresIntro: "Everything in the Free Plan, plus:",
    features: [
      "100,000 monthly active users, then $0.00325 per MAU",
      "8 GB disk size per project, then $0.125 per GB",
      "250 GB egress, then $0.09 per GB",
      "250 GB cached egress, then $0.03 per GB",
      "100 GB file storage, then $0.0213 per GB",
      "Email support",
      "Daily backups stored for 7 days",
      "7-day log retention",
    ],
    footer: "Add Log Drains, additional $60 per drain, per project",
  },
  {
    name: "Team",
    description: "Add features such as SSO, control over backups, and industry certifications.",
    priceLabel: "From",
    price: "$599",
    priceUnit: "/ month",
    cta: "Get Started",
    ctaVariant: "outline",
    featuresIntro: "Everything in the Pro Plan, plus:",
    features: [
      "SOC2 & ISO 27001",
      "Project-scoped and read-only access",
      "HIPAA available as paid add-on",
      "SSO for Supabase Dashboard",
      "Priority email support & SLAs",
      "Daily backups stored for 14 days",
      "28-day log retention",
    ],
  },
  {
    name: "Enterprise",
    description: "For large-scale applications running Internet-scale workloads.",
    priceLabel: "",
    price: "Custom",
    cta: "Contact Us",
    ctaVariant: "outline",
    features: [
      "Designated Support manager",
      "Uptime SLAs",
      "BYO Cloud supported",
      "24×7×365 premium enterprise support",
      "Private Slack channel",
      "Custom Security Questionnaires",
    ],
  },
];

export const computeRows: {
  size: string;
  price: string;
  cpu: string;
  dedicated: boolean | null;
  ram: string;
  direct: string;
  pooler: string;
}[] = [
  { size: "Micro", price: "$10", cpu: "2-core ARM", dedicated: false, ram: "1 GB", direct: "60", pooler: "200" },
  { size: "Small", price: "$15", cpu: "2-core ARM", dedicated: false, ram: "2 GB", direct: "90", pooler: "400" },
  { size: "Medium", price: "$60", cpu: "2-core ARM", dedicated: false, ram: "4 GB", direct: "120", pooler: "600" },
  { size: "Large", price: "$110", cpu: "2-core ARM", dedicated: true, ram: "8 GB", direct: "160", pooler: "800" },
  { size: "XL", price: "$210", cpu: "4-core ARM", dedicated: true, ram: "16 GB", direct: "240", pooler: "1,000" },
  { size: "2XL", price: "$410", cpu: "8-core ARM", dedicated: true, ram: "32 GB", direct: "380", pooler: "1,500" },
  { size: "4XL", price: "$960", cpu: "16-core ARM", dedicated: true, ram: "64 GB", direct: "480", pooler: "3,000" },
  { size: "8XL", price: "$1,870", cpu: "32-core ARM", dedicated: true, ram: "128 GB", direct: "490", pooler: "6,000" },
  { size: "12XL", price: "$2,800", cpu: "48-core ARM", dedicated: true, ram: "192 GB", direct: "500", pooler: "9,000" },
  { size: "16XL", price: "$3,730", cpu: "64-core ARM", dedicated: true, ram: "256 GB", direct: "500", pooler: "12,000" },
  { size: ">16XL", price: "Contact Us", cpu: "Custom", dedicated: true, ram: "Custom", direct: "Custom", pooler: "Custom" },
];

export const diskTiers = [
  {
    name: "General Purpose",
    description: "Balance between price and performance",
    maxSize: "16 TB",
    rows: [
      ["Size", "8 GB included", "then $0.125 per GB"],
      ["IOPS", "3,000 IOPS included", "then $0.024 per IOPS"],
      ["Throughput", "125 MB/s included", "then $0.095 per MB/s"],
      ["Durability", "99.9%", ""],
    ],
  },
  {
    name: "High Performance",
    description: "For mission critical applications",
    maxSize: "60 TB",
    rows: [
      ["Size", "$0.195 per GB", ""],
      ["IOPS", "$0.119 per IOPS", ""],
      ["Throughput", "Scales automatically with IOPS", ""],
      ["Durability", "99.999%", ""],
    ],
  },
];

export const addons = [
  {
    name: "Point-in-Time Recovery",
    price: "$100 per month per 7 days retention",
    description: "Roll back to any specific point in time, down to the minute.",
  },
  {
    name: "Custom Domain",
    price: "$10 per domain per month per project",
    description: "Use your own domain for a branded experience.",
  },
  {
    name: "Database Branching",
    price: "$0.01344 per branch, per hour",
    description: "Test and preview changes in isolated environments.",
  },
  {
    name: "Advanced MFA (Phone)",
    price: "$75/month first project, then $10/month per project",
    description: "Add phone-based multi-factor authentication.",
  },
  {
    name: "SAML / SSO Auth",
    price: "50 MAUs included, then $0.015 per MAU",
    description: "Single Sign-On for your application's users.",
  },
  {
    name: "Log Drains",
    price: "$60 per drain/month + $0.20 per million events + $0.09 per GB egress",
    description: "Send logs to your preferred observability platform.",
  },
  {
    name: "Image Transformations",
    price: "100 origin images included, then $5 per 1000",
    description: "Resize and optimize images on the fly.",
  },
];

export type Cell =
  | { type: "check" }
  | { type: "cross" }
  | { type: "text"; value: string; sub?: string };

export type ComparisonSection = {
  category: string;
  rows: { feature: string; cells: [Cell, Cell, Cell, Cell] }[];
};

const yes: Cell = { type: "check" };
const no: Cell = { type: "cross" };
const t = (value: string, sub?: string): Cell => ({ type: "text", value, sub });

export const comparison: ComparisonSection[] = [
  {
    category: "Database",
    rows: [
      { feature: "Dedicated Postgres Database", cells: [yes, yes, yes, yes] },
      { feature: "Unlimited API requests", cells: [yes, yes, yes, yes] },
      {
        feature: "Database size",
        cells: [
          t("500 MB", "database size per project included"),
          t("8 GB disk size per project", "then $0.125 per GB"),
          t("8 GB disk size per project", "then $0.125 per GB"),
          t("Custom"),
        ],
      },
      { feature: "Advanced disk config", cells: [no, yes, yes, yes] },
      { feature: "Automatic backups", cells: [no, t("7 days"), t("14 days"), t("Custom")] },
      {
        feature: "Point in time recovery",
        cells: [
          no,
          t("$100 per month", "per 7 days retention"),
          t("$100 per month", "per 7 days retention"),
          t("$100 per month, per 7 days retention", ">28 days retention available"),
        ],
      },
      {
        feature: "Pausing",
        cells: [t("After 1 week of inactivity"), t("Never"), t("Never"), t("Never")],
      },
      {
        feature: "Branching",
        cells: [no, t("$0.01344 per branch, per hour"), t("$0.01344 per branch, per hour"), t("Custom")],
      },
      {
        feature: "Egress",
        cells: [
          t("5 GB included"),
          t("250 GB included", "then $0.09 per GB"),
          t("250 GB included", "then $0.09 per GB"),
          t("Custom"),
        ],
      },
    ],
  },
  {
    category: "Auth",
    rows: [
      { feature: "Total Users", cells: [t("Unlimited"), t("Unlimited"), t("Unlimited"), t("Unlimited")] },
      {
        feature: "MAUs",
        cells: [
          t("50,000 included"),
          t("100,000 included", "then $0.00325 per MAU"),
          t("100,000 included", "then $0.00325 per MAU"),
          t("Custom"),
        ],
      },
      { feature: "User data ownership", cells: [yes, yes, yes, yes] },
      { feature: "Anonymous Sign-ins", cells: [yes, yes, yes, yes] },
      { feature: "Social OAuth providers", cells: [yes, yes, yes, yes] },
      { feature: "Custom SMTP server", cells: [yes, yes, yes, yes] },
      { feature: "Remove Supabase branding from emails", cells: [no, yes, yes, yes] },
      { feature: "Auth Audit Logs", cells: [t("1 hour"), t("7 days"), t("28 days"), yes] },
      { feature: "Basic Multi-Factor Auth", cells: [yes, yes, yes, yes] },
      {
        feature: "Advanced Multi-Factor Auth - Phone",
        cells: [
          no,
          t("$75 per month for first project", "then $10 per month per additional project"),
          t("$75 per month for first project", "then $10 per month per additional project"),
          t("Custom"),
        ],
      },
      {
        feature: "Third-Party MAUs",
        cells: [
          t("50,000 included"),
          t("100,000 included", "then $0.00325 per MAU"),
          t("100,000 included", "then $0.00325 per MAU"),
          t("Custom"),
        ],
      },
      {
        feature: "Single Sign-On (SAML 2.0)",
        cells: [
          no,
          t("50 included", "then $0.015 per MAU"),
          t("50 included", "then $0.015 per MAU"),
          t("Contact Us"),
        ],
      },
      { feature: "Leaked password protection", cells: [no, yes, yes, yes] },
      { feature: "Single session per user", cells: [no, yes, yes, yes] },
      { feature: "Session timeouts", cells: [no, yes, yes, yes] },
      {
        feature: "Auth Hooks",
        cells: [
          t("Custom Access Token (JWT)", "Send custom email/SMS"),
          t("Custom Access Token (JWT)", "Send custom email/SMS"),
          t("All"),
          t("All"),
        ],
      },
      { feature: "Advanced security features", cells: [no, no, no, t("Contact Us")] },
    ],
  },
  {
    category: "Storage",
    rows: [
      {
        feature: "Storage",
        cells: [
          t("1 GB included"),
          t("100 GB included", "then $0.0213 per GB"),
          t("100 GB included", "then $0.0213 per GB"),
          t("Custom"),
        ],
      },
      {
        feature: "Cached Egress",
        cells: [
          t("5 GB included"),
          t("250 GB included", "then $0.03 per GB"),
          t("250 GB included", "then $0.03 per GB"),
          t("Custom"),
        ],
      },
      { feature: "Custom access controls", cells: [yes, yes, yes, yes] },
      { feature: "Max file upload size", cells: [t("50 MB"), t("500 GB"), t("500 GB"), t("Custom")] },
      {
        feature: "Content Delivery Network",
        cells: [t("Basic CDN"), t("Smart CDN"), t("Smart CDN"), t("Smart CDN")],
      },
      {
        feature: "Image Transformations",
        cells: [
          no,
          t("100 origin images included", "then $5 per 1000 origin images"),
          t("100 origin images included", "then $5 per 1000 origin images"),
          t("Custom"),
        ],
      },
    ],
  },
  {
    category: "Edge Functions",
    rows: [
      {
        feature: "Invocations",
        cells: [
          t("500,000 included"),
          t("2 Million included", "then $2 per 1 Million"),
          t("2 Million included", "then $2 per 1 Million"),
          t("Custom"),
        ],
      },
    ],
  },
  {
    category: "Realtime",
    rows: [
      { feature: "Postgres Changes", cells: [yes, yes, yes, yes] },
      {
        feature: "Concurrent Peak Connections",
        cells: [
          t("200 included"),
          t("500 included", "then $10 per 1000"),
          t("500 included", "then $10 per 1000"),
          t("Custom concurrent connections", "and volume discount"),
        ],
      },
      {
        feature: "Messages Per Month",
        cells: [
          t("2 Million included"),
          t("5 Million included", "then $2.50 per Million"),
          t("5 Million included", "then $2.50 per Million"),
          t("Volume discounts on messages"),
        ],
      },
      { feature: "Max Message Size", cells: [t("256 KB"), t("3 MB"), t("3 MB"), t("Custom")] },
    ],
  },
  {
    category: "Dashboard",
    rows: [
      { feature: "Team members", cells: [t("Unlimited"), t("Unlimited"), t("Unlimited"), t("Unlimited")] },
    ],
  },
  {
    category: "Security and Compliance",
    rows: [
      { feature: "BYO cloud", cells: [no, no, no, yes] },
      {
        feature: "Log retention (API & Database)",
        cells: [t("1 day"), t("7 days"), t("28 days"), t("90 days")],
      },
      {
        feature: "Log Drain",
        cells: [
          no,
          t("$60 per drain per month", "+ $0.20 per million events + $0.09 per GB egress"),
          t("$60 per drain per month", "+ $0.20 per million events + $0.09 per GB egress"),
          t("Custom"),
        ],
      },
      { feature: "Platform Audit Logs", cells: [no, no, yes, yes] },
      { feature: "Metrics endpoint", cells: [no, yes, yes, yes] },
      { feature: "SOC2", cells: [no, no, yes, yes] },
      { feature: "ISO 27001", cells: [no, no, yes, yes] },
      { feature: "HIPAA", cells: [no, no, t("Available as paid add-on"), t("Available as paid add-on")] },
      { feature: "AWS PrivateLink", cells: [no, no, yes, yes] },
      { feature: "SSO", cells: [no, no, t("Contact Us"), t("Contact Us")] },
      { feature: "Uptime SLAs", cells: [no, no, no, yes] },
      {
        feature: "Access Roles",
        cells: [
          t("Owner, Admin, Developer"),
          t("Owner, Admin, Developer"),
          t("Owner, Admin, Developer, Read-only", "Predefined project scoped roles"),
          t("Custom project scoped roles"),
        ],
      },
      { feature: "Vanity URLs", cells: [no, yes, yes, yes] },
      {
        feature: "Custom Domains",
        cells: [
          no,
          t("$10 per domain per month", "per project add on"),
          t("$10 per domain per month", "per project add on"),
          t("1 included", "additional $10/domain/month"),
        ],
      },
    ],
  },
  {
    category: "Support",
    rows: [
      { feature: "Community Support", cells: [yes, yes, yes, yes] },
      { feature: "Email Support", cells: [no, yes, yes, yes] },
      { feature: "Email Support SLA", cells: [no, no, yes, yes] },
      { feature: "Designated support", cells: [no, no, no, yes] },
      { feature: "On Boarding Support", cells: [no, no, no, yes] },
      { feature: "Designated Customer Success Team", cells: [no, no, no, yes] },
      { feature: "Security Questionnaire Help", cells: [no, no, yes, yes] },
    ],
  },
];

export const faqs = [
  {
    q: "Can I cap my usage so my bill doesn't run over?",
    a: "Yes. Spend caps are enabled by default on the Pro Plan. If you want pay-as-you-grow usage beyond plan limits, you can switch the cap off from your dashboard.",
  },
  {
    q: "I'm worried I could end up with a huge bill at the end of the month.",
    a: "Spend caps are on by default, so you won't be charged for usage beyond plan limits unless you explicitly toggle the cap off in your dashboard.",
  },
  {
    q: "When will I be billed?",
    a: "The Pro Plan is charged up front on a monthly cycle. Any additional usage charges are billed at the end of each month.",
  },
  {
    q: "Does Supabase charge sales tax, VAT or GST?",
    a: "Sales tax, VAT, GST, and other indirect taxes are applied where required by law, based on the billing address of your organization.",
  },
  {
    q: "Are you going to change your pricing in the future?",
    a: "Pricing is currently in Beta and may evolve, but the team is committed to keeping it as developer-friendly as possible.",
  },
  {
    q: "What happens if I cancel my subscription?",
    a: "Your organization receives credits for the unused portion of the billing month, which can be applied to other projects.",
  },
  {
    q: "Do I get a notification if I am approaching my usage limits?",
    a: "Yes — you'll receive an email once you're within 20% of your plan limits.",
  },
  {
    q: "What if I need one project for development and one for production?",
    a: "The Free Plan includes 2 active projects, so you can run a development backend and a production backend side by side. Multi-environment projects are in the works.",
  },
  {
    q: "Can I self-host Supabase for free?",
    a: "Yes. You can self-host using the Docker setup or the Supabase CLI, and Supabase Studio is included in the Docker setup.",
  },
  {
    q: "Can I pause a free project?",
    a: "Yes, projects can be paused at any time. The Free Plan allows 2 active projects, but you can keep as many paused projects as you like.",
  },
];
