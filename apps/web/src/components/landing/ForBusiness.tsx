import Link from "next/link";
import { brand, formatNumber, formatVnd } from "@frego/core";
import { MerchantLogo } from "@/components/app";
import { CheckList, Eyebrow, H2, Lead, SEC, Wrap } from "./ui";

/** Đường dẫn cổng doanh nghiệp (ghi chú thiết kế: Đăng ký → màn đăng ký của Web quản lý). */
export const BUSINESS_SIGNUP_HREF = "/doanh-nghiep/dang-ky";
export const BUSINESS_LOGIN_HREF = "/dang-nhap";

/** Số mã dùng mỗi ngày của chiến dịch mẫu; cột nổi bật là ngày cao nhất. */
const DAILY = [46, 50, 46, 55, 46, 63, 80, 76, 46, 50, 55, 59, 67, 88, 80, 46, 55, 50, 46, 55, 80, 71];
const PEAK = DAILY.indexOf(Math.max(...DAILY));

const USED = 312;
const STATS = [
  { label: "Mã đã tặng", value: formatNumber(980) },
  { label: "Mã đã dùng", value: formatNumber(USED) },
  { label: "Đã chi", value: formatVnd(USED * (20000 + brand.serviceFeePerCode)) },
];

/** Mục cho quán và cửa hàng (#doanh-nghiep). */
export function ForBusiness() {
  return (
    <section id="doanh-nghiep" aria-labelledby="h-doanh-nghiep" className={`${SEC} bg-app-bg`}>
      <Wrap>
        <div className="flex items-center gap-16 rounded-[40px] bg-app-deal p-16 max-[1100px]:flex-col max-[1100px]:items-stretch max-[640px]:px-5 max-[640px]:py-7">
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <Eyebrow tone="deal">Cho quán và cửa hàng</Eyebrow>
            <H2 id="h-doanh-nghiep">Đưa khách đặt xe tới quán của bạn</H2>
            <Lead>
              Tặng mã giảm giá cho người hay đi gần quán. Bạn chọn hãng xe, mức giảm, vùng và khung giờ, {brand.name} duyệt
              rồi tặng mã. Chỉ trả khi mã được dùng: giá trị giảm cộng {formatVnd(brand.serviceFeePerCode)} phí dịch vụ.
            </Lead>
            <CheckList
              tone="deal"
              items={[
                `Nạp ví trước, ${brand.name} trừ mỗi ngày cho mã đã dùng hôm trước`,
                "Báo cáo chuyến đến theo ngày, hãng xe và khung giờ",
                "Tạm dừng hoặc tăng ngân sách bất cứ lúc nào",
              ]}
            />
            <div className="flex flex-wrap gap-3 pt-1.5">
              <Link
                href={BUSINESS_SIGNUP_HREF}
                className="flex h-[54px] items-center rounded-[15px] bg-app-ink px-6 text-base font-extrabold text-white transition-colors hover:bg-app-ink-2"
              >
                Đăng ký doanh nghiệp
              </Link>
              <Link
                href={BUSINESS_LOGIN_HREF}
                className="flex h-[54px] items-center rounded-[15px] bg-app-surface px-[22px] text-base font-extrabold text-app-ink transition-colors hover:bg-app-alt"
              >
                Xem cổng doanh nghiệp
              </Link>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="flex min-w-0 flex-[0_0_480px] flex-col gap-[18px] rounded-[28px] bg-app-surface px-7 py-[26px] shadow-app-biz max-[1100px]:w-full max-[1100px]:max-w-[520px] max-[1100px]:flex-none"
          >
            <div className="flex items-center gap-3">
              <MerchantLogo logo="cup" size={44} radius={13} iconSize={24} strokeWidth={1.7} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-base font-extrabold">Cà phê Mây</span>
                <span className="text-[13px] text-app-muted">Chiến dịch tháng 11</span>
              </span>
              <span className="rounded-full bg-app-live px-2.5 py-1 text-xs font-extrabold text-app-live-ink">Đang chạy</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {STATS.map((s) => (
                <span key={s.label} className="flex flex-[1_1_110px] flex-col gap-0.5 rounded-app-block bg-app-bg px-3.5 py-3">
                  <span className="text-xs text-app-muted">{s.label}</span>
                  <span className="text-xl font-extrabold tabular-nums">{s.value}</span>
                </span>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-bold text-app-muted">Mã được dùng mỗi ngày</span>
              <div className="flex h-24 items-end gap-[5px]">
                {DAILY.map((h, i) => (
                  <span
                    key={i}
                    className={`flex-1 rounded-t-[3px] ${i === PEAK ? "bg-app-primary" : "bg-app-bar"}`}
                    style={{ height: h }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Wrap>
    </section>
  );
}
