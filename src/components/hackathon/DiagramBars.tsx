import { DiagramDatum } from "@/lib/hackathon-data";

type DiagramBarsProps = {
  data: DiagramDatum[];
  emptyMessage: string;
};

export default function DiagramBars({ data, emptyMessage }: DiagramBarsProps) {
  if (data.length === 0) {
    return (
      <div className="neo-shadow-sm bg-yellow p-4 text-sm font-bold">{emptyMessage}</div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="neo-shadow-sm bg-white p-3">
          <div className="mb-2 flex items-center justify-between gap-4 text-sm font-black uppercase">
            <span>{item.label}</span>
            <span>
              {item.count} ({item.percentage}%)
            </span>
          </div>
          <div className="h-4 w-full border-2 border-foreground bg-surface">
            <div
              className="h-full bg-accent"
              style={{ width: `${Math.max(item.percentage, 4)}%` }}
              aria-hidden
            />
          </div>
        </div>
      ))}
    </div>
  );
}
