"use client";

import ZoomableImage from "./ZoomableImage";

export default function PainCard({
  emoji,
  title,
  items,
  imageSrc,
  imageCaptionAlt,
  imageCaption,
  color,
  reverse = false,
}: {
  emoji: string;
  title: string;
  items: string[];
  imageSrc?: string;
  imageCaptionAlt: string;
  imageCaption?: string;
  color: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`neo-shadow overflow-hidden ${color} flex flex-col ${
        reverse ? "md:flex-row-reverse" : "md:flex-row"
      }`}
    >
      {/* Text side */}
      <div className="flex flex-1 flex-col justify-center p-8">
        <h3 className="mb-4 text-2xl font-black uppercase tracking-tight">
          {emoji} {title}
        </h3>
        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="text-base leading-relaxed font-medium">
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Image side */}
      {imageSrc && (
        <div className="flex flex-1 flex-col border-t-3 border-foreground md:border-t-0 md:border-l-3">
          <ZoomableImage
            src={imageSrc}
            alt={imageCaptionAlt}
            className="h-full w-full"
          />
          {imageCaption && (
            <p className="border-t-2 border-foreground bg-surface px-4 py-2 text-center text-xs font-bold">
              {imageCaption}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
