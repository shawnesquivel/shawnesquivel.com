import { guideBySlug } from "@/lib/boggled/guides";
import type { Gsc } from "@/lib/boggled/gsc";
import { Bars, Card, Chapter, Columns, Empty, Hero, pct } from "./charts";

export type Acquisition = {
  sessions: number;
  channels: { channel: string; sessions: number; players: number; played: number }[];
  sources: { source: string; sessions: number; played: number }[];
  campaigns: { source: string; medium: string | null; campaign: string | null; sessions: number; played: number }[];
  landings: { landing: string; sessions: number; played: number }[];
  articles: { slug: string; views: number; readers: number; clicked: number; played: number }[];
};

const CHANNELS: Record<string, { label: string; color: string }> = {
  search: { label: "🔎 Search", color: "#3ddc84" },
  invite: { label: "📣 Invite links", color: "#ffd23f" },
  social: { label: "💬 Social", color: "#ff7ac6" },
  ai: { label: "🤖 AI assistants", color: "#b48cff" },
  campaign: { label: "🏷️ UTM campaigns", color: "#ffa62b" },
  referral: { label: "🔗 Other sites", color: "#5fb8ff" },
  direct: { label: "⌨️ Direct / app", color: "#9aa4c7" },
};

const playedNote = (played: number, n: number) => `${pct(played, n)} played`;

export function AcquisitionChapter({ a }: { a: Acquisition | null }) {
  return (
    <>
      <Chapter
        icon="🧭"
        title="Where visits come from"
        sub="First page of each visit, by channel. “Played” = that visit went on to start a round. Tag links with ?utm_source=…&utm_campaign=…"
      />
      {!a ? (
        <Empty>Waiting on a database migration. Production deploys apply it automatically once SUPABASE_DB_URL is set on Vercel.</Empty>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Channels" accent="#3ddc84">
            <Bars
              rows={a.channels.map((c) => ({
                key: c.channel,
                label: CHANNELS[c.channel]?.label ?? c.channel,
                value: c.sessions,
                color: CHANNELS[c.channel]?.color,
                note: playedNote(c.played, c.sessions),
              }))}
            />
          </Card>
          <Card title="Top sources" why="utm_source, else the referring site.">
            <Bars rows={a.sources.map((s) => ({ key: s.source, label: s.source, value: s.sessions, note: playedNote(s.played, s.sessions) }))} color="#5fb8ff" />
          </Card>
          <Card title="Guides" why="Views, read 75%+, clicked through, and visits that went on to play." accent="#ffd23f">
            {a.articles.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs opacity-70">
                    <tr>
                      <th className="py-1 text-left">Guide</th>
                      <th>Views</th>
                      <th>Read</th>
                      <th>Clicked</th>
                      <th>Played</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.articles.map((r) => {
                      const g = guideBySlug(r.slug);
                      return (
                        <tr key={r.slug} className="border-t border-white/10 text-center tabular-nums">
                          <td className="py-1.5 text-left">{g ? `${g.emoji} ${g.title}` : r.slug}</td>
                          <td>{r.views}</td>
                          <td>{pct(r.readers, r.views)}</td>
                          <td>{pct(r.clicked, r.views)}</td>
                          <td>{r.played}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty>No guide views yet.</Empty>
            )}
          </Card>
          <Card title="Landing pages">
            <Bars rows={a.landings.map((l) => ({ key: l.landing, label: l.landing, value: l.sessions, note: playedNote(l.played, l.sessions) }))} color="#ffa62b" />
          </Card>
          <Card title="UTM campaigns" why="Invite links are tagged automatically (utm_source=invite, medium share or qr)." className="lg:col-span-2">
            <Bars
              empty="No tagged links yet"
              rows={a.campaigns.map((c, i) => ({
                key: String(i),
                label: [c.source, c.medium, c.campaign].filter(Boolean).join(" / "),
                value: c.sessions,
                note: playedNote(c.played, c.sessions),
              }))}
              color="#ff7ac6"
            />
          </Card>
        </div>
      )}
    </>
  );
}

const pathOf = (url: string) => {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

export function SearchChapter({ g, error }: { g: Gsc | null; error?: string }) {
  return (
    <>
      <Chapter icon="🔎" title="Google Search" sub="From Google Search Console: what people searched, and which pages showed up. Data lags ~2 days." />
      {g ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Hero label="Clicks" value={g.totals.clicks} spark={g.daily.map((d) => d.clicks)} color="#3ddc84" />
            <Hero label="Impressions" value={g.totals.impressions} spark={g.daily.map((d) => d.impressions)} color="#5fb8ff" />
            <Hero label="CTR" value={`${(g.totals.ctr * 100).toFixed(1)}%`} color="#ffd23f" />
            <Hero label="Avg position" value={g.totals.position ? g.totals.position.toFixed(1) : "—"} hint={`${g.from} → ${g.to}`} color="#ff7ac6" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Top searches" why="Clicks, with impressions and average position.">
              <Bars
                empty="No searches yet"
                rows={g.queries.map((q) => ({ key: q.key, label: q.key, value: q.impressions, display: `${q.clicks} / ${q.impressions}`, note: `#${q.position.toFixed(0)}` }))}
                color="#3ddc84"
              />
            </Card>
            <Card title="Top pages in search">
              <Bars
                empty="No pages yet"
                rows={g.pages.map((p) => ({ key: p.key, label: pathOf(p.key), value: p.impressions, display: `${p.clicks} / ${p.impressions}`, note: `#${p.position.toFixed(0)}` }))}
                color="#5fb8ff"
              />
            </Card>
            <Card title="Clicks per day" className="lg:col-span-2">
              <Columns rows={g.daily.map((d) => ({ label: d.key.slice(5), value: d.clicks, title: `${d.key}: ${d.clicks} clicks, ${d.impressions} impressions` }))} color="#3ddc84" />
            </Card>
          </div>
        </>
      ) : error && error !== "setup" ? (
        <Empty>Search Console error: {error}</Empty>
      ) : (
        <div className="bg-panel flex flex-col gap-2 p-4 text-sm">
          <b>Connect Google Search Console (one-time)</b>
          <p>
            Add a Google Cloud service account key as <code>GSC_SERVICE_ACCOUNT_JSON</code> on Vercel (with the Search Console and Site Verification APIs
            enabled). This page then verifies wordbrawl.app, adds it to Search Console and submits the sitemap by itself.
          </p>
        </div>
      )}
    </>
  );
}
