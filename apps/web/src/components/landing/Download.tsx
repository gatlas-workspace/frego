import { brand, formatVnd, serviceShortLabel } from "@frego/core";
import { QrCode, StoreButton } from "./StoreButtons";
import { GlowCircle, Wrap } from "./ui";

/** Khối tải app cuối trang (#tai-app). */
export function Download() {
  return (
    <section id="tai-app" aria-labelledby="h-tai-app" className="relative bg-app-surface pb-[104px] pt-6">
      <Wrap>
        <div className="land-on-primary relative flex items-center gap-12 overflow-hidden rounded-[44px] bg-app-primary px-20 py-[72px] max-[900px]:flex-col max-[900px]:items-start max-[900px]:px-7 max-[900px]:py-12">
          <GlowCircle className="-right-[150px] -top-[190px]" />
          <div className="relative flex min-w-0 flex-1 flex-col gap-[22px]">
            <h2
              id="h-tai-app"
              className="m-0 text-[52px] font-extrabold leading-[1.1] tracking-[-1.4px] text-white max-[640px]:text-[34px]"
            >
              Chuyến tới,
              <br />
              gắn voucher trước khi đặt.
            </h2>
            <p className="m-0 max-w-[560px] text-lg leading-[1.6] text-app-on-primary-soft">
              Tải {brand.name}, nhập điểm đến đầu tiên và nhận ngay mã {brand.welcomeCode} giảm{" "}
              {formatVnd(brand.welcomeAmount)} cho chuyến {serviceShortLabel("be", "bike")}, dành cho {brand.welcomeQuota} người
              đầu tiên.
            </p>
            <div className="flex flex-wrap items-center gap-3.5 pt-1.5">
              <StoreButton platform="ios" variant="white" />
              <StoreButton platform="android" variant="ghost" />
            </div>
          </div>
          <div className="relative flex flex-none flex-col items-center gap-3 rounded-[28px] bg-app-surface p-[22px]">
            <QrCode size={164} />
            <span className="text-sm font-bold text-app-ink-2">Quét để tải app</span>
          </div>
        </div>
      </Wrap>
    </section>
  );
}
