"use client";

import ZoomableImage from "./ZoomableImage";

export default function PainCard({
  emoji,
  title,
  items,
  imageSrc,
  imageCaptionAlt,
  color,
}: {
  emoji: string;
  title: string;
  items: string[];
  imageSrc?: string;
  imageCaptionAlt: string;
  color: string;
}) {
  return (
    <div className={`neo-shadow neo-hover p-6 ${color}`}>
      <h3 className="mb-4 text-xl font-black uppercase tracking-tight">
        {emoji} {title}
      </h3>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="text-sm leading-relaxed font-medium">
            {item}
          </li>
        ))}
      </ul>
      {imageSrc && (
        <ZoomableImage
          src={imageSrc}
          alt={imageCaptionAlt}
          className="mt-4 w-full border-3 border-foreground"
        />
      )}
      <p className="mt-3 border-t-2 border-foreground pt-3 text-xs font-bold uppercase tracking-wider">
        {imageCaptionAlt}
      </p>
    </div>
  );
}
