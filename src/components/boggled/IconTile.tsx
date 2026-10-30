export function Tile({ px }: { px: number }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffd23f",
        color: "#2a1670",
        borderRadius: px * 0.22,
        fontSize: px * 0.68,
        fontWeight: 800,
        fontFamily: "sans-serif",
      }}
    >
      W
    </div>
  );
}
