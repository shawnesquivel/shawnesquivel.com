"use client";

import { useState } from "react";
import TestimonialCard from "./TestimonialCard";

const TESTIMONIALS = [
  {
    quote: "I was able to get the web app running in a weekend",
    name: "Peter",
    imageSrc: "/testimonial-peter.png",
    color: "bg-blue",
  },
  {
    quote: "Well worth the money and time",
    name: "Patrick M.",
    imageSrc: "/testimonial-patrick.png",
    color: "bg-green",
  },
  {
    quote: "I've seen other ppl charge $100 for the boilerplate alone",
    name: "Princess Jean S.",
    imageSrc: "/testimonial-princess.png",
    color: "bg-yellow",
  },
  {
    quote: "I've never finished other courses cause it felt like 7 hrs of watching someone code",
    name: "Regine C.",
    imageSrc: "/testimonial-regine.png",
    color: "bg-pink",
  },
];

export default function TestimonialCarousel() {
  const [paused, setPaused] = useState(false);

  // Duplicate cards for seamless loop
  const cards = [...TESTIMONIALS, ...TESTIMONIALS];

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => {
        // Short delay so the carousel doesn't jerk immediately on tap release
        setTimeout(() => setPaused(false), 2000);
      }}
    >
      <div
        className="flex gap-6 animate-marquee"
        style={{
          animationPlayState: paused ? "paused" : "running",
        }}
      >
        {cards.map((t, i) => (
          <div
            key={`${t.name}-${i}`}
            className="w-[85vw] max-w-sm shrink-0"
          >
            <TestimonialCard
              quote={t.quote}
              name={t.name}
              imageSrc={t.imageSrc}
              color={t.color}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
