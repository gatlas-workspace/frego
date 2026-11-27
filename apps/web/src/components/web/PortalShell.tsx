import type { ReactNode } from 'react';
import { Sidebar, type SidebarProps } from './Sidebar';

/**
 * Khung cổng doanh nghiệp / quản trị: liên kết "Bỏ qua tới nội dung", <Sidebar> 240px bên trái (dính khi cuộn),
 * cột nội dung bên phải. Mỗi trang tự đặt <Topbar> rồi <PageBody>.
 * Màn hẹp (< 900px): thanh bên thành thanh trên cùng có nút menu.
 */
export function PortalShell({ children, ...sidebar }: SidebarProps & { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-white text-ink max-[900px]:flex-col">
      <a
        href="#noi-dung"
        className="sr-only z-[70] rounded-ctl bg-white px-3 py-2 text-[14px] font-medium text-ink shadow-pop focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Bỏ qua tới nội dung
      </a>
      <Sidebar {...sidebar} />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
