'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import type { CategoryKey } from '@frego/core';
import { signOut } from '@/app/dang-nhap/actions';
import { ADMIN_NAV, BIZ_NAV, type AdminNavKey, type BizNavKey } from '@/lib/nav';
import { cx } from './cx';
import { BizMark, FregoMark } from './Marks';
import { NavSearch, type NavSearchItem } from './NavSearch';
import { WebIcon, type AnyIconName } from './WebIcon';

export type SidebarRole = 'biz' | 'admin';

type NavItem = { key: string; label: string; href: string; icon: AnyIconName };
type NavGroup = { group: string; items: NavItem[] };

/** Icon theo thiết kế WebSidebar (khác một vài icon ghi trong lib/nav.ts). */
const DESIGN_ICON: Record<string, AnyIconName> = {
  tongquan: 'home',
  chiendich: 'ticket',
  quangcao: 'camera',
  baocao: 'chart',
  vi: 'wallet',
  hoso: 'brief',
  duyet: 'inbox',
  doanhnghiep: 'brief',
  tien: 'wallet',
  nguoidung: 'user',
  diem: 'gift',
  thongbao: 'bell',
  khoma: 'tag',
  banggia: 'chart',
  doitac: 'link',
  hotro: 'info',
};

/** Nhóm của trang quản trị theo thiết kế: Vận hành · Người dùng · Dữ liệu · Hệ thống (nhãn, href lấy từ ADMIN_NAV). */
const ADMIN_GROUPS: { group: string; keys: AdminNavKey[] }[] = [
  { group: 'Vận hành', keys: ['tongquan', 'duyet', 'doanhnghiep', 'chiendich', 'tien'] },
  { group: 'Người dùng', keys: ['nguoidung', 'diem', 'thongbao'] },
  { group: 'Dữ liệu', keys: ['khoma', 'banggia', 'doitac'] },
  { group: 'Hệ thống', keys: ['hotro'] },
];

function navFor(role: SidebarRole): NavGroup[] {
  if (role === 'biz') {
    return BIZ_NAV.map((g) => ({
      group: g.group,
      items: g.items.map((it) => ({ key: it.key, label: it.label, href: it.href, icon: DESIGN_ICON[it.key] ?? 'home' })),
    }));
  }
  const all = ADMIN_NAV.flatMap((g) => g.items);
  return ADMIN_GROUPS.map((g) => ({
    group: g.group,
    items: g.keys
      .map((k) => all.find((it) => it.key === k))
      .filter((it): it is NonNullable<typeof it> => !!it)
      .map((it) => ({ key: it.key, label: it.label, href: it.href, icon: DESIGN_ICON[it.key] ?? 'home' })),
  }));
}

/** Mục đang mở: href dài nhất trùng đầu đường dẫn (vd. /doanh-nghiep/chien-dich/tao → chiendich). */
export function activeNavKey(role: SidebarRole, pathname: string): string | undefined {
  const items = navFor(role).flatMap((g) => g.items);
  let best: NavItem | undefined;
  for (const it of items) {
    if (pathname === it.href || pathname.startsWith(`${it.href}/`)) {
      if (!best || it.href.length > best.href.length) best = it;
    }
  }
  return best?.key;
}

export type SidebarProps = {
  /** WebSidebar role: biz (cổng doanh nghiệp) | admin (quản trị). */
  role: SidebarRole;
  /** WebSidebar active: key mục đang mở. Bỏ trống → tự tính từ đường dẫn hiện tại. */
  active?: BizNavKey | AdminNavKey;
  /** WebSidebar badge: số mục chờ duyệt, hiện chấm đỏ ở mục "Duyệt" (chỉ quản trị). 0 = ẩn. */
  badge?: number;
  /** Tên doanh nghiệp ở đầu thanh bên (biz). Mặc định "Cà phê Mây" như thiết kế. */
  businessName?: string | null;
  /** Ngành của doanh nghiệp → icon logo đầu thanh bên. Mặc định cafe. */
  businessCategory?: CategoryKey;
  /** Người đang đăng nhập (hiện trong menu đầu thanh bên). */
  account?: { displayName?: string; email?: string };
  /** Bản xem trước trong bảng thành phần: cao theo khung cha, không bắt phím Ctrl K, không có thanh màn hẹp. */
  preview?: boolean;
};

