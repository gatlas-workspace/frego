import { brand, formatVnd, serviceShortLabel } from "@frego/core";
import { QrCode, StoreButton } from "./StoreButtons";
import { GlowCircle, Wrap } from "./ui";

/**
 * Khối tải app cuối trang (#tai-app).
 * Điện thoại: bỏ mã QR (không tự quét được màn hình của mình), nút chính là "Dùng ngay trên trình duyệt"
 * (app chưa lên cửa hàng), hai nút cửa hàng xếp đôi gọn một hàng.
 */
export function Download() {
  return (
    <section id="tai-app" aria-labelledby="h-tai-app" className="relative bg-app-surface pb-[104px] pt-6 max-[640px]:pb-16">
      <Wrap>
        <div className="land-on-primary relative flex items-center gap-12 overflow-hidden rounded-[44px] bg-app-primary px-20 py-[72px] max-[900px]:flex-col max-[900px]:items-start max-[900px]:px-7 max-[900px]:py-12 max-[640px]:gap-6 max-[640px]:rounded-[28px] max-[640px]:px-5 max-[640px]:py-9">
          <GlowCircle className="-right-[150px] -top-[190px]" />
          <div className="relative flex min-w-0 flex-1 flex-col gap-[22px] max-[640px]:w-full max-[640px]:gap-4">
            <h2
              id="h-tai-app"
              className="m-0 text-[52px] font-extrabold leading-[1.1] tracking-[-1.4px] text-white max-[640px]:text-[30px] max-[640px]:tracking-[-0.6px]"
            >
              Chuyến tới,
              <br />
              gắn voucher trước khi đặt.
            </h2>
            <p className="m-0 max-w-[560px] text-lg leading-[1.6] text-app-on-primary-soft max-[640px]:text-[15px] max-[640px]:leading-[1.55]">
              Tải {brand.name}, nhập điểm đến đầu tiên và nhận ngay mã {brand.welcomeCode} giảm{" "}
              {formatVnd(brand.welcomeAmount)} cho chuyến {serviceShortLabel("be", "bike")}, dành cho {brand.welcomeQuota} người
              đầu tiên.
            </p>
            {/* Dùng được ngay: app bản web, cài được ra màn hình chính như app. */}
            <a
              href={`${brand.web.appUrl}/dang-nhap`}
              className="flex h-[60px] items-center justify-center gap-2.5 self-start rounded-app-block bg-app-surface px-6 text-[17px] font-extrabold text-app-primary-deep transition-colors hover:bg-app-primary-soft max-[640px]:w-full max-[640px]:self-stretch"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="block flex-none">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.1 3.6 8.5s-1.2 6.2-3.6 8.5c-2.4-2.3-3.6-5.1-3.6-8.5s1.2-6.2 3.6-8.5Z" />
              </svg>
              Dùng ngay trên trình duyệt
            </a>
            <div className="flex flex-wrap items-center gap-3.5 pt-1.5 max-[640px]:grid max-[640px]:grid-cols-2 max-[640px]:gap-2.5 max-[640px]:pt-0">
              <StoreButton platform="ios" variant="ghost" className="max-[640px]:h-[52px] max-[640px]:pl-3 max-[640px]:pr-3" />
              <StoreButton platform="android" variant="ghost" className="max-[640px]:h-[52px] max-[640px]:pl-3 max-[640px]:pr-3" />
            </div>
            <p className="m-0 hidden text-[13px] leading-[1.5] text-app-on-primary-soft max-[640px]:block">
              Mẹo: mở bằng Safari hoặc Chrome rồi chọn &ldquo;Thêm vào màn hình chính&rdquo; để dùng như app.
            </p>
          </div>
          <div className="relative flex flex-none flex-col items-center gap-3 rounded-[28px] bg-app-surface p-[22px] max-[640px]:hidden">
            <QrCode size={164} />
            <span className="text-sm font-bold text-app-ink-2">Quét để tải app</span>
          </div>
        </div>
      </Wrap>
    </section>
  );
}
