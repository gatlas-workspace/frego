import {
  brand,
  formatDiscount,
  formatKm,
  formatVnd,
  formatVndRange,
  POINTS_RULES,
  PROVIDER_ORDER,
  PROVIDERS,
  SERVICES,
} from "@frego/core";
import { Icon } from "@/components/Icon";
import { PriceRow, ProviderLogo, PushNotif, type PriceRowData } from "@/components/app";
import { QrCode, StoreButton } from "./StoreButtons";
import { Wrap } from "./ui";

export const PROVIDER_NAMES = PROVIDER_ORDER.map((p) => PROVIDERS[p].name).join(", ");

// Ví dụ Landmark 81 → Chợ Bến Thành giờ cao điểm: Be xe máy 31.000–36.000đ trước mã chào mừng.
const BE_FINAL = formatVndRange(31000 - brand.welcomeAmount, 36000 - brand.welcomeAmount);
const GRAB_FINAL = formatVndRange(25000, 30000);

/** Dữ liệu mẫu màn So giá trong điện thoại (heroRows của thiết kế). */
const HERO_ROWS: PriceRowData[] = [
  {
    key: "be",
    name: PROVIDERS.be.name,
    service: SERVICES["be-bike"].name,
    final: BE_FINAL,
    base: formatVndRange(31000, 36000),
    voucherText: `Đã gắn ${brand.welcomeCode}, giảm ${formatVnd(brand.welcomeAmount)}`,
    priced: true,
    kind: "bike",
  },
  {
    key: "grab",
    name: PROVIDERS.grab.name,
    service: SERVICES["grab-bike"].name,
    final: GRAB_FINAL,
    base: formatVndRange(35000, 40000),
    voucherText: `Đã gắn mã Quán bún Ngõ Nhỏ, giảm ${formatVnd(10000)}`,
    priced: true,
    kind: "bike",
  },
  {
    key: "gsm",
    name: PROVIDERS.gsm.name,
    service: SERVICES["gsm-bike"].name,
    priced: false,
    autoNote: PROVIDERS.gsm.autoPromo?.note,
    kind: "bike",
  },
];

function Chip({ active = false, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`flex h-[38px] items-center rounded-[19px] px-4 text-sm font-bold ${
        active ? "bg-app-primary text-white" : "bg-app-surface text-app-ink-2 shadow-app-ring-chip"
      }`}
    >
      {children}
    </span>
  );
}

/** Khung điện thoại hiển thị màn "So giá sau voucher" (390 × 844 thu về 0,7795). */
function HeroPhone() {
  return (
    <div
      role="img"
      aria-label={`Màn hình So giá sau voucher của app ${brand.name}: Be xe máy còn ${BE_FINAL} sau mã ${brand.welcomeCode}, Grab xe máy còn ${GRAB_FINAL}`}
      className="absolute left-1/2 top-[-26px] -ml-[162px] box-border h-[678px] w-[324px] rounded-[54px] bg-app-ink p-2.5 shadow-app-phone"
    >
      <div aria-hidden="true" className="relative h-[658px] w-[304px] overflow-hidden rounded-[44px] bg-app-bg">
        <div className="box-border flex h-[844px] w-[390px] origin-top-left flex-col gap-3.5 bg-app-bg px-5 pt-[54px] [transform:scale(0.7795)]">
          <div className="-ml-1.5 flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-app-surface text-app-ink shadow-app-soft">
              <Icon name="back" size={20} strokeWidth={2.2} />
            </span>
            <span className="text-xl font-extrabold tracking-[-0.3px]">So giá sau voucher</span>
          </div>

          <div className="flex flex-col gap-2.5 rounded-app-ticket bg-app-surface px-4 py-3.5 shadow-app-card">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 flex-none items-center justify-center rounded-full bg-app-alt text-app-ink-2">
                <Icon name="pin" size={16} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-bold">Landmark 81</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 flex-none items-center justify-center rounded-full bg-app-primary-soft text-app-primary">
                <Icon name="pinok" size={16} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-bold">Chợ Bến Thành</span>
            </div>
            <span className="text-[13px] text-app-muted">{formatKm(5.8)} · khoảng 20 phút · đã gắn 2 voucher</span>
          </div>

          <div className="flex gap-2">
            <Chip active>Xe máy</Chip>
            <Chip>Ô tô 4 chỗ</Chip>
            <Chip>6–7 chỗ</Chip>
          </div>

          <div className="flex flex-col gap-3">
            {HERO_ROWS.map((r) => (
              <PriceRow key={r.key} row={r} />
            ))}
          </div>

          <span className="text-center text-xs leading-[1.45] text-app-muted">Giá ước tính. Giá cuối cùng theo app hãng.</span>
        </div>
        <span className="absolute left-1/2 top-2.5 -ml-12 h-[26px] w-24 rounded-[13px] bg-app-ink" />
      </div>
    </div>
  );
}

