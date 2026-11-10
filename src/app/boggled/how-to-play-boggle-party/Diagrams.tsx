// Original illustrations for the guide (no Netflix artwork). Inline SVG so they stay sharp and weigh nothing.

const INK = "#1b0f52";
const GOLD = "#ffd23f";
const GREEN = "#3ddc84";
const PINK = "#ff7ac6";

function Phone({ x, y, label, color, tilt = 0 }: { x: number; y: number; label: string; color: string; tilt?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`}>
      <rect x={-17} y={-30} width={34} height={60} rx={7} fill={INK} stroke="#fff" strokeOpacity={0.5} strokeWidth={1.5} />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={-12 + c * 8.5} y={-20 + r * 8.5} width={7} height={7} rx={1.5} fill={r === 1 ? color : "#4a3aa8"} />),
      )}
      <rect x={-11} y={10} width={22} height={5} rx={2.5} fill={color} opacity={0.8} />
      <text y={46} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff">
        {label}
      </text>
    </g>
  );
}

function Qr({ x, y, s }: { x: number; y: number; s: number }) {
  const cells = [
    [1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1],
    [0, 1, 0, 1, 0, 1, 0],
    [1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 1],
    [1, 1, 1, 0, 1, 1, 0],
  ];
  const c = s / 7;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-3} y={-3} width={s + 6} height={s + 6} rx={3} fill="#fff" />
      {cells.flatMap((row, r) => row.map((on, k) => (on ? <rect key={`${r}${k}`} x={k * c} y={r * c} width={c} height={c} fill={INK} /> : null)))}
    </g>
  );
}

export function NetflixSetup() {
  return (
    <figure className="bg-guide-fig">
      <svg viewBox="0 0 360 250" role="img" aria-label="Boggle Party setup: a TV shows a QR code, and phones in the same room scan it">
        <rect x={0} y={0} width={360} height={250} rx={18} fill="#2a1a7a" />
        <text x={180} y={24} textAnchor="middle" fontSize={12} fontWeight={700} fill={GOLD}>
          NETFLIX BOGGLE PARTY
        </text>
        <g transform="translate(95 38)">
          <rect width={170} height={100} rx={8} fill={INK} stroke="#fff" strokeOpacity={0.6} strokeWidth={2} />
          <rect x={10} y={10} width={150} height={80} rx={4} fill="#3b6df0" />
          <Qr x={65} y={24} s={40} />
          <text x={85} y={84} textAnchor="middle" fontSize={8} fontWeight={700} fill="#fff">
            Scan to join
          </text>
          <rect x={70} y={100} width={30} height={8} fill={INK} />
          <rect x={55} y={107} width={60} height={4} rx={2} fill={INK} />
        </g>
        <text x={290} y={60} fontSize={9} fill="#fff" opacity={0.85}>
          Host needs
        </text>
        <text x={290} y={72} fontSize={9} fill="#fff" opacity={0.85}>
          Netflix + TV
        </text>
        {[
          [80, PINK, -8, "You"],
          [180, GREEN, 0, "Maya"],
          [280, GOLD, 8, "Sam"],
        ].map(([x, color, tilt, label]) => (
          <g key={label as string}>
            <path d={`M${x} 164 L${180 + ((x as number) - 180) * 0.25} 128`} stroke="#fff" strokeOpacity={0.5} strokeWidth={1.5} strokeDasharray="4 4" />
            <Phone x={x as number} y={182} label={label as string} color={color as string} tilt={tilt as number} />
          </g>
        ))}
        <text x={180} y={242} textAnchor="middle" fontSize={9} fill="#fff" opacity={0.7}>
          Everyone has to be in the same room
        </text>
      </svg>
      <figcaption>Boggle Party: the TV hosts, phones in the room scan its QR code.</figcaption>
    </figure>
  );
}

export function WordBrawlSetup() {
  return (
    <figure className="bg-guide-fig">
      <svg viewBox="0 0 360 230" role="img" aria-label="Word Brawl setup: phones in different places join one room with a link">
        <rect x={0} y={0} width={360} height={230} rx={18} fill="#1d5fc8" />
        <text x={180} y={24} textAnchor="middle" fontSize={12} fontWeight={700} fill={GOLD}>
          WORD BRAWL
        </text>
        <g transform="translate(180 92)">
          <ellipse rx={58} ry={34} fill="#fff" opacity={0.14} />
          <text y={-6} textAnchor="middle" fontSize={20} fontWeight={800} fill="#fff" letterSpacing={3}>
            GBTL
          </text>
          <text y={12} textAnchor="middle" fontSize={9} fill="#fff" opacity={0.85}>
            🔗 wordbrawl.app/?room=GBTL
          </text>
        </g>
        {[
          [62, 74, PINK, -8, "You · Bangkok"],
          [298, 74, GREEN, 8, "Maya · London"],
          [118, 176, GOLD, -4, "Sam · couch"],
          [242, 176, "#9b8cff", 4, "Jo · bus"],
        ].map(([x, y, color, tilt, label]) => (
          <g key={label as string}>
            <path d={`M${x} ${y} L180 92`} stroke={GOLD} strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="4 4" />
            <Phone x={x as number} y={y as number} label={label as string} color={color as string} tilt={tilt as number} />
          </g>
        ))}
        <text x={180} y={40} textAnchor="middle" fontSize={9} fill="#fff" opacity={0.8}>
          No TV, no app, no Netflix
        </text>
      </svg>
      <figcaption>Word Brawl: everyone opens the same link, wherever they are. A TV is optional.</figcaption>
    </figure>
  );
}