/**
 * Thanh bên (WebSidebar) 240px nền xám: đầu thanh (tên cửa hàng / "Frego · Quản trị", menu tài khoản có Đăng xuất),
 * ô "Tìm kiếm · Ctrl K" (tìm trang), các nhóm menu, dòng chân.
 * Màn hẹp (< 900px): thu thành thanh trên cùng có nút menu, bấm để mở thanh bên đè lên trang.
 */
export function Sidebar({ role, active, badge = 0, businessName, businessCategory = 'cafe', account, preview = false }: SidebarProps) {
  const pathname = usePathname() ?? '';
  const groups = navFor(role);
  const current = active ?? activeNavKey(role, pathname);
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const title = role === 'admin' ? 'Frego · Quản trị' : (businessName ?? 'Cà phê Mây');
  const footer = role === 'admin' ? 'Quản trị hệ thống Frego' : 'Cổng doanh nghiệp Frego';
  const mark = role === 'admin' ? <FregoMark size={20} /> : <BizMark category={businessCategory} size={20} />;

  // Ctrl K / ⌘K mở ô tìm; Esc đóng menu tài khoản và thanh bên trên màn hẹp.
  useEffect(() => {
    if (preview) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setMenuOpen(false);
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [preview]);

  // Bấm ra ngoài thì đóng menu tài khoản.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const searchItems: NavSearchItem[] = groups.flatMap((g) =>
    g.items.map((it) => ({ label: it.label, href: it.href, group: g.group, icon: it.icon })),
  );

  return (
    <>
      {/* Thanh trên cùng trên màn hẹp */}
      {preview ? null : (
        <div className="sticky top-0 z-40 flex h-12 flex-none items-center gap-1.5 bg-sidebar px-1 text-ink shadow-soft-b min-[900px]:hidden">
          <button
            type="button"
            aria-expanded={open}
            aria-controls="thanh-ben"
            aria-label={open ? 'Đóng menu' : role === 'admin' && badge > 0 ? `Mở menu, ${badge} mục chờ duyệt` : 'Mở menu'}
            onClick={() => setOpen((v) => !v)}
            className="relative flex size-11 cursor-pointer items-center justify-center rounded-frame border-0 bg-transparent text-ink hover:bg-hover"
          >
            <WebIcon name={open ? 'x' : 'menu'} size={20} />
            {role === 'admin' && badge > 0 && !open ? (
              <span aria-hidden="true" className="absolute right-2 top-2 size-2 rounded-full bg-badge" />
            ) : null}
          </button>
          {mark}
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{title}</span>
          <button
            type="button"
            aria-label="Tìm kiếm"
            onClick={() => setSearchOpen(true)}
            className="flex size-11 cursor-pointer items-center justify-center rounded-frame border-0 bg-transparent text-nav-ink hover:bg-hover"
          >
            <WebIcon name="search" size={18} />
          </button>
        </div>
      )}
      {open ? (
        <button
          type="button"
          aria-label="Đóng menu"
          tabIndex={-1}
          onClick={() => setOpen(false)}
          className="fixed inset-0 top-12 z-30 cursor-default border-0 bg-overlay min-[900px]:hidden"
        />
      ) : null}

      <nav
        id={preview ? undefined : 'thanh-ben'}
        aria-label="Điều hướng chính"
        className={cx(
          'flex w-60 flex-none flex-col bg-sidebar px-1.5 pb-2.5 pt-1.5 text-ink shadow-sidebar',
          preview ? 'h-full' : 'min-[900px]:sticky min-[900px]:top-0 min-[900px]:h-screen min-[900px]:overflow-y-auto',
          preview ? '' : open
            ? 'max-[900px]:fixed max-[900px]:bottom-0 max-[900px]:left-0 max-[900px]:top-12 max-[900px]:z-40 max-[900px]:w-[min(280px,85vw)] max-[900px]:overflow-y-auto max-[900px]:shadow-pop'
            : 'max-[900px]:hidden',
        )}
      >
        {/* Đầu thanh: tên + menu tài khoản */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-frame border-0 bg-transparent px-2.5 text-left text-ink hover:bg-hover"
          >
            {mark}
            <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">{title}</span>
            <WebIcon name="caret" size={14} strokeWidth={2} className="text-nav-icon" />
            <span className="sr-only">: tài khoản</span>
          </button>
          {menuOpen ? (
            <div id={menuId} className="absolute inset-x-0 top-[40px] z-50 rounded-frame bg-white p-1 shadow-pop">
              {account?.email || account?.displayName ? (
                <div className="flex flex-col gap-px px-2 pb-2 pt-1.5">
                  <span className="text-[12px] text-ink-2">Đang đăng nhập</span>
                  {account.displayName ? <span className="truncate text-[14px] font-medium">{account.displayName}</span> : null}
                  {account.email ? <span className="truncate text-[13px] text-ink-2">{account.email}</span> : null}
                </div>
              ) : null}
              <form action={signOut} className="border-t border-line pt-1">
                <button
                  type="submit"
                  className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-ctl border-0 bg-transparent px-2 text-left text-[14px] text-ink hover:bg-hover"
                >
                  <WebIcon name="logout" size={16} className="text-ink-2" />
                  Đăng xuất
                </button>
              </form>
            </div>
          ) : null}
        </div>

        {/* Tìm kiếm · Ctrl K */}
        <div className="mb-1.5 mt-1 flex flex-col gap-px">
          <button
            type="button"
            aria-keyshortcuts="Control+K"
            onClick={() => setSearchOpen(true)}
            className="flex h-7 cursor-pointer items-center gap-2 rounded-frame border-0 bg-transparent pl-2.5 pr-2 text-left text-[14px] font-medium text-nav-ink hover:bg-hover"
          >
            <WebIcon name="search" size={18} className="text-nav-icon" />
            <span className="flex-1">Tìm kiếm</span>
            <span aria-hidden="true" className="text-[11px] font-normal text-muted">
              Ctrl K
            </span>
          </button>
        </div>

        {groups.map((g) => (
          <div key={g.group} className="mb-1.5 flex flex-col gap-px">
            <span className="flex h-7 items-center px-2.5 text-[12px] font-medium text-muted">{g.group}</span>
            <ul className="m-0 flex list-none flex-col gap-px p-0">
              {g.items.map((it) => {
                const on = it.key === current;
                return (
                  <li key={it.key}>
                    <Link
                      href={it.href}
                      aria-current={on ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                      className={cx(
                        'flex h-7 items-center gap-2 rounded-frame pl-2.5 pr-2 text-[14px] font-medium no-underline max-[900px]:h-9',
                        on ? 'bg-nav-active text-ink' : 'text-nav-ink hover:bg-hover',
                      )}
                    >
                      <WebIcon name={it.icon} size={18} className={on ? 'text-ink' : 'text-nav-icon'} />
                      <span className="min-w-0 flex-1 truncate">{it.label}</span>
                      {it.key === 'duyet' && role === 'admin' && badge > 0 ? (
                        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] bg-badge px-[5px] text-[11px] font-semibold text-white">
                          {badge}
                          <span className="sr-only"> mục chờ duyệt</span>
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="mt-auto px-2.5 py-2 text-[12px] leading-[1.45] text-muted">{footer}</div>
      </nav>

      {searchOpen ? <NavSearch items={searchItems} onClose={() => setSearchOpen(false)} /> : null}
    </>
  );
}
