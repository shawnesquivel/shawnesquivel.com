"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/boggled/analytics";
import { generateBoard, solve, type Board } from "@/lib/boggled/board";
import { loadDictionary, type Dictionary } from "@/lib/boggled/dictionary";
import { wordPoints } from "@/lib/boggled/scoring";

// "Q" means the Qu die, like the board game.
function parse(text: string): Board | null {
  const tiles = text
    .toUpperCase()
    .replace(/QU/g, "Q")
    .replace(/[^A-Z]/g, "")
    .split("")
    .map((c) => (c === "Q" ? "Qu" : c));
  if (tiles.length === 16) return { size: 4, tiles };
  if (tiles.length === 25) return { size: 5, tiles };
  return null;
}

const toText = (b: Board) =>
  Array.from({ length: b.size }, (_, r) =>
    b.tiles
      .slice(r * b.size, (r + 1) * b.size)
      .join("")
      .toUpperCase(),
  ).join(" ");

const SAMPLE = "SERS PATG LINE SERS";

export default function Solver() {
  const [dict, setDict] = useState<Dictionary | null>(null);
  const [text, setText] = useState(SAMPLE);
  const [picked, setPicked] = useState<string | null>(null);
  const [minLength, setMinLength] = useState(3);

  useEffect(() => {
    let alive = true;
    loadDictionary().then((d) => alive && setDict(d));
    return () => {
      alive = false;
    };
  }, []);

  const board = parse(text);
  const words = useMemo(() => {
    if (!board || !dict) return [];
    return [...solve(board, dict, minLength).entries()].sort((a, b) => b[0].length - a[0].length || a[0].localeCompare(b[0]));
    // board is derived from text each render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, dict, minLength]);

  useEffect(() => {
    if (!board || !dict) return;
    const t = setTimeout(() => track("solver", { size: board.size, words: words.length }), 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, dict]);

  const path = picked ? words.find(([w]) => w === picked)?.[1] ?? [] : [];
  const total = words.reduce((n, [w]) => n + wordPoints(w), 0);
  const count = board ? board.tiles.length : text.replace(/qu/gi, "q").replace(/[^a-z]/gi, "").length;

  const random = (size: 4 | 5) => {
    if (!dict) return;
    setPicked(null);
    setText(toText(generateBoard(size, String(Math.random()), dict)));
    track("click", { target: `solver_random_${size}` });
  };

  return (
    <div className="bg-solver" data-testid="solver">
      <label className="bg-solver-label" htmlFor="solver-input">
        Type the letters row by row (16 for 4×4, 25 for 5×5). Use Q for Qu.
      </label>
      <textarea
        id="solver-input"
        className="bg-solver-input"
        value={text}
        rows={2}
        spellCheck={false}
        autoCapitalize="characters"
        onChange={(e) => {
          setPicked(null);
          setText(e.target.value);
        }}
        data-testid="solver-input"
      />
      <div className="bg-solver-bar">
        <span className={board ? "" : "bg-solver-warn"}>{board ? `${board.size}×${board.size} board` : `${count} letters: need 16 or 25`}</span>
        <span className="flex gap-1.5">
          <button className="bg-btn bg-btn-ghost bg-solver-small" onClick={() => random(4)} disabled={!dict}>
            🎲 4×4
          </button>
          <button className="bg-btn bg-btn-ghost bg-solver-small" onClick={() => random(5)} disabled={!dict}>
            🎲 5×5
          </button>
          <select className="bg-solver-small bg-solver-select" value={minLength} onChange={(e) => setMinLength(Number(e.target.value))} aria-label="Shortest word">
            <option value={3}>3+ letters</option>
            <option value={4}>4+ letters</option>
          </select>
        </span>
      </div>

      {board && (
        <div className="bg-solver-grid" style={{ gridTemplateColumns: `repeat(${board.size}, 1fr)` }} aria-label="Board">
          {board.tiles.map((t, i) => {
            const k = path.indexOf(i);
            return (
              <span key={i} className={`bg-solver-tile ${k >= 0 ? "on" : ""} ${k === 0 ? "first" : ""}`}>
                {t}
                {k >= 0 && <small>{k + 1}</small>}
              </span>
            );
          })}
        </div>
      )}

      {!dict ? (
        <p className="text-center text-sm opacity-75">Loading the dictionary…</p>
      ) : board ? (
        <>
          <p className="bg-solver-sum" data-testid="solver-count">
            <b>{words.length}</b> words · <b>{total}</b> points possible. Tap a word to see its path.
          </p>
          <div className="bg-solver-words">
            {words.map(([w]) => (
              <button key={w} className={`bg-solver-word ${picked === w ? "on" : ""}`} onClick={() => setPicked(picked === w ? null : w)}>
                {w.toUpperCase()} <small>+{wordPoints(w)}</small>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
