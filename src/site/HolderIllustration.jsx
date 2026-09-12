// Flat illustration of a three-tier holder with bottles standing in it. Used
// on the home page to explain the product before any photo exists for a given
// colour. `holder` is the filament colour, `bottles` the number per tier.
export default function HolderIllustration({ holder = "#b87333", bottles = 5, width = 520 }) {
  const tierW = 380;
  const tierH = 34;
  const stepBack = 38;
  const stepUp = 28;
  const holeR = 22;
  const bottleH = 84;
  const originX = 70;
  const originY = 250;
  const height = 320;
  const scale = width / 520;

  const tiers = [0, 1, 2].map((t) => {
    const x = originX + t * stepBack;
    const y = originY - t * stepUp;
    return { t, x, y };
  });

  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v + amt))));
    return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  };

  const bottleBody = "#2b2f36";
  const bottleCap = "#111";

  return (
    <svg
      width={width}
      height={height * scale}
      viewBox={`0 0 520 ${height}`}
      role="img"
      aria-label="Three-tier holder with travel spray bottles standing in it"
    >
      {/* draw back tier first so front tiers overlap */}
      {[...tiers].reverse().map(({ t, x, y }) => {
        const spacing = tierW / bottles;
        return (
          <g key={t}>
            {/* tier top face with holes */}
            <path d={`M ${x} ${y} L ${x + 16} ${y - 16} L ${x + tierW + 16} ${y - 16} L ${x + tierW} ${y} Z`} fill={holder} />
            {Array.from({ length: bottles }).map((_, i) => {
              const cx = x + spacing * (i + 0.5) + 8;
              return <ellipse key={i} cx={cx} cy={y - 8} rx={holeR - 2} ry={7} fill={shade(holder, -70)} />;
            })}
            {/* bottles standing in the holes */}
            {Array.from({ length: bottles }).map((_, i) => {
              const cx = x + spacing * (i + 0.5) + 8;
              const bottom = y - 8;
              const top = bottom - bottleH;
              return (
                <g key={i}>
                  <rect x={cx - holeR + 5} y={top} width={holeR * 2 - 10} height={bottleH} rx={4} fill={bottleBody} />
                  <rect x={cx - holeR + 7} y={top + 4} width={5} height={bottleH - 8} rx={2} fill="rgba(255,255,255,0.08)" />
                  <rect x={cx - 8} y={top - 14} width={16} height={16} rx={2} fill={bottleCap} />
                  <rect x={cx - 4} y={top - 20} width={8} height={7} rx={1} fill="#555" />
                </g>
              );
            })}
            {/* tier front face */}
            <rect x={x} y={y} width={tierW} height={tierH} fill={shade(holder, -40)} />
            {/* tier right side */}
            <path
              d={`M ${x + tierW} ${y} L ${x + tierW + 16} ${y - 16} L ${x + tierW + 16} ${y - 16 + tierH} L ${x + tierW} ${y + tierH} Z`}
              fill={shade(holder, -20)}
            />
          </g>
        );
      })}
      <ellipse cx="290" cy="300" rx="260" ry="14" fill="rgba(0,0,0,0.35)" />
    </svg>
  );
}
