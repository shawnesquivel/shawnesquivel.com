"use client";

import { COMBO_WINDOW_MS, COMBO_WORDS, MAX_TIME_BOOSTS, SOLO_TIME_BOOST_MS, type RoomState } from "@/lib/boggled/room";

const R = 20;
const C = 2 * Math.PI * R;

export function comboExplainer(state: RoomState, solo: boolean) {
  const left = MAX_TIME_BOOSTS - state.timeBoosts;
  if (solo) {
    return (
      <>
        <b>⚡ Combo ring.</b> Find {COMBO_WORDS} words within {COMBO_WINDOW_MS / 1000} seconds to fill it and add +{SOLO_TIME_BOOST_MS / 1000}s to the
        clock. {left > 0 ? `${left} of ${MAX_TIME_BOOSTS} boosts left this round.` : "All boosts used this round."}
      </>
    );
  }
  return state.powers.shield > 0 ? (
    <>
      <b>🛡️ Shield ready.</b> It automatically blocks the next bomb or flip thrown at you. Use it up and the combo ring starts again.
    </>
  ) : (
    <>
      <b>🛡️ Combo ring.</b> Find {COMBO_WORDS} words within {COMBO_WINDOW_MS / 1000} seconds to fill it and earn a shield that blocks the next attack.
      You can hold one at a time.
    </>
  );
}

export default function ComboRing({ state, solo, onTap }: { state: RoomState; solo: boolean; onTap: () => void }) {
  const shield = !solo && state.powers.shield > 0;
  const maxed = solo && state.timeBoosts >= MAX_TIME_BOOSTS;
  const fill = shield || maxed ? 1 : state.combo.length / COMBO_WORDS;
  const kind = solo ? "time" : "shield";
  return (
    <button
      className={`bg-combo ${kind} ${shield ? "ready" : ""} ${maxed ? "maxed" : ""}`}
      onClick={onTap}
      aria-label={solo ? "Combo ring: time boost" : "Combo ring: shield"}
      data-testid="combo"
      data-fill={state.combo.length}
    >
      <svg viewBox="0 0 48 48" className="bg-combo-svg">
        <circle cx="24" cy="24" r={R} className="bg-combo-track" />
        <circle
          cx="24"
          cy="24"
          r={R}
          className="bg-combo-fill"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - fill)}
          transform="rotate(-90 24 24)"
        />
      </svg>
      <span key={state.combo.length} className={`bg-combo-icon ${state.combo.length ? "bump" : ""}`}>
        {maxed ? "✓" : solo ? "⚡" : "🛡️"}
      </span>
      {state.comboBurst > 0 && <span key={state.comboBurst} className="bg-combo-burst" />}
    </button>
  );
}
