'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cx } from './cx';
import { WebIcon } from './WebIcon';

export type DrawerProps = {
  /** Đang mở. Trang server thường tính từ searchParams (vd. ?them=1). */
  open: boolean;
  /** Tiêu đề 15px đậm 600 ở đầu khung. */
  title: ReactNode;
  /** Đóng bằng liên kết (Server Component): href của trang khi đóng, vd. "/quan-tri/kho-ma". */
  closeHref?: string;
  /** Hoặc đóng bằng hàm (Client Component). */
  onClose?: () => void;
  /** Hàng nút cuối khung (Hủy, Lưu…), canh phải, kẻ trên. */
  footer?: ReactNode;
  /** Bề rộng px (thiết kế 440). */
  width?: number;
  children: ReactNode;
};

/**
 * Khung trượt từ phải (form "Thêm mã công khai"): lớp phủ mờ, role="dialog" aria-modal,
 * nhận focus khi mở, Esc hoặc bấm lớp phủ để đóng. Nội dung (kể cả <form action={serverAction}>) truyền qua children.
 */
export function Drawer({ open, title, closeHref, onClose, footer, width = 440, children }: DrawerProps) {
  const router = useRouter();
  const panel = useRef<HTMLElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const close = () => {
      if (onClose) onClose();
      else if (closeHref) router.push(closeHref, { scroll: false });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open, onClose, closeHref, router]);

  if (!open) return null;

  const closeIcon = <WebIcon name="x" size={18} strokeWidth={2} />;
  const closeBtnCls =
    'flex size-7 cursor-pointer items-center justify-center rounded-frame border-0 bg-transparent text-ink-2 hover:bg-hover hover:text-ink';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {closeHref ? (
        <Link href={closeHref} scroll={false} aria-label="Đóng" tabIndex={-1} className="absolute inset-0 bg-overlay" />
      ) : (
        <button type="button" aria-label="Đóng" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-pointer border-0 bg-overlay" />
      )}
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex h-full max-w-full flex-col border-l border-line bg-white shadow-drawer outline-none"
        style={{ width }}
      >
        <div className="flex h-11 flex-none items-center justify-between border-b border-line pl-5 pr-3">
          <h2 id={titleId} className="m-0 text-[15px] font-semibold">
            {title}
          </h2>
          {closeHref ? (
            <Link href={closeHref} scroll={false} aria-label="Đóng" className={closeBtnCls}>
              {closeIcon}
            </Link>
          ) : (
            <button type="button" aria-label="Đóng" onClick={onClose} className={closeBtnCls}>
              {closeIcon}
            </button>
          )}
        </div>
        <div className={cx('flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5')}>{children}</div>
        {footer ? <div className="flex flex-none justify-end gap-2 border-t border-line px-5 py-3">{footer}</div> : null}
      </section>
    </div>
  );
}
