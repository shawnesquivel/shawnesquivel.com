"use client";

export default function TestimonialCard({
  quote,
  name,
  imageSrc,
  color,
}: {
  quote: string;
  name?: string;
  imageSrc?: string;
  color: string;
}) {
  return (
    <div className={`neo-shadow ${color}`}>
      {imageSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSrc}
          alt={name ? `${name}'s review` : "Student review"}
          className="w-full border-b-2 border-foreground"
        />
      )}
      <div className="p-6">
        <p className="text-base leading-relaxed font-bold">
          &ldquo;{quote}&rdquo;
        </p>
        {name && (
          <p className="mt-4 text-sm font-black uppercase tracking-wider">
            &mdash; {name}
          </p>
        )}
      </div>
    </div>
  );
}