function HeroArt() {
  return (
    <div className="relative mt-2 h-[600px] flex-[0_0_540px] rounded-[40px] bg-app-primary max-[1100px]:mx-auto max-[1100px]:w-full max-[1100px]:max-w-[540px] max-[1100px]:flex-none max-[640px]:h-[560px]">
      <div className="absolute bottom-0 left-0 right-0 top-0 overflow-hidden rounded-[40px]">
        <svg
          viewBox="0 0 540 600"
          width="540"
          height="600"
          preserveAspectRatio="xMaxYMin slice"
          aria-hidden="true"
          className="absolute left-0 top-0 block h-full w-full"
        >
          <circle cx="520" cy="40" r="170" className="fill-app-glow" />
          <circle cx="40" cy="600" r="150" className="fill-app-glow-2" />
        </svg>
      </div>

      <HeroPhone />

      <div aria-hidden="true" className="absolute -left-10 top-[430px] w-[270px] [transform:rotate(-3deg)] max-[640px]:hidden">
        <PushNotif
          title={`Chuyến Be với mã ${brand.welcomeCode} thế nào?`}
          body={`Chuyến Be xe máy tới Chợ Bến Thành. Chạm để báo giá, nhận ${POINTS_RULES.tap} điểm.`}
          time="vừa xong"
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute -right-9 top-[118px] flex items-center gap-3 rounded-[20px] bg-app-surface py-3.5 pl-3.5 pr-[18px] shadow-app-card [transform:rotate(3deg)] max-[640px]:hidden"
      >
        <span className="flex size-11 items-center justify-center rounded-[14px] bg-app-deal text-app-deal-ink">
          <Icon name="ticket" size={24} strokeWidth={1.9} />
        </span>
        <span className="flex flex-col gap-px">
          <span className="text-[13px] font-semibold text-app-muted">Đã trừ mã</span>
          <span className="text-xl font-extrabold text-app-deal-ink tabular-nums">{formatDiscount(brand.welcomeAmount)}</span>
        </span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="h-hero" className="relative bg-app-bg pb-[120px] pt-10">
      <Wrap>
        <div className="flex items-start justify-between gap-10 max-[1100px]:flex-col max-[1100px]:items-stretch">
          <div className="flex min-w-0 flex-[0_1_620px] flex-col gap-7 pt-9 max-[1100px]:flex-none">
            <span className="flex min-h-9 items-center gap-2 self-start rounded-[18px] bg-app-surface py-1 pl-1.5 pr-3.5 text-sm font-bold text-app-ink-2 shadow-app-soft">
              <span className="flex h-6 flex-none items-center rounded-xl bg-app-primary-soft px-2.5 text-xs font-extrabold text-app-primary-deep">
                Miễn phí
              </span>
              Voucher đặt xe cho {PROVIDER_NAMES}
            </span>

            <h1
              id="h-hero"
              className="m-0 text-[62px] font-extrabold leading-[1.08] tracking-[-1.8px] max-[640px]:text-[36px]"
            >
              Gắn voucher trước,
              <br />
              <span className="text-app-primary">so giá sau.</span>
            </h1>

            <p className="m-0 max-w-[560px] text-[19px] leading-[1.6] text-app-ink-2">
              {brand.name} tìm mã giảm giá hợp với chuyến của bạn: mã của quán gần nơi bạn đến, của hãng xe và theo
              thẻ, ví bạn dùng. Rồi so giá đã trừ mã để bạn chọn chuyến rẻ nhất.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <StoreButton platform="ios" variant="dark" />
              <StoreButton platform="android" variant="light" />
              <div className="flex items-center gap-3 rounded-app-block bg-app-surface py-2 pl-2 pr-3.5 shadow-app-soft">
                <QrCode size={60} />
                <span className="text-[13px] font-bold leading-[1.35] text-app-ink-2">
                  Quét mã
                  <br />
                  để tải app
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <span className="flex gap-1.5">
                {PROVIDER_ORDER.map((p) => (
                  <ProviderLogo
                    key={p}
                    provider={p}
                    size={40}
                    className="rounded-app-small border-2 border-white shadow-app-brand"
                  />
                ))}
              </span>
              <span className="text-[15px] leading-[1.5] text-app-ink-2">
                Dùng với app {PROVIDER_NAMES} bạn đang có.
                <br />
                Kèm mã từ ngân hàng và ví điện tử.
              </span>
            </div>
          </div>

          <HeroArt />
        </div>
      </Wrap>
    </section>
  );
}
