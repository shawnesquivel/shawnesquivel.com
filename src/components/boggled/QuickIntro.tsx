"use client";

import { click, track } from "@/lib/boggled/analytics";
import { BOT, BOT_TAGLINES, loadBotLevel, MAX_BOT_LEVEL } from "@/lib/boggled/bot";
import { dayKey, formatSecs, loadDaily, loadStreak, loadSurvivalBest, SURVIVAL_START_SECONDS, survivalBonusMs } from "@/lib/boggled/modes";
import type { RoomController, RoomState, Settings } from "@/lib/boggled/room";
import { SettingsFields } from "./Lobby";
import { useState } from "react";

type IntroProps = { state: RoomState; controller: RoomController; dictReady: boolean; onLeave: () => void };

function IntroShell({ chip, controller, dictReady, onLeave, cta, children, testid }: Omit<IntroProps, "state"> & { chip: string; cta: string; children: React.ReactNode; testid: string }) {
  return (
    <div className="bg-screen gap-5" data-testid={testid}>
      <div className="flex items-center justify-between">
        <button className="bg-btn bg-btn-ghost px-3 py-2 text-base" onClick={() => { click("home"); onLeave(); }} data-testid="leave">
          ← Home
        </button>
        <span className="bg-chip text-sm">{chip}</span>
      </div>
      {children}
      <div className="sticky bottom-3 mt-auto">
        <button className="bg-btn bg-btn-primary w-full text-xl" disabled={!dictReady} onClick={() => controller.startRound()} data-testid="start">
          {dictReady ? cta : "Loading words…"}
        </button>
      </div>
    </div>
  );
}

function DailyIntro(props: IntroProps) {
  const [day] = useState(dayKey);
  const [rec] = useState(() => loadDaily(day));
  const [streak] = useState(() => loadStreak(day));
  const date = new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  const played = rec.first !== null;
  return (
    <IntroShell {...props} chip="📅 Daily Puzzle" cta={played ? "Practice again 🔁" : "Play today's board 📅"} testid="daily-intro">
      <div className="mt-2 text-center">
        <div className="bg-title text-4xl leading-tight">Daily Puzzle</div>
        <div className="mt-1 text-sm opacity-80">{date}</div>
      </div>
      <div className="bg-panel flex items-center justify-around px-3 py-5 text-center">
        <div>
          <div className="bg-title text-3xl">{streak > 0 ? `🔥 ${streak}` : "—"}</div>
          <div className="text-xs opacity-75">day streak</div>
        </div>
        <div>
          <div className="bg-title text-3xl" data-testid="daily-today">{played ? rec.first : "?"}</div>
          <div className="text-xs opacity-75">today&apos;s score</div>
        </div>
      </div>
      <ul className="flex flex-col gap-2 text-base">
        <li>🌍 Everyone in the world gets the same board today.</li>
        <li>⏱ 90 seconds. Longer words score more.</li>
        <li>🏅 Your <b>first</b> play counts toward today&apos;s ranking and your streak.</li>
        <li>🔁 Replays are just practice. New board at midnight UTC.</li>
      </ul>
      {played && <div className="bg-bubble text-center text-sm">You already played today. Practice runs won&apos;t change your score of {rec.first}.</div>}
    </IntroShell>
  );
}

function SurvivalIntro(props: IntroProps) {
  const [best] = useState(loadSurvivalBest);
  return (
    <IntroShell {...props} chip="⏳ Survival" cta="Survive ⏳" testid="survival-intro">
      <div className="mt-2 text-center">
        <div className="bg-title text-4xl leading-tight">Survival</div>
        <div className="mt-1 text-sm opacity-80">How long can you keep the clock alive?</div>
      </div>
      <div className="bg-panel flex items-center justify-around px-3 py-5 text-center">
        <div>
          <div className="bg-title text-3xl">0:{String(SURVIVAL_START_SECONDS).padStart(2, "0")}</div>
          <div className="text-xs opacity-75">on the clock</div>
        </div>
        <div>
          <div className="bg-title text-3xl" data-testid="survival-best">{best ? formatSecs(best) : "—"}</div>
          <div className="text-xs opacity-75">your best</div>
        </div>
      </div>
      <ul className="flex flex-col gap-2 text-base">
        <li>⏳ You start with {SURVIVAL_START_SECONDS} seconds.</li>
        <li>➕ Every word adds time. Longer words add more:</li>
      </ul>
      <div className="grid grid-cols-5 gap-1.5 text-center text-sm">
        {["cat", "frog", "tiger", "badger", "giraffe"].map((w) => (
          <div key={w} className="bg-chip flex flex-col px-1 py-1.5">
            <b>{w.length === 7 ? "7+" : w.length}</b>
            <span className="opacity-80">+{survivalBonusMs(w) / 1000}s</span>
          </div>
        ))}
      </div>
      <p className="text-center text-sm opacity-80">Clock hits zero, you&apos;re out. Same word twice doesn&apos;t count.</p>
    </IntroShell>
  );
}

