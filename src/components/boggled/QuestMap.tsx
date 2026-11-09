"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  MAX_LIVES,
  nextLifeAt,
  QUEST_STORY,
  questLevel,
  REGIONS,
  ruleChips,
  totalStars,
  weaponUnlocked,
  WEAPON_LEVEL,
  type QuestSave,
} from "@/lib/boggled/quest";
import type { RoomController, RoomState } from "@/lib/boggled/room";
import { sound } from "@/lib/boggled/sound";
import { Stars, useNow } from "./QuestUI";
import { BOUNDARIES, CASTLE, H, NODE_POS, SEGMENTS, W, WorldTerrain } from "./QuestWorld";
import { AdModal, ItemChips, ShopModal } from "./Shop";

type Anim = { from: number; to: number; stage: "walk" | "badge" | "region" | "complete" } | null;

// Round ids whose map animation already played (survives remounts, not reloads).
const played = new Set<string>();

const pctX = (x: number) => `${(x / W) * 100}%`;
const pctY = (y: number) => `${(y / H) * 100}%`;

// Region name banners: the start of each region, just above its border with the previous one.
const BANNERS = REGIONS.map((r, i) => ({ region: i, y: i === 0 ? H - 70 : BOUNDARIES[i - 1] - 24 }));

// Short enough for the HUD pill: "23h 59m", "4:05".
function shortCountdown(ms: number) {
  const m = Math.ceil(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : formatCountdown(ms);
}

function HudLives({ save, now, broke }: { save: QuestSave; now: number; broke: boolean }) {
  const lives = livesLeft(save, now);
  const next = nextLifeAt(save, now);
  return (
    <div className="bg-hud-pill" data-testid="lives" aria-label={`${lives} of ${MAX_LIVES} lives`}>
      <span className={`bg-hud-heart ${broke ? "broke" : ""} ${lives ? "" : "empty"}`}>
        <span>{lives}</span>
      </span>
      <span className="bg-hud-pill-text" data-testid={lives < MAX_LIVES ? "lives-timer" : undefined}>
        {lives >= MAX_LIVES ? "Full" : next ? shortCountdown(next - now) : ""}
      </span>
    </div>
  );
}

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
  const [sheet, setSheet] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
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

  const scrollTo = (level: number, smooth: boolean) => {
    const el = scroller.current;
    if (!el) return;
    const y = (NODE_POS[level - 1].y / H) * el.scrollHeight;
    el.scrollTo({ top: Math.max(0, y - el.clientHeight * 0.58), behavior: smooth ? "smooth" : "instant" });
  };

  useLayoutEffect(() => {
    scrollTo(avatar, false);
    // Only on arrival; later moves scroll smoothly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        scrollTo(anim.to, true);
      }, 700);
      const t2 = setTimeout(() => {
        setAnim(null);
        setSheet(true);
      }, 1900);
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
    controller.selectLevel(anim.to, false);
    scrollTo(anim.to, true);
    setAnim({ ...anim, stage: "region" });
    sound.hop();
  };

  const lives = livesLeft(save, now);
  const next = nextLifeAt(save, now);
  const selectedStars = save.stars[selected.level] ?? 0;
  const best = save.best[selected.level];
  const current = Math.min(save.unlocked, MAX_LEVEL);
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
  const open = (level: number) => {
    sound.pop();
    controller.selectLevel(level, false);
    setSheet(true);
  };
  const avatarPos = NODE_POS[avatar - 1];
  const introRegion = REGIONS[questLevel(avatar).region];

  return (
    <div className="bg-world" data-testid="quest-map">
      <div className="bg-world-scroll" ref={scroller}>
        <div className="bg-world-canvas" style={{ aspectRatio: `${W} / ${H}` }}>
          <WorldTerrain />
          <svg className="bg-world-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
            {SEGMENTS.map((s, i) => {
              const level = i + 1;
              const done = level <= reached || (i === 0 && reached >= 1);
              const drawing = anim?.stage === "walk" && level === anim.to && avatar === anim.to;
              return (done || drawing) && <path key={i} d={s.d} pathLength={1} className={`bg-world-done ${drawing ? "draw" : ""}`} />;
            })}
          </svg>

          {BANNERS.map((b) => {
            const r = REGIONS[b.region];
            const unlocked = b.region * 5 + 1 <= save.unlocked;
            return (
              <div key={r.id} className={`bg-world-banner ${unlocked ? "" : "locked"}`} style={{ top: pctY(b.y) }} data-testid={`region-${b.region}`}>
                {unlocked ? r.emoji : "🔒"} {r.name}
              </div>
            );
          })}

          <div className="bg-world-lair" style={{ left: pctX(CASTLE.x + 118), top: pctY(CASTLE.y - 70) }}>
            🐉
          </div>

          {LEVELS.map((l) => {
            const p = NODE_POS[l.level - 1];
            const isOpen = l.level <= reached;
            const beaten = l.level < reached || (save.stars[l.level] ?? 0) > 0;
            return (
              <button
                key={l.level}
                className={`bg-wnode ${l.boss ? "boss" : ""} ${l.final ? "final" : ""} ${isOpen ? "open" : "locked"} ${beaten ? "beaten" : ""} ${l.level === current ? "current" : ""}`}
                style={{ left: pctX(p.x), top: pctY(p.y) }}
                disabled={!isOpen}
                onClick={() => open(l.level)}
                aria-label={`Level ${l.level}${l.boss ? " boss" : ""}`}
                data-testid={`node-${l.level}`}
              >
                {l.boss && <span className="bg-wnode-boss">{l.emoji}</span>}
                <span className="bg-wnode-disc">{l.level}</span>
                {beaten && (
                  <span className="bg-wnode-stars">
                    <Stars n={save.stars[l.level] ?? 0} />
                  </span>
                )}
              </button>
            );
          })}

          <span
            className={`bg-world-avatar ${anim?.stage === "region" ? "drop" : ""}`}
            style={{ left: pctX(avatarPos.x), top: pctY(avatarPos.y) }}
            data-testid="map-avatar"
          >
            <span className="bg-world-avatar-inner">{state.me.emoji}</span>
          </span>
        </div>
      </div>

      <div className="bg-hud">
        <button className="bg-hud-back" onClick={() => { click("home"); onLeave(); }} aria-label="Home" data-testid="leave">
          ‹
        </button>
        <HudLives save={save} now={now} broke={broke} />
        <button className="bg-hud-pill" onClick={() => { click("shop"); setModal("shop"); }} aria-label="Coins and shop" data-testid="shop-button">
          <span className="bg-hud-icon">🪙</span>
          <span className="bg-hud-pill-text" data-testid="coins">
            {save.coins}
          </span>
          <span className="bg-hud-plus">+</span>
        </button>
        <div className="bg-hud-pill" aria-label={`Level ${current}, ${totalStars(save)} stars`}>
          <span className="bg-hud-level">{current}</span>
          <span className="bg-hud-pill-text" data-testid="total-stars">
            ★ {totalStars(save)}
          </span>
        </div>
      </div>

      <div className="bg-world-foot">
        <button className="bg-btn bg-btn-primary bg-world-play" onClick={() => open(current)} data-testid="map-play">
          ⚔️ Level {current}
        </button>
      </div>

      {sheet && (
        <div className="bg-sheet-backdrop" onClick={() => setSheet(false)}>
          <div className={`bg-sheet ${selected.boss ? "boss" : ""}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal aria-label={`Level ${selected.level}`} data-testid="level-card">
            <button className="bg-sheet-close" onClick={() => setSheet(false)} aria-label="Close" data-testid="sheet-close">
              ✕
            </button>
            <div className="bg-sheet-kicker">
              Level {selected.level} · {REGIONS[selected.region].name}
              {selected.boss && <span className="bg-title-badge ml-2">{selected.final ? "FINAL BOSS" : "BOSS"}</span>}
            </div>
            <div className="bg-sheet-opp">{selected.emoji}</div>
            <div className="bg-title text-3xl" data-testid="level-title">
              {selected.name}
            </div>
            <div className="bg-sheet-taunt">“{selected.taunt}”</div>
            {save.unlocked === 1 && <p className="text-center text-xs opacity-75">{QUEST_STORY}</p>}

            <div className="bg-sheet-stars">
              <Stars n={selectedStars} size="big" />
            </div>
            <div className="text-center text-sm font-semibold opacity-90" data-testid="best">
              {best ? `🏆 Best ${best.me} – ${best.them}` : "First fight"}
            </div>

            <div className="flex flex-wrap justify-center gap-1.5">
              {ruleChips(selected).map((c) => (
                <span key={c} className="bg-chip px-2.5 py-1 text-xs">
                  {c}
                </span>
              ))}
            </div>
            <div className="flex justify-center">
              <ItemChips save={save} />
            </div>

            {lives > 0 ? (
              <button className="bg-btn bg-btn-primary w-full text-2xl" disabled={!dictReady} onClick={play} data-testid="start">
                {dictReady ? "Play" : "Loading words…"}
              </button>
            ) : adsLeft(save, now) > 0 ? (
              <button className="bg-btn bg-btn-primary w-full text-lg" onClick={() => { click("ad"); setModal("ad"); }} data-testid="watch-ad">
                📺 Watch ad · +1 ❤️
              </button>
            ) : (
              <button className="bg-btn bg-btn-primary w-full text-base" disabled data-testid="out-of-lives">
                💔 Next life {next ? formatCountdown(next - now) : "…"}
              </button>
            )}
            <div className="flex items-center justify-center gap-4 text-sm">
              {lives === 0 && next && <span className="opacity-80" data-testid="out-of-lives-timer">next free life in {formatCountdown(next - now)}</span>}
              <button className="font-semibold underline opacity-85" onClick={practice} data-testid="practice">
                Practice (no lives)
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div
          className="bg-region-intro"
          data-testid="region-intro"
          onClick={() => {
            setAnim(null);
            setSheet(true);
          }}
        >
          <div className="bg-region-intro-emoji">{introRegion.emoji}</div>
          <div className="bg-title text-4xl" data-testid="region-name">
            {introRegion.name.toUpperCase()}
          </div>
          <div className="text-sm opacity-90">{introRegion.blurb}</div>
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
