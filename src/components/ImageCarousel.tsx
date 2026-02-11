"use client";

import { useState, useEffect, useCallback } from "react";

const SLIDES = [
  { src: "/linkedin-dev.png", caption: "Founding Engineer at a $79M Series A company" },
  { src: "/about-me-app.png", caption: "Built 10+ apps with Cursor — this one has 5 stars in the App Store" },
  { src: "/about-me-cursor.png", caption: "Top 1% Cursor user" },
  { src: "/about-me-cursor-workshops.png", caption: "200+ member Cursor event in Vancouver" },
  { src: "/about-me-cursor-thailand.png", caption: "100+ attendee Cursor event in Thailand" },
];

export default function ImageCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % SLIDES.length);
  }, []);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 3000);
    return () => clearInterval(id);
  }, [paused, next]);

  return (
    <div
      className="relative mx-auto mt-12 max-w-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slide */}
      <figure className="neo-shadow overflow-hidden bg-white">
        <div className="flex aspect-4/3 items-center justify-center bg-neutral-100 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={SLIDES[current].src}
            alt={SLIDES[current].caption}
            className="max-h-full max-w-full object-contain"
          />
        </div>
        <figcaption className="border-t-3 border-foreground px-4 py-3 text-center text-sm font-bold leading-snug">
          {SLIDES[current].caption}
        </figcaption>
      </figure>

      {/* Arrows */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 border-3 border-foreground bg-surface p-2 font-black shadow-[3px_3px_0_0_#1a1a1a] transition-all hover:shadow-[1px_1px_0_0_#1a1a1a] hover:translate-x-[calc(-50%+2px)] hover:translate-y-[calc(-50%+2px)] active:shadow-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
      </button>
      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 border-3 border-foreground bg-surface p-2 font-black shadow-[3px_3px_0_0_#1a1a1a] transition-all hover:shadow-[1px_1px_0_0_#1a1a1a] hover:translate-x-[calc(50%-2px)] hover:translate-y-[calc(-50%+2px)] active:shadow-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </button>

      {/* Dots */}
      <div className="mt-4 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-3 w-3 border-2 border-foreground transition-colors ${
              i === current ? "bg-foreground" : "bg-surface"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
