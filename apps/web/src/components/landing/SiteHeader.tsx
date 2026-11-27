import Link from "next/link";
import { brand } from "@frego/core";
import { LogoMark, Wrap } from "./ui";

const NAV = [
  { id: "cach-dung", label: "Cách dùng" },
  { id: "voucher", label: "Voucher" },
  { id: "diem-thuong", label: "Điểm thưởng" },
  { id: "cau-hoi", label: "Câu hỏi" },
];

/** Liên kết tới một mục của landing: cùng trang → "#id", trang khác → "/#id". */
export function sectionHref(id: string, onLanding: boolean) {
  return onLanding ? `#${id}` : `/#${id}`;
}

export function NavAnchor({ href, className, children }: { href: string; className: string; children: React.ReactNode }) {
  if (href.startsWith("#")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}


/** Đầu trang: logo, menu mục, Cho doanh nghiệp, Tải app. Dưới 900px menu xuống hàng riêng. */
export function SiteHeader({ onLanding = true }: { onLanding?: boolean }) {
  return (
    <header id="dau-trang" className="bg-app-bg">
      <Wrap className="flex min-h-[84px] flex-wrap items-center gap-x-10 max-[900px]:pb-2 max-[900px]:pt-3">
        <NavAnchor
          href={onLanding ? "#dau-trang" : "/"}
          className="flex min-h-11 items-center gap-2.5 text-app-ink"
        >
          <LogoMark />
          <span className="text-[23px] font-extrabold tracking-[-0.5px]">{brand.name}</span>
          <span className="sr-only">{onLanding ? ", về đầu trang" : ", về trang chủ"}</span>
        </NavAnchor>

        <nav
          aria-label="Mục chính"
          className="flex items-center gap-2 max-[900px]:order-3 max-[900px]:-ml-3 max-[900px]:w-full max-[900px]:flex-wrap"
        >
          {NAV.map((n) => (
            <NavAnchor
              key={n.id}
              href={sectionHref(n.id, onLanding)}
              className="flex min-h-11 items-center rounded-[10px] px-3 text-[15px] font-semibold text-app-ink-2 transition-colors hover:bg-app-alt hover:text-app-ink"
            >
              {n.label}
            </NavAnchor>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <NavAnchor
            href={sectionHref("doanh-nghiep", onLanding)}
            className="flex min-h-11 items-center px-2.5 text-[15px] font-bold text-app-primary hover:text-app-primary-deep"
          >
            Cho doanh nghiệp
          </NavAnchor>
          <NavAnchor
            href={sectionHref("tai-app", onLanding)}
            className="flex h-[46px] items-center rounded-[14px] bg-app-primary px-[22px] text-[15px] font-extrabold text-white transition-colors hover:bg-app-primary-deep"
          >
            Tải app
          </NavAnchor>
        </div>
      </Wrap>
    </header>
  );
}
