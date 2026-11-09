"use client";

import { useEffect, useState } from "react";
import { click, track } from "@/lib/boggled/analytics";
import { adLife, buy, livesLeft, MAX_LIVES, SHOP, type QuestSave } from "@/lib/boggled/quest";
import { sound } from "@/lib/boggled/sound";

export function Coins({ n, testid = "coins" }: { n: number; testid?: string }) {
  return (
    <span className="bg-chip bg-coins text-sm" data-testid={testid}>
      🪙 {n}
    </span>
  );
}

export function ItemChips({ save }: { save: QuestSave }) {
  return (
    <span className="flex gap-1.5" data-testid="loadout">
      {SHOP.filter((s) => s.item !== "life").map((s) => {
        const n = save.items[s.item as keyof QuestSave["items"]];
        return (
          <span key={s.item} className={`bg-chip px-2 py-0.5 text-xs ${n ? "" : "opacity-45"}`}>
            {s.emoji} {n}
          </span>
        );
      })}
    </span>
  );
}

export function ShopModal({ save, onChange, onClose }: { save: QuestSave; onChange: (q: QuestSave) => void; onClose: () => void }) {
  const [bought, setBought] = useState<string | null>(null);
  const full = livesLeft(save) >= MAX_LIVES;
  return (
    <div className="bg-modal" onClick={onClose} role="dialog" aria-modal aria-label="Shop" data-testid="shop">
      <div className="bg-modal-card bg-shop" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="bg-title text-2xl">🛒 Shop</div>
          <Coins n={save.coins} testid="shop-coins" />
        </div>
        <div className="flex flex-col gap-2">
          {SHOP.map((s) => {
            const owned = s.item === "life" ? livesLeft(save) : save.items[s.item];
            const disabled = save.coins < s.price || (s.item === "life" && full);
            return (
              <div key={s.item} className={`bg-shop-item ${bought === s.item ? "bought" : ""}`}>
                <span className="bg-shop-emoji">{s.emoji}</span>
                <div className="min-w-0 flex-1 text-left">
                  <div className="font-bold">
                    {s.name} <span className="text-xs opacity-70">· have {owned}{s.item === "life" ? `/${MAX_LIVES}` : ""}</span>
                  </div>
                  <div className="text-xs opacity-80">{s.blurb}</div>
                </div>
                <button
                  className="bg-btn bg-btn-primary shrink-0 px-3 py-2 text-sm"
                  disabled={disabled}
                  onClick={() => {
                    const q = buy(s.item);
                    if (!q) return;
                    click(`buy_${s.item}`);
                    track("buy", { item: s.item, price: s.price });
                    sound.bombEarned();
                    setBought(s.item);
                    onChange(q);
                  }}
                  data-testid={`buy-${s.item}`}
                >
                  🪙 {s.price}
                </button>
              </div>
            );
          })}
        </div>
        <p className="text-center text-xs opacity-80">Earn 🪙 every game. Bigger wins, more stars, first clears and bosses pay more.</p>
        <button className="bg-btn bg-btn-ghost" onClick={onClose} data-testid="shop-close">
          Done
        </button>
      </div>
    </div>
  );
}

const AD_MS = 5000;

// Stand-in for a rewarded video ad. Swap the body for a real ad SDK; keep "reward only after it finishes".
export function AdModal({ onClose, onReward }: { onClose: () => void; onReward: (q: QuestSave) => void }) {
  const [left, setLeft] = useState(AD_MS / 1000);
  useEffect(() => {
    track("ad_start");
    const id = setInterval(() => setLeft((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const claim = () => {
    const q = adLife();
    track("ad_reward", { granted: !!q });
    if (q) {
      sound.join();
      onReward(q);
    }
    onClose();
  };
  return (
    <div className="bg-modal" role="dialog" aria-modal aria-label="Ad" data-testid="ad">
      <div className="bg-modal-card text-center">
        <div className="text-xs tracking-widest opacity-70">ADVERTISEMENT</div>
        <div className="bg-ad-slot">
          <div className="text-5xl">🔤</div>
          <div className="bg-title text-xl">Your ad here</div>
          <div className="text-xs opacity-80">Watching keeps Word Brawl free.</div>
        </div>
        {left > 0 ? (
          <div className="bg-btn bg-btn-ghost opacity-80" data-testid="ad-wait">
            Reward in {left}s
          </div>
        ) : (
          <button className="bg-btn bg-btn-primary" onClick={claim} data-testid="ad-claim">
            Claim +1 ❤️
          </button>
        )}
        <button className="text-xs underline opacity-70" onClick={onClose} data-testid="ad-close">
          {left > 0 ? "Skip (no reward)" : "Close"}
        </button>
      </div>
    </div>
  );
}