export default function SoloIntro(props: IntroProps) {
  if (props.state.mode === "daily") return <DailyIntro {...props} />;
  if (props.state.mode === "survival") return <SurvivalIntro {...props} />;
  return <QuickIntro {...props} />;
}

function QuickIntro({
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
  const [level] = useState(loadBotLevel);
  const minutes = state.settings.duration / 60;
  const you = state.tally[state.me.id]?.wins ?? 0;
  const hoot = state.tally[BOT.id]?.wins ?? 0;

  return (
    <div className="bg-screen gap-5" data-testid="quick-intro">
      <div className="flex items-center justify-between">
        <button className="bg-btn bg-btn-ghost px-3 py-2 text-base" onClick={() => { click("home"); onLeave(); }} data-testid="leave">
          ← Home
        </button>
        <span className="bg-chip text-sm">⚡ Quick Start</span>
      </div>

      <div className="bg-title mt-2 text-center text-4xl leading-tight">
        You <span className="text-[var(--gold)]">vs.</span> {BOT.name}
      </div>

      <div className="bg-panel bg-vs flex items-center justify-around px-3 py-6">
        <div className="flex w-24 flex-col items-center gap-1">
          <span className="bg-vs-avatar">{state.me.emoji}</span>
          <span className="max-w-full truncate font-semibold">{state.me.name}</span>
        </div>
        <span className="bg-vs-badge bg-title">VS</span>
        <div className="flex w-24 flex-col items-center gap-1">
          <span className="bg-vs-avatar bg-vs-bot">{BOT.emoji}</span>
          <span className="font-semibold">{BOT.name}</span>
          <span className="bg-chip px-2 py-0.5 text-xs" data-testid="bot-level">
            Lv {level}
            {level === MAX_BOT_LEVEL ? " · MAX" : ""}
          </span>
        </div>
      </div>

      <div className="bg-bubble text-center text-sm" data-testid="bot-tagline">
        “{BOT_TAGLINES[level]}”
      </div>

      <ul className="flex flex-col gap-2 text-base">
        <li>👆 Swipe across letters to make words.</li>
        <li>📏 Longer words score more points.</li>
        <li>⏱ Most points in {minutes} {minutes === 1 ? "minute" : "minutes"} wins.</li>
        <li>🎓 Beat him and he levels up. Lose and he gets insufferable.</li>
      </ul>

      <div className="bg-panel flex flex-col gap-4 p-4" data-testid="settings">
        <div className="bg-title text-lg">⚙️ Game settings</div>
        <SettingsFields
          quick
          settings={state.settings}
          disabled={false}
          onChange={(patch: Partial<Settings>) => {
            for (const [key, value] of Object.entries(patch)) track("setting", { key, value: String(value), mode: "quick" });
            controller.updateSettings(patch);
          }}
        />
      </div>

      {(you > 0 || hoot > 0) && (
        <div className="text-center text-sm opacity-85" data-testid="bot-record">
          This session: You {you} – {hoot} {BOT.name}
        </div>
      )}

      <div className="sticky bottom-3 mt-auto">
        <button className="bg-btn bg-btn-primary w-full text-xl" disabled={!dictReady} onClick={() => controller.startRound()} data-testid="start">
          {dictReady ? "Start ⚡" : "Loading words…"}
        </button>
      </div>
    </div>
  );
}
