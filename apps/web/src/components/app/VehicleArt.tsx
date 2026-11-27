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
  "M10 46 L10 26 C10 20.5 12.5 16.5 17.5 15 C19.5 14.4 21.5 14.2 23.5 14.2 L73 14.2 C76 14.2 78.6 15.3 80.6 17.4 L92.5 29.5 L105 31.4 C110.6 32.3 114 36 114 41 L114 47 C114 49.5 112 51.5 109.5 51.5 L14.5 51.5 C12 51.5 10 49.5 10 47 Z";

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
          {/* Lật ngang quanh x = 62 để mũi xe (phần dài) ở bên phải: mọi xe cùng hướng trái → phải. */}
          <g transform="translate(124 0) scale(-1 1)">
            <path d={CAR_BODY} className={c.fill} />
            <path d="M47.5 30 L56 20.5 C57 19.4 58.4 18.8 59.9 18.8 L64 18.8 L64 30 Z" className="fill-app-veh-glass" />
            <path d="M68 18.8 L76.5 18.8 C78.4 18.8 80.2 19.6 81.4 21 L90 30 L68 30 Z" className="fill-app-veh-glass" />
          </g>
          <Lamps />
          <Wheels cy={51} r={9.5} hub={4} xs={[32, 92]} />
        </>
      ) : (
        // Ô tô 6–7 chỗ: dáng SUV/MPV, giống bản app (apps/mobile/src/components/ui/VehicleTile.tsx).
        <>
          <ellipse cx="62" cy="58" rx="51" ry="3.5" className="fill-app-veh-shadow" />
          <rect x="24" y="9.5" width="46" height="2.6" rx="1.3" className="fill-app-veh-tire" />
          <rect x="28" y="11" width="2.4" height="3.5" className="fill-app-veh-tire" />
          <rect x="64" y="11" width="2.4" height="3.5" className="fill-app-veh-tire" />
          <path d={SUV_BODY} className={c.fill} />
          <path d="M15.5 28 L15.5 22.5 C15.5 20 17.3 18 19.8 18 L31 18 L31 28 Z" className="fill-app-veh-glass" />
          <path d="M35 18 L53 18 L53 28 L35 28 Z" className="fill-app-veh-glass" />
          <path d="M57 18 L72.5 18 C74.4 18 76.2 18.8 77.5 20.2 L85.5 28 L57 28 Z" className="fill-app-veh-glass" />
          <rect x="105" y="34.5" width="7" height="4" rx="2" className="fill-app-veh-light" />
          <rect x="11.5" y="31" width="4" height="6" rx="2" className="fill-app-veh-tail" />
          <Wheels cy={50.5} r={10.5} hub={4.5} xs={[31, 93]} />
        </>
      )}
    </svg>
  );
}
