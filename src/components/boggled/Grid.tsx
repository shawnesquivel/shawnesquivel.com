"use client";

import { useRef, useState, type PointerEvent } from "react";
import { isAdjacent, pathWord, type Board } from "@/lib/boggled/board";
import { sound } from "@/lib/boggled/sound";

export type SubmitResult = "valid" | "dup" | "invalid" | "short";

type Props = {
  board: Board;
  disabled?: boolean;
  hideLetters?: boolean;
  blocked?: ReadonlySet<number>;
  flipped?: ReadonlySet<number>;
  classify: (word: string) => "good" | "dup" | null;
  onSubmit: (word: string) => SubmitResult;
  onPathChange?: (word: string) => void;
};

// Moves only register inside this fraction of a cell (radius) so diagonal swipes don't clip neighbours.
const MOVE_HIT_RADIUS = 0.36;

const NONE: ReadonlySet<number> = new Set();

export default function Grid({ board, disabled, hideLetters, blocked = NONE, flipped = NONE, classify, onSubmit, onPathChange }: Props) {
  const [path, setPathState] = useState<number[]>([]);
  const [flash, setFlash] = useState<{ tiles: number[]; kind: string; key: number } | null>(null);
  const pathRef = useRef<number[]>([]);
  const gesture = useRef<{ active: boolean; moved: boolean; submitOnUp: boolean; rect: DOMRect | null }>({
    active: false,
    moved: false,
    submitOnUp: false,
    rect: null,
  });
  const size = board.size;

  const setPath = (next: number[]) => {
    const grew = next.length > pathRef.current.length;
    pathRef.current = next;
    setPathState(next);
    onPathChange?.(pathWord(board, next));
    if (grew) {
      sound.tile(next.length - 1);
      navigator.vibrate?.(6);
    }
  };

  const hit = (clientX: number, clientY: number, strict: boolean): number | null => {
    const rect = gesture.current.rect;
    if (!rect) return null;
    const cell = rect.width / size;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const col = Math.floor(x / cell);
    const row = Math.floor(y / cell);
    if (col < 0 || row < 0 || col >= size || row >= size) return null;
    if (blocked.has(row * size + col)) return null;
    if (strict) {
      const dx = x - (col + 0.5) * cell;
      const dy = y - (row + 0.5) * cell;
      if (Math.hypot(dx, dy) > MOVE_HIT_RADIUS * cell) return null;
    }
    return row * size + col;
  };

  const submit = () => {
    const current = pathRef.current;
    if (!current.length) return;
    if (current.some((i) => blocked.has(i))) {
      setPath([]);
      return;
    }
    const word = pathWord(board, current);
    const result = onSubmit(word);
    const kind = result === "valid" ? "flash-good" : result === "dup" ? "flash-dup" : result === "invalid" ? "flash-bad" : "";
    if (kind) setFlash({ tiles: current, kind, key: Date.now() });
    setPath([]);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    sound.unlock();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current.rect = e.currentTarget.getBoundingClientRect();
    const t = hit(e.clientX, e.clientY, false);
    gesture.current = { ...gesture.current, active: true, moved: false, submitOnUp: false };
    if (t === null) return;
    const current = pathRef.current;
    const last = current[current.length - 1];
    if (current.length && t === last) {
      gesture.current.submitOnUp = true;
    } else if (current.length && !current.includes(t) && isAdjacent(size, last, t)) {
      setPath([...current, t]);
    } else if (current.includes(t)) {
      setPath(current.slice(0, current.indexOf(t) + 1));
    } else {
      setPath([t]);
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!gesture.current.active || disabled) return;
    if (pathRef.current.some((i) => blocked.has(i))) {
      setPath([]);
      gesture.current.active = false;
      return;
    }
    const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
    for (const ev of events) {
      const t = hit(ev.clientX, ev.clientY, true);
      const current = pathRef.current;
      if (t === null || !current.length || t === current[current.length - 1]) continue;
      if (current.length >= 2 && t === current[current.length - 2]) {
        setPath(current.slice(0, -1));
        gesture.current.moved = true;
        gesture.current.submitOnUp = false;
      } else if (!current.includes(t) && isAdjacent(size, current[current.length - 1], t)) {
        setPath([...current, t]);
        gesture.current.moved = true;
        gesture.current.submitOnUp = false;
      }
    }
  };

  const onPointerUp = () => {
    if (!gesture.current.active) return;
    const { moved, submitOnUp } = gesture.current;
    gesture.current.active = false;
    // A drag submits on release; a plain tap keeps building the word (tap the last tile again to submit).
    if (moved || submitOnUp) submit();
  };

  const word = pathWord(board, path);
  const live = path.length ? classify(word) : null;
  const centers = path.map((i) => [((i % size) + 0.5) * (100 / size), (Math.floor(i / size) + 0.5) * (100 / size)]);
  const fontSize = size === 5 ? "clamp(1.4rem, 7.5vw, 2.4rem)" : "clamp(1.8rem, 10vw, 3rem)";

  return (
    <div
      className="bg-grid-wrap"
      data-testid="grid"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="bg-grid" style={{ gridTemplateColumns: `repeat(${size}, 1fr)`, gridTemplateRows: `repeat(${size}, 1fr)` }}>
        {board.tiles.map((letter, i) => {
          const isBlocked = blocked.has(i);
          const selected = !isBlocked && path.includes(i);
          const flashing = flash && flash.tiles.includes(i) ? flash.kind : "";
          return (
            <div key={i} style={{ padding: "6%" }}>
              <div
                key={flashing ? `${i}-${flash!.key}` : i}
                data-tile={i}
                className={[
                  "bg-tile h-full",
                  selected ? "sel" : "",
                  selected && live ? live : "",
                  !selected ? flashing : "",
                  hideLetters ? "hidden-letter" : "",
                  isBlocked ? "blocked" : "",
                  flipped.has(i) && !isBlocked ? "flipped" : "",
                ].join(" ")}
                data-blocked={isBlocked || undefined}
                style={{ fontSize }}
              >
                {isBlocked ? (
                  <span className="bg-bomb-tile">💣</span>
                ) : letter === "QU" ? (
                  <span>
                    Q<span style={{ fontSize: "0.6em" }}>u</span>
                  </span>
                ) : (
                  letter
                )}
              </div>
            </div>
          );
        })}
      </div>
      {centers.length > 1 && (
        <svg className="bg-trail" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline
            points={centers.map(([x, y]) => `${x},${y}`).join(" ")}
            fill="none"
            stroke={live === "good" ? "#1f9a55" : live === "dup" ? "#b86d00" : "#ff8a00"}
            strokeOpacity={0.55}
            strokeWidth={3.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
}
