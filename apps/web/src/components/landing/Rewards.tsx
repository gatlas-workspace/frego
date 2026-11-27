import { brand, formatDiscount, formatNumber, POINTS_RULES, serviceShortLabel } from "@frego/core";
import { VehicleTile, type VehicleBrand, type VehicleKind } from "@/components/app";
import { CheckList, Eyebrow, Feature, FeatureArt, FeatureCopy, H2, Lead, Panel, SEC, Wrap } from "./ui";

/** Dữ liệu mẫu khối điểm: đang có 1.250 điểm. */
const BALANCE = 1250;

const REWARDS: { brand: VehicleBrand; kind: VehicleKind; amount: number; label: string; cost: number }[] = [
  { brand: "be", kind: "bike", amount: 10000, label: serviceShortLabel("be", "bike"), cost: 500 },
  { brand: "gsm", kind: "bike", amount: 15000, label: "Green SM", cost: 1000 },
  { brand: "grab", kind: "car", amount: 20000, label: serviceShortLabel("grab", "car4"), cost: 1500 },
];

const next = REWARDS.find((r) => r.cost > BALANCE);

function Points({ n }: { n: number }) {
  return <b className="text-app-ink">+{n} điểm</b>;
}

/** Mục "Điểm thưởng" (#diem-thuong). */
export function Rewards() {
  return (
    <section id="diem-thuong" aria-labelledby="h-diem-thuong" className={`${SEC} bg-app-surface`}>
      <Wrap>
        <Feature>
          <FeatureCopy>
            <Eyebrow>Điểm thưởng</Eyebrow>
            <H2 id="h-diem-thuong">Báo giá thật, nhận điểm đổi voucher</H2>
            <Lead>
              Giá bạn báo giúp {brand.name} ước tính sát hơn cho mọi người. Đổi lại, bạn nhận điểm để đổi voucher do{" "}
              {brand.name} tài trợ.
            </Lead>
            <CheckList
              items={[
                <>
                  <Points n={POINTS_RULES.tap} /> khi chạm một lần: rẻ hơn, đúng khoảng hay đắt hơn
                </>,
                <>
                  <Points n={POINTS_RULES.amount} /> khi nhập số tiền đã trả
                </>,
                <>
                  <Points n={POINTS_RULES.receipt} /> khi bật đọc biên nhận chuyến từ email của hãng
                </>,
                `Đổi ${formatNumber(500)}, ${formatNumber(1000)} hoặc ${formatNumber(1500)} điểm lấy voucher Be, Green SM, Grab`,
              ]}
            />
          </FeatureCopy>

          <FeatureArt>
            <Panel className="bg-app-deal-tint">
              <div aria-hidden="true" className="flex flex-col gap-4">
                <div className="relative flex flex-col gap-3 overflow-hidden rounded-[28px] bg-app-primary px-[26px] py-6 text-white">
                  <svg viewBox="0 0 520 170" width="520" height="170" aria-hidden="true" className="absolute right-0 top-0 block">
                    <circle cx="500" cy="0" r="110" className="fill-app-glow" />
                    <circle cx="440" cy="190" r="70" className="fill-app-glow-2" />
                  </svg>
                  <span className="relative text-sm font-semibold text-app-on-primary-soft">Điểm của bạn</span>
                  <span className="relative flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold leading-none tracking-[-1.2px]">{formatNumber(BALANCE)}</span>
                    <span className="text-lg font-bold">điểm</span>
                  </span>
                  <span className="relative block h-2 rounded bg-app-on-primary-track">
                    <span className="block h-full w-[83%] rounded bg-white" />
                  </span>
                  {next && (
                    <span className="relative text-sm text-app-on-primary-soft">
                      Còn {formatNumber(next.cost - BALANCE)} điểm nữa để đổi {next.label} {formatDiscount(next.amount)}
                    </span>
                  )}
                </div>

                <ul className="m-0 flex list-none flex-col gap-3 p-0">
                  {REWARDS.map((r) => (
                    <li key={r.cost} className="flex overflow-hidden rounded-app-ticket bg-app-surface shadow-app-card">
                      <span className="flex w-[120px] flex-none flex-col items-center gap-0.5 bg-app-deal px-2 pb-3.5 pt-3">
                        <span className="-ml-1.5 mb-1.5 block">
                          <VehicleTile brand={r.brand} kind={r.kind} />
                        </span>
                        <span className="text-[17px] font-extrabold text-app-deal-ink tabular-nums">
                          {formatDiscount(r.amount)}
                        </span>
                        <span className="text-xs font-semibold text-app-ink-2">{r.label}</span>
                      </span>
                      <span className="w-0 flex-none border-l-2 border-dashed border-app-deal-dash" />
                      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 px-[18px] py-3.5 max-[640px]:px-3.5">
                        <span className="flex min-w-[100px] flex-1 flex-col gap-0.5">
                          <span className="text-base font-extrabold">{formatNumber(r.cost)} điểm</span>
                          <span className="text-[13px] text-app-muted">Vào Ví ngay khi đổi</span>
                        </span>
                        {r.cost <= BALANCE ? (
                          <span className="flex h-10 items-center rounded-app-small bg-app-primary px-[18px] text-sm font-extrabold text-white">
                            Đổi
                          </span>
                        ) : (
                          <span className="whitespace-nowrap text-right text-[13px] font-bold text-app-muted">
                            Thiếu {formatNumber(r.cost - BALANCE)} điểm
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
          </FeatureArt>
        </Feature>
      </Wrap>
    </section>
  );
}
