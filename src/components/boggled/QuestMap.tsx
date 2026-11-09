"use client";

import { useEffect, useState } from "react";
import { click, track } from "@/lib/boggled/analytics";
import {
  adsLeft,
  BLAST_WORD_LENGTH,
  formatCountdown,
  LEVELS,
  livesLeft,
  loadQuest,
  markTip,
  MAX_LEVEL,
  nextLifeAt,
  QUEST_STORY,
  questLevel,
  REGIONS,
  ruleChips,
  totalStars,
  weaponUnlocked,
  WEAPON_LEVEL,
} from "@/lib/boggled/quest";
import type { RoomController, RoomState } from "@/lib/boggled/room";
import { sound } from "@/lib/boggled/sound";
import { Lives, regionStyle, Stars, useNow } from "./QuestUI";
import { AdModal, ItemChips, ShopModal } from "./Shop";

// Node positions on the tilted plane (percent), bottom to top. The 5th is the boss.
const NODES = [
  { x: 50, y: 88 },
  { x: 22, y: 69 },
  { x: 71, y: 52 },
  { x: 29, y: 33 },
  { x: 57, y: 12 },
];
const ENTRY = { x: 46, y: 108 };
const EXIT = { x: 70, y: -8 };
const DECOR = [
  { x: 10, y: 86, s: 1.7 },
  { x: 88, y: 77, s: 1.9 },
  { x: 87, y: 38, s: 1.6 },
  { x: 8, y: 50, s: 1.5 },
  { x: 90, y: 8, s: 1.4 },
  { x: 12, y: 15, s: 1.6 },
  { x: 47, y: 62, s: 1.0 },
  { x: 76, y: 95, s: 1.2 },
  { x: 36, y: 4, s: 1.1 },
];

type P = { x: number; y: number };

// Catmull-Rom through the points, as one cubic Bézier per segment.
function segments(pts: P[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    out.push(`M${p1.x} ${p1.y} C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`);
  }
  return out;
}
const SEGMENTS = segments([ENTRY, ...NODES, EXIT]);

type Anim = { from: number; to: number; stage: "walk" | "badge" | "region" | "complete" } | null;

// Round ids whose map animation already played (survives remounts, not reloads).
const played = new Set<string>();

