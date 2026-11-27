import Link from 'next/link';
import type { ReactNode } from 'react';
import { ADMIN_NAV, BIZ_NAV } from '@/lib/nav';
import { cx } from './cx';
import { WebIcon } from './WebIcon';

export type Crumb = { label: string; href?: string };

/**
 * Tự gắn liên kết cho đường dẫn dạng chuỗi "A / B / C":
 * - phần đầu ("Frego" → /quan-tri, tên doanh nghiệp → /doanh-nghiep);
 * - phần giữa trùng nhãn menu thanh bên → href của mục đó;
 * - phần cuối là trang hiện tại (không có liên kết).
 */
export function parseCrumbs(crumbs: string): Crumb[] {
  const parts = crumbs
    .split(' / ')
    .map((s) => s.trim())
    .filter(Boolean);
  const admin = parts[0] === 'Frego';
  const nav: { label: string; href: string }[] = admin
    ? ADMIN_NAV.flatMap((g) => g.items)
    : BIZ_NAV.flatMap((g) => g.items);
  return parts.map((label, i) => {
    if (i === parts.length - 1) return { label };
    if (i === 0) return { label, href: admin ? '/quan-tri' : '/doanh-nghiep' };
    return { label, href: nav.find((it) => it.label === label)?.href };
  });
}

export type TopbarProps = {
  /** WebTopbar crumbs: "Cà phê Mây / Chiến dịch / Tạo chiến dịch" hoặc mảng {label, href}. */
  crumbs: string | Crumb[];
  /** WebTopbar note: chữ xám bên phải, vd. "Cập nhật 10 phút trước". */
  note?: ReactNode;
  /** Thao tác bên phải. Mặc định: "Chia sẻ", ngôi sao, dấu ba chấm chỉ để trang trí như thiết kế (aria-hidden). */
  actions?: ReactNode;
  /** false = ẩn cụm trang trí mặc định. */
  decor?: boolean;
  className?: string;
};

/** Thanh trên cùng của trang (WebTopbar): đường dẫn, ghi chú, thao tác chung. Cao 45px, dính trên khi cuộn (màn rộng). */
export function Topbar({ crumbs, note, actions, decor = true, className }: TopbarProps) {
  const list = typeof crumbs === 'string' ? parseCrumbs(crumbs) : crumbs;
  return (
    <header
      className={cx(
        'z-20 flex h-[45px] w-full flex-none items-center gap-1 bg-white px-3 text-ink min-[900px]:sticky min-[900px]:top-0',
        className,
      )}
    >
      <nav aria-label="Vị trí" className="min-w-0 flex-1">
        <ol className="m-0 flex min-w-0 list-none items-center gap-0.5 p-0 text-[14px]">
          {list.map((c, i) => {
            const last = i === list.length - 1;
            const middle = i > 0 && !last;
            return (
              <li
                key={`${i}-${c.label}`}
                className={cx(
                  'flex min-w-0 items-center gap-0.5',
                  last ? 'flex-shrink' : 'flex-none',
                  middle && 'max-[600px]:hidden',
                )}
              >
                {i > 0 ? (
                  <span aria-hidden="true" className="flex-none px-0.5 text-faint">
                    /
                  </span>
                ) : null}
                {last ? (
                  <span aria-current="page" className="block truncate rounded-ctl px-1.5 py-0.5 text-ink">
                    {c.label}
                  </span>
                ) : c.href ? (
                  <Link
                    href={c.href}
                    className="block whitespace-nowrap rounded-ctl px-1.5 py-0.5 text-ink-2 no-underline hover:bg-hover hover:text-ink"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span className="block whitespace-nowrap rounded-ctl px-1.5 py-0.5 text-ink-2">{c.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {note ? <span className="whitespace-nowrap px-2 text-[14px] text-ink-2 max-[600px]:hidden">{note}</span> : null}
      {actions ??
        (decor ? (
          <span aria-hidden="true" className="flex items-center gap-1 max-[600px]:hidden">
            <span className="flex h-7 items-center rounded-ctl px-2 text-[14px] text-ink">Chia sẻ</span>
            <span className="flex size-7 flex-none items-center justify-center rounded-ctl text-ink-2">
              <WebIcon name="star" size={18} />
            </span>
            <span className="flex size-7 flex-none items-center justify-center rounded-ctl text-ink-2">
              <WebIcon name="dots" size={18} />
            </span>
          </span>
        ) : null)}
    </header>
  );
}
