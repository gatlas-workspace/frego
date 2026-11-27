import { brand, PROVIDER_ORDER, PROVIDERS } from "@frego/core";
import { BUSINESS_LOGIN_HREF, BUSINESS_SIGNUP_HREF } from "./ForBusiness";
import { NavAnchor, sectionHref } from "./SiteHeader";
import { LogoMark, Wrap } from "./ui";

export const PRIVACY_HREF = "/quyen-rieng-tu";
export const TERMS_HREF = "/dieu-khoan";

const linkClass = "flex min-h-11 items-center text-[15px] text-app-ink-2 transition-colors hover:text-app-ink";

function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

/** Chân trang: giới thiệu ngắn, 3 cột liên kết, tên công ty + hotline, ghi chú thương hiệu. */
export function SiteFooter({ onLanding = true }: { onLanding?: boolean }) {
  const s = (id: string) => sectionHref(id, onLanding);
  const columns = [
    {
      id: "san-pham",
      title: "Sản phẩm",
      links: [
        { href: s("cach-dung"), label: "Cách dùng" },
        { href: s("voucher"), label: "Voucher tài trợ" },
        { href: s("ma-cong-khai"), label: "Mã công khai" },
        { href: s("diem-thuong"), label: "Điểm thưởng" },
      ],
    },
    {
      id: "doanh-nghiep",
      title: "Doanh nghiệp",
      links: [
        { href: BUSINESS_SIGNUP_HREF, label: "Đăng ký doanh nghiệp" },
        { href: BUSINESS_LOGIN_HREF, label: "Cổng doanh nghiệp" },
        { href: s("doanh-nghiep"), label: "Cách tính phí" },
      ],
    },
    {
      id: "ho-tro",
      title: "Hỗ trợ",
      links: [
        { href: s("cau-hoi"), label: "Câu hỏi thường gặp" },
        { href: s("rieng-tu"), label: "Quyền riêng tư" },
        { href: PRIVACY_HREF, label: "Chính sách dữ liệu" },
        { href: TERMS_HREF, label: "Điều khoản sử dụng" },
        { href: s("tai-app"), label: "Tải app" },
      ],
    },
  ];
  const providers = PROVIDER_ORDER.map((p) => PROVIDERS[p].name).join(", ");

  return (
    <footer className="bg-app-bg shadow-app-line-top">
      <Wrap className="flex flex-col gap-8 pb-10 pt-14">
        <div className="flex flex-wrap gap-20 max-[900px]:gap-10">
          <div className="flex flex-[1_1_300px] flex-col gap-3.5">
            <span className="flex items-center gap-2.5">
              <LogoMark size={32} />
              <span className="text-[22px] font-extrabold tracking-[-0.5px]">{brand.name}</span>
            </span>
            <p className="m-0 max-w-[340px] text-[15px] leading-[1.6] text-app-ink-2">
              Voucher đặt xe cho {providers}. Gắn voucher trước, so giá sau.
            </p>
            <p className="m-0 flex flex-col text-sm leading-[1.6] text-app-ink-2">
              <span className="font-bold text-app-ink">{brand.company.legalName}</span>
              <span>
                Hotline{" "}
                <a
                  href={telHref(brand.company.hotline)}
                  className="inline-flex min-h-11 items-center font-bold text-app-primary underline-offset-2 hover:underline"
                >
                  {brand.company.hotline}
                </a>
              </span>
            </p>
          </div>
          {columns.map((c) => (
            <nav key={c.id} aria-labelledby={`chan-trang-${c.id}`} className="flex flex-col">
              <h3 id={`chan-trang-${c.id}`} className="mb-1.5 mt-0 text-sm font-extrabold text-app-ink">
                {c.title}
              </h3>
              {c.links.map((l) => (
                <NavAnchor key={l.label} href={l.href} className={linkClass}>
                  {l.label}
                </NavAnchor>
              ))}
            </nav>
          ))}
        </div>
        <div className="flex justify-between gap-6 pt-6 text-[13px] leading-[1.5] text-app-muted shadow-app-line-top max-[900px]:flex-col">
          <span>
            © {new Date().getFullYear()} {brand.name}
          </span>
          <span>
            {providers} là thương hiệu của các công ty tương ứng. {brand.name} không thuộc các hãng xe này.
          </span>
        </div>
      </Wrap>
    </footer>
  );
}
