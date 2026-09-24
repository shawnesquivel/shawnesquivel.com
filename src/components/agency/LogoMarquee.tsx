import Image from "next/image";

function CursorLogo() {
  return <Image src="/agency/logos/cursor.svg" alt="Cursor" width={101} height={24} className="h-6 w-auto" />;
}

function ComposioLogo() {
  return <Image src="/agency/logos/composio.svg" alt="Composio" width={135} height={26} className="h-[26px] w-auto" />;
}

function iconLogo(src: string, name: string, iconClass = "size-7") {
  return function IconLogo() {
    return (
      <span className="flex items-center gap-2.5">
        <Image src={src} alt="" width={28} height={28} className={iconClass} />
        <span className="text-2xl font-semibold tracking-tight text-white">{name}</span>
      </span>
    );
  };
}

const LOGOS = [
  { name: "Cursor", Logo: CursorLogo },
  { name: "Codex", Logo: iconLogo("/agency/logos/codex.svg", "Codex") },
  { name: "Composio", Logo: ComposioLogo },
  { name: "Anthropic", Logo: iconLogo("/agency/logos/anthropic.svg", "Anthropic", "size-6") },
  { name: "LangChain", Logo: iconLogo("/agency/logos/langchain.svg", "LangChain", "size-6") },
  { name: "RentAHuman", Logo: iconLogo("/agency/logos/rentahuman.svg", "rentahuman") },
];

// Repeated so a single half of the track is always wider than the viewport, keeping the -50% loop seamless.
const TRACK = [...LOGOS, ...LOGOS, ...LOGOS];

export default function LogoMarquee() {
  return (
    <section className="border-y border-line py-10">
      <p className="mb-8 text-center font-mono text-xs uppercase tracking-[0.2em] text-subtle">
        Content &amp; launches for teams at
      </p>
      <div className="group ag-mask-fade-x relative flex overflow-hidden">
        <ul className="ag-marquee flex w-max shrink-0 items-center">
          {[...TRACK, ...TRACK].map(({ name, Logo }, i) => (
            <li
              key={`${name}-${i}`}
              aria-hidden={i >= TRACK.length}
              className="flex h-12 items-center px-10 opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 md:px-14"
              title={name}
            >
              <Logo />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
