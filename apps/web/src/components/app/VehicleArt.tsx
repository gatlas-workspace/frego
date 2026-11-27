/** Hình minh hoạ xe máy / ô tô / ô tô 7 chỗ theo màu hãng (UiVehicleTile, UiPriceRow). */
export type VehicleBrand = "grab" | "be" | "gsm" | "other";
export type VehicleKind = "bike" | "car" | "suv";

const body: Record<VehicleBrand, { fill: string; stroke: string }> = {
  grab: { fill: "fill-app-veh-grab", stroke: "stroke-app-veh-grab" },
  be: { fill: "fill-app-veh-be", stroke: "stroke-app-veh-be" },
  gsm: { fill: "fill-app-veh-gsm", stroke: "stroke-app-veh-gsm" },
  other: { fill: "fill-app-veh-other", stroke: "stroke-app-veh-other" },
};

const CAR_BODY =
  "M10 42 C10 36 14 33 20 32 L32 30 L44 19 C47 16.5 50.5 15 54.5 15 L77 15 C81 15 84.5 16.5 87.5 19 L99 30 L106 31.5 C111 32.5 114 36 114 41 L114 47 C114 49.5 112 51.5 109.5 51.5 L14.5 51.5 C12 51.5 10 49.5 10 47 Z";
const SUV_BODY =
  "M10 44 C10 38 13 34 19 33 L28 31 L36 17 C38 14 41 12.5 44.5 12.5 L90 12.5 C94 12.5 97 14.5 98.5 17.5 L104 31 L107 32 C112 33.5 114 37 114 42 L114 47 C114 49.5 112 51.5 109.5 51.5 L14.5 51.5 C12 51.5 10 49.5 10 47 Z";

function Wheels({ cy, r, hub, xs }: { cy: number; r: number; hub: number; xs: [number, number] }) {
  return (
    <>
      {xs.map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={cy} r={r} className="fill-app-veh-tire" />
          <circle cx={cx} cy={cy} r={hub} className="fill-app-veh-hub" />
        </g>
      ))}
    </>
  );
}

function Lamps() {
  return (
    <>
      <rect x="104" y="35" width="7" height="4" rx="2" className="fill-app-veh-light" />
      <rect x="12" y="35" width="5" height="4" rx="2" className="fill-app-veh-tail" />
    </>
  );
}

export function VehicleArt({ brand, kind, width = 60 }: { brand: VehicleBrand; kind: VehicleKind; width?: number }) {
  const c = body[brand];
  return (
    <svg viewBox="0 0 120 64" width={width} height={(width * 32) / 60} aria-hidden="true" className="block flex-none">
      {kind === "bike" ? (
        <>
          <ellipse cx="60" cy="58" rx="46" ry="3.5" className="fill-app-veh-shadow" />
          <Wheels cy={48} r={10} hub={4.2} xs={[28, 94]} />
          <path d="M14 42 C14 32 21 27 32 27 L56 27 C61 27 63.5 30 64.5 34 L66 42 Z" className={c.fill} />
          <path d="M24 26 C24 22 27 20 31 20 L52 20 C55.5 20 58 22.5 58 26 Z" className="fill-app-veh-tire" />
          <path d="M62 45 L84 45 L86 40 L62 40 Z" className="fill-app-veh-tire" />
          <path d="M80 45 C78 32 81 20 89 11 L94 13 C88 21 86 32 88 45 Z" className={c.fill} />
          <path d="M86 10 L100 7" fill="none" strokeWidth="3.5" strokeLinecap="round" className="stroke-app-veh-tire" />
          <circle cx="95" cy="16" r="3.2" className="fill-app-veh-light" />
          <path d="M84 41 C87 35 101 35 104 41" fill="none" strokeWidth="4" strokeLinecap="round" className={c.stroke} />
        </>
      ) : kind === "car" ? (
        <>
          <ellipse cx="62" cy="58" rx="50" ry="3.5" className="fill-app-veh-shadow" />
          <path d={CAR_BODY} className={c.fill} />
          <path d="M47.5 30 L56 20.5 C57 19.4 58.4 18.8 59.9 18.8 L64 18.8 L64 30 Z" className="fill-app-veh-glass" />
          <path d="M68 18.8 L76.5 18.8 C78.4 18.8 80.2 19.6 81.4 21 L90 30 L68 30 Z" className="fill-app-veh-glass" />
          <Lamps />
          <Wheels cy={51} r={9.5} hub={4} xs={[32, 92]} />
        </>
      ) : (
        <>
          <ellipse cx="62" cy="58" rx="50" ry="3.5" className="fill-app-veh-shadow" />
          <path d={SUV_BODY} className={c.fill} />
          <path d="M39 30 L45 17 L60 17 L60 30 Z" className="fill-app-veh-glass" />
          <path d="M64 17 L80 17 L80 30 L64 30 Z" className="fill-app-veh-glass" />
          <path d="M84 17 L92 17 C94 17 95 18 95.8 19.5 L100 30 L84 30 Z" className="fill-app-veh-glass" />
          <Lamps />
          <Wheels cy={51} r={9.5} hub={4} xs={[32, 92]} />
        </>
      )}
    </svg>
  );
}
