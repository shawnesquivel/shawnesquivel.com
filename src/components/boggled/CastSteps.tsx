// How to put a Word Brawl room on a TV. Plain markup so the lobby and the guide page can both render it.

export const CAST_METHODS: { id: string; icon: string; title: string; steps: string[] }[] = [
  {
    id: "chromecast",
    icon: "📡",
    title: "Chromecast / Google TV",
    steps: [
      "Open the room on a laptop in Chrome.",
      "Click ⋮ (top right) → Cast… → pick your TV.",
      "Under Sources choose Cast tab, then press F11 for full screen.",
      "On Android instead: swipe down → Screen Cast → pick your TV.",
    ],
  },
  {
    id: "airplay",
    icon: "🍎",
    title: "Apple TV / AirPlay TV",
    steps: [
      "iPhone or iPad: open Control Center → Screen Mirroring → pick your TV.",
      "Mac: Control Center → Screen Mirroring → pick your TV.",
      "Open the room in Safari and turn the phone sideways for a bigger board.",
    ],
  },
  {
    id: "smart-tv",
    icon: "📺",
    title: "Smart TV browser",
    steps: [
      "Samsung, LG or Fire TV: open the TV's web browser.",
      "Go to wordbrawl.app and tap Join, then enter the room code.",
      "Everyone else joins on their phones.",
    ],
  },
];

export function CastSteps() {
  return (
    <div className="bg-cast" data-testid="cast-steps">
      {CAST_METHODS.map((m) => (
        <div key={m.id} className="bg-cast-card">
          <div className="bg-cast-title">
            <span className="text-2xl">{m.icon}</span> {m.title}
          </div>
          <ol>
            {m.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