export default function QuestMap({
  state,
  controller,
  dictReady,
  onLeave,
}: {
  state: RoomState;
  controller: RoomController;
  dictReady: boolean;
  onLeave: () => void;
}) {
  const now = useNow();
  const [save, setSave] = useState(loadQuest);
  const [modal, setModal] = useState<"shop" | "ad" | null>(null);
  const outcome = state.outcome?.quest;
  const outcomeId = state.outcome?.roundId ?? "";
  const fresh = !!outcome && !played.has(outcomeId);
  const [anim, setAnim] = useState<Anim>(() => {
    if (!fresh || !outcome.advanced) return null;
    const to = Math.min(MAX_LEVEL, outcome.level + 1);
    if (outcome.questComplete) return { from: outcome.level, to: outcome.level, stage: "complete" };
    return { from: outcome.level, to, stage: outcome.bossBeaten ? "badge" : "walk" };
  });
  const [broke] = useState(() => fresh && !outcome.won && !outcome.tie);
  // Before the walk finishes, the map shows the old position.
  const [avatar, setAvatar] = useState(() => (anim ? anim.from : Math.min(save.unlocked, MAX_LEVEL)));
  const reached = anim && (anim.stage === "walk" || anim.stage === "badge") && avatar === anim.from ? anim.from : save.unlocked;
  const selected = questLevel(state.questLevel);
  const [viewRegion, setViewRegion] = useState(() => questLevel(avatar).region);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!fresh) return;
    played.add(outcomeId);
    if (broke) sound.heartBreak();
  }, [fresh, outcomeId, broke]);

  useEffect(() => {
    if (!anim) return;
    if (anim.stage === "walk") {
      const t1 = setTimeout(() => {
        setAvatar(anim.to);
        sound.hop();
        controller.selectLevel(anim.to, false);
      }, 700);
      const t2 = setTimeout(() => setAnim(null), 1900);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
    if (anim.stage === "badge" || anim.stage === "complete") sound.champion();
    if (anim.stage === "region") {
      const t = setTimeout(() => setAnim(null), 2600);
      return () => clearTimeout(t);
    }
  }, [anim, controller]);

  const onward = () => {
    if (!anim) return;
    click("quest_onward");
    setAvatar(anim.to);
    setViewRegion(questLevel(anim.to).region);
    controller.selectLevel(anim.to, false);
    setAnim({ ...anim, stage: "region" });
    sound.hop();
  };

  const lives = livesLeft(save, now);
  const next = nextLifeAt(save, now);
  const region = REGIONS[viewRegion];
  const first = viewRegion * 5 + 1;
  const regionOpen = (r: number) => r * 5 + 1 <= save.unlocked;
  const selectedStars = save.stars[selected.level] ?? 0;
  const best = save.best[selected.level];
  const play = () => {
    click("quest_play");
    sound.unlock();
    controller.selectLevel(selected.level, false);
    controller.startRound();
  };
  const practice = () => {
    click("quest_practice");
    controller.selectLevel(selected.level, true);
  };

  return (
    <div className="bg-screen bg-quest gap-3" style={regionStyle(viewRegion)} data-testid="quest-map">
      <div className="flex items-center justify-between gap-2">
        <button className="bg-btn bg-btn-ghost px-3 py-2 text-base" onClick={() => { click("home"); onLeave(); }} data-testid="leave">
          ←
        </button>
        <Lives save={save} now={now} broke={broke} />
        <span className="bg-chip flex flex-col items-end whitespace-nowrap px-2.5 py-1 text-xs leading-tight">
          <span className="bg-coins" data-testid="coins">🪙 {save.coins}</span>
          <span data-testid="total-stars">⭐ {totalStars(save)}</span>
        </span>
      </div>

      <div className="bg-quest-track" data-testid="region-track">
        {REGIONS.map((r, i) => {
          const open = regionOpen(i);
          const beaten = save.unlocked > (i + 1) * 5;
          return (
            <button
              key={r.id}
              className={`bg-quest-region ${i === viewRegion ? "on" : ""} ${open ? "" : "locked"}`}
              disabled={!open}
              onClick={() => setViewRegion(i)}
              aria-label={r.name}
              data-testid={`region-${i}`}
            >
              <span>{open ? r.emoji : "🔒"}</span>
              {beaten && <span className="bg-quest-badge">{r.badge.emoji}</span>}
            </button>
          );
        })}
      </div>

      <div className="text-center">
        <div className="bg-title text-2xl leading-tight" data-testid="region-name">
          {region.emoji} {region.name}
        </div>
        {save.unlocked === 1 ? <div className="text-xs opacity-80">{QUEST_STORY}</div> : <div className="truncate text-xs opacity-80">{region.blurb}</div>}
      </div>

      <div className="bg-map" key={viewRegion}>
        <div className="bg-map-plane">
          <svg className="bg-map-path" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {SEGMENTS.map((d, i) => (
              <path key={`b${i}`} d={d} className="base" vectorEffect="non-scaling-stroke" />
            ))}
            {SEGMENTS.map((d, i) => {
              const level = first + i;
              const done = level <= reached;
              const drawing = anim?.stage === "walk" && level === anim.to && avatar === anim.to;
              return (done || drawing) && <path key={`d${i}`} d={d} pathLength={1} className={`done ${drawing ? "draw" : ""}`} vectorEffect="non-scaling-stroke" />;
            })}
          </svg>
          {DECOR.map((d, i) => (
            <span key={i} className="bg-map-decor" style={{ left: `${d.x}%`, top: `${d.y}%`, fontSize: `${d.s * 1.6}rem` }}>
              {region.decor[i % region.decor.length]}
            </span>
          ))}
          {NODES.map((p, i) => {
            const l = LEVELS[first - 1 + i];
            const open = l.level <= reached;
            const beaten = l.level < reached || (save.stars[l.level] ?? 0) > 0;
            return (
              <button
                key={l.level}
                className={`bg-node ${l.boss ? "boss" : ""} ${l.final ? "final" : ""} ${open ? "open" : "locked"} ${beaten ? "beaten" : ""} ${l.level === selected.level ? "selected" : ""}`}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                disabled={!open}
                onClick={() => {
                  sound.pop();
                  controller.selectLevel(l.level, false);
                }}
                aria-label={`Level ${l.level}${l.boss ? " boss" : ""}`}
                data-testid={`node-${l.level}`}
              >
                <span className="bg-node-disc">{open ? l.level : "🔒"}</span>
                {l.boss && <span className="bg-node-boss">{l.emoji}</span>}
                {l.boss && !beaten && <span className="bg-node-label">{l.final ? "FINAL" : "BOSS"} · Lv {l.level}</span>}
                {beaten && (
                  <span className="bg-node-stars">
                    <Stars n={save.stars[l.level] ?? 0} />
                  </span>
                )}
              </button>
            );
          })}
          {questLevel(avatar).region === viewRegion && (
            <span
              className={`bg-map-avatar ${anim?.stage === "region" ? "drop" : ""}`}
              style={{ left: `${NODES[(avatar - 1) % 5].x}%`, top: `${NODES[(avatar - 1) % 5].y}%` }}
              data-testid="map-avatar"
            >
              <span className="bg-map-avatar-inner">{state.me.emoji}</span>
            </span>
          )}
        </div>
      </div>

      <div className={`bg-panel bg-quest-card ${selected.boss ? "boss" : ""}`} data-testid="level-card">
        <div className="flex items-center gap-3">
          <span className="bg-quest-opp">{selected.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="bg-title truncate text-xl" data-testid="level-title">
                Lv {selected.level} · {selected.name}
              </span>
              {selected.boss && <span className="bg-title-badge">{selected.final ? "FINAL BOSS" : "BOSS"}</span>}
            </div>
            <div className="truncate text-sm opacity-85">“{selected.taunt}”</div>
          </div>
          {selectedStars > 0 && <Stars n={selectedStars} />}
        </div>
        <div className="mt-2 flex gap-1.5 overflow-x-auto whitespace-nowrap">
          {ruleChips(selected).map((c) => (
            <span key={c} className="bg-chip px-2 py-0.5 text-xs">
              {c}
            </span>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-sm">
          <span className="font-semibold" data-testid="best">
            {best ? `🏆 Best ${best.me} – ${best.them}` : "⚔️ First fight"}
          </span>
          <ItemChips save={save} />
        </div>
        <div className="mt-3 flex gap-2">
          <button className="bg-btn bg-btn-ghost px-3 text-base" onClick={() => { click("shop"); setModal("shop"); }} data-testid="shop-button">
            🛒 Shop
          </button>
          {lives > 0 ? (
            <button className="bg-btn bg-btn-primary flex-1 text-xl" disabled={!dictReady} onClick={play} data-testid="start">
              {dictReady ? `⚔️ Play Level ${selected.level}` : "Loading words…"}
            </button>
          ) : adsLeft(save, now) > 0 ? (
            <button className="bg-btn bg-btn-primary flex-1 px-2 text-base" onClick={() => { click("ad"); setModal("ad"); }} data-testid="watch-ad">
              📺 Watch ad · +1 ❤️
            </button>
          ) : (
            <button className="bg-btn bg-btn-primary flex-1 px-2 text-sm" disabled data-testid="out-of-lives">
              💔 Next life {next ? formatCountdown(next - now) : "…"}
            </button>
          )}
        </div>
        <div className="mt-2 flex justify-center gap-3 text-xs opacity-85">
          {lives === 0 && next && <span data-testid="out-of-lives-timer">💔 next free life in {formatCountdown(next - now)}</span>}
          <button className="font-semibold underline" onClick={practice} data-testid="practice">
            🎯 Practice (free)
          </button>
        </div>
      </div>

      {modal === "shop" && <ShopModal save={save} onChange={setSave} onClose={() => setModal(null)} />}
      {modal === "ad" && <AdModal onReward={setSave} onClose={() => setModal(null)} />}

      {anim?.stage === "badge" && (
        <div className="bg-modal" role="dialog" aria-modal aria-label="Badge earned" data-testid="badge-earned">
          <div className="bg-modal-card bg-quest-reward text-center">
            <div className="bg-quest-reward-icon">{REGIONS[questLevel(anim.from).region].badge.emoji}</div>
            <div className="bg-title text-sm tracking-widest opacity-85">BOSS DEFEATED</div>
            <div className="bg-title text-3xl text-[var(--gold)]">{REGIONS[questLevel(anim.from).region].badge.name}</div>
            <p className="text-sm opacity-85">
              {questLevel(anim.from).emoji} {questLevel(anim.from).name} bows out. The road continues.
            </p>
            <button className="bg-btn bg-btn-primary" onClick={onward} data-testid="onward">
              Onward to {REGIONS[questLevel(anim.to).region].emoji} {REGIONS[questLevel(anim.to).region].name} →
            </button>
          </div>
        </div>
      )}

      {anim?.stage === "region" && (
        <div className="bg-region-intro" data-testid="region-intro" onClick={() => setAnim(null)}>
          <div className="bg-region-intro-emoji">{region.emoji}</div>
          <div className="bg-title text-4xl">{region.name.toUpperCase()}</div>
          <div className="text-sm opacity-90">{region.blurb}</div>
        </div>
      )}

      {anim?.stage === "complete" && (
        <div className="bg-modal" role="dialog" aria-modal aria-label="Quest complete" data-testid="quest-complete">
          <div className="bg-modal-card bg-quest-reward text-center">
            <div className="bg-quest-reward-icon">👑</div>
            <div className="bg-title text-sm tracking-widest opacity-85">QUEST COMPLETE</div>
            <div className="bg-title text-3xl text-[var(--gold)]">The alphabet is free!</div>
            <p className="text-sm opacity-85">You beat Lexidrake 🐉. Go back for ⭐⭐⭐ on every level.</p>
            <button
              className="bg-btn bg-btn-primary"
              onClick={() => {
                track("quest_complete", { stars: totalStars(save) });
                setAnim(null);
              }}
              data-testid="celebrate"
            >
              🎉 Legendary
            </button>
          </div>
        </div>
      )}

      {!anim && weaponUnlocked(save) && !save.tips.includes("blast") && (
        <div className="bg-modal" role="dialog" aria-modal aria-label="New weapon" data-testid="weapon-unlock">
          <div className="bg-modal-card bg-quest-reward text-center">
            <div className="bg-quest-reward-icon">💥</div>
            <div className="bg-title text-sm tracking-widest opacity-85">NEW WEAPON UNLOCKED</div>
            <div className="bg-title text-3xl text-[var(--gold)]">Word Blast</div>
            <ol className="bg-weapon-steps">
              <li>
                <span className="bg-weapon-demo">
                  {"STONE".split("").map((l, i) => (
                    <span key={i} className="bg-weapon-tile" style={{ animationDelay: `${0.3 + i * 0.15}s` }}>
                      {l}
                    </span>
                  ))}
                </span>
                Find a {BLAST_WORD_LENGTH}+ letter word to earn a blast
              </li>
              <li>
                <span className="bg-weapon-btn">💥 Blast</span>
                Tap it during the fight
              </li>
              <li>
                <span className="bg-weapon-boom">
                  <s>TREE</s> 💥
                </span>
                Your opponent&apos;s last word goes up in smoke
              </li>
            </ol>
            <p className="text-xs opacity-75">Hold up to 3 per round. Works in every fight from level {WEAPON_LEVEL} on.</p>
            <button
              className="bg-btn bg-btn-primary"
              onClick={() => {
                track("tip", { tip: "blast" });
                setSave(markTip("blast"));
              }}
              data-testid="weapon-ok"
            >
              Got it 💥
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
