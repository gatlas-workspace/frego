import Link from 'next/link';
import type { ReactNode } from 'react';
import { cx } from './cx';
import { WebIcon, type AnyIconName } from './WebIcon';

/**
 * Danh sách dòng có đường kẻ mảnh. `divider`: kẻ ở đỉnh mỗi dòng ("Cần xử lý", độ khớp ước tính)
 * hoặc ở đáy mỗi dòng (thành viên, hóa đơn, chiến dịch trong khung chi tiết). `framed` thêm kẻ trên cả danh sách.
 */
export function List({
  children,
  divider = 'bottom',
  framed = false,
  label,
  className,
}: {
  children: ReactNode;
  divider?: 'top' | 'bottom';
  framed?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <ul
      aria-label={label}
      className={cx(
        'm-0 list-none p-0',
        divider === 'top' ? '[&>li]:border-t [&>li]:border-line-soft' : '[&>li]:shadow-soft-b',
        framed && 'border-t border-line',
        className,
      )}
    >
      {children}
    </ul>
  );
}

const padY = { 7: 'py-[7px]', 8: 'py-2', 9: 'py-[9px]', 10: 'py-2.5' } as const;

export type ListRowProps = {
  /** Icon trước dòng (18px xám), hoặc dùng `leading` cho logo/ảnh đại diện. */
  icon?: AnyIconName;
  /** Màu icon: xám (mặc định), cảnh báo (vàng), tốt, xấu. */
  iconTone?: 'muted' | 'warn' | 'good' | 'bad';
  leading?: ReactNode;
  /** Dòng chính 14px (đậm 500 mặc định). */
  title: ReactNode;
  /** Dòng phụ 13px xám. */
  sub?: ReactNode;
  /** Bên phải: <Status>, số, nút nhỏ… */
  trailing?: ReactNode;
  /** Có href → cả dòng là liên kết, kèm mũi tên › ở cuối. */
  href?: string;
  /** Độ đệm dọc (px). */
  padding?: keyof typeof padY;
  /** Dòng chính đậm 500 (mặc định true). */
  strong?: boolean;
  className?: string;
};

const iconToneCls = { muted: 'text-nav-icon', warn: 'text-warn', good: 'text-good', bad: 'text-bad' };

/** Một dòng trong <List>. */
export function ListRow({ icon, iconTone = 'muted', leading, title, sub, trailing, href, padding = 9, strong = true, className }: ListRowProps) {
  const inner = (
    <>
      {icon ? <WebIcon name={icon} size={18} strokeWidth={iconTone === 'muted' ? 1.8 : 2} className={iconToneCls[iconTone]} /> : null}
      {leading}
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className={cx('text-[14px] leading-[1.4]', strong && 'font-medium')}>{title}</span>
        {sub ? <span className="text-[13px] leading-[1.4] text-ink-2">{sub}</span> : null}
      </span>
      {trailing ? <span className="flex flex-none items-center gap-2">{trailing}</span> : null}
      {href ? <WebIcon name="chev" size={16} strokeWidth={2} className="text-nav-icon" /> : null}
    </>
  );
  if (href) {
    return (
      <li className={className}>
        <Link
          href={href}
          className={cx('-mx-1.5 flex items-center gap-2.5 rounded-ctl px-1.5 text-ink no-underline hover:bg-sidebar', padY[padding])}
        >
          {inner}
        </Link>
      </li>
    );
  }
  return <li className={cx('flex items-center gap-2.5', padY[padding], className)}>{inner}</li>;
}

export type QueueItemProps = {
  /** Logo bên trái (thường <BizMark size={32}>). */
  leading?: ReactNode;
  title: ReactNode;
  /** Dòng 2 (13px chữ chính), vd. tên doanh nghiệp. */
  subtitle?: ReactNode;
  /** Dòng 3 (13px xám), vd. "<ProviderMark size={16}/> Green SM xe máy · −15.000đ". */
  meta?: ReactNode;
  /** Góc trên phải, 12px xám, vd. "2 giờ trước". */
  time?: ReactNode;
  /** Dưới thời gian, vd. <Status text="Chờ duyệt" tone="amber" />. */
  status?: ReactNode;
  selected?: boolean;
  /** Liên kết (vd. "?chon=id") — chạy trong Server Component. */
  href?: string;
  /** Hoặc nút (chỉ trong Client Component). */
  onClick?: () => void;
};

/**
 * Mục trong hàng chờ (trang Duyệt): mục đang mở nền xám + vạch xanh bên trái.
 * Đặt trong <ul> (ví dụ <QueueList>) bên trong <Panel padding="sm">.
 */
export function QueueItem({ leading, title, subtitle, meta, time, status, selected = false, href, onClick }: QueueItemProps) {
  const cls = cx(
    'flex w-full items-center gap-2.5 rounded-frame border-0 px-3 py-2.5 text-left text-ink no-underline',
    selected ? 'bg-hover shadow-select' : 'bg-white hover:bg-sidebar',
  );
  const inner = (
    <>
      {leading}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[14px] font-medium">{title}</span>
        {subtitle ? <span className="text-[13px] text-ink">{subtitle}</span> : null}
        {meta ? <span className="flex items-center gap-1.5 text-[13px] text-ink-2">{meta}</span> : null}
      </span>
      {time || status ? (
        <span className="flex flex-none flex-col items-end gap-1">
          {time ? <span className="text-[12px] text-ink-2">{time}</span> : null}
          {status}
        </span>
      ) : null}
    </>
  );
  return (
    <li>
      {href ? (
        <Link href={href} aria-current={selected ? 'true' : undefined} scroll={false} className={cls}>
          {inner}
        </Link>
      ) : (
        <button type="button" aria-pressed={selected} onClick={onClick} className={cx(cls, 'cursor-pointer font-[inherit]')}>
          {inner}
        </button>
      )}
    </li>
  );
}

/** <ul> cho các <QueueItem>, cách nhau 2px. */
export function QueueList({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul aria-label={label} className="m-0 flex list-none flex-col gap-0.5 p-0">
      {children}
    </ul>
  );
}

/** Dòng tệp có viền (giấy tờ đã tải, ảnh mặt tiền, logo): icon + tên + mô tả + thứ bên phải. */
export function FileRow({
  icon = 'receipt',
  leading,
  name,
  meta,
  trailing,
  className,
}: {
  icon?: AnyIconName;
  leading?: ReactNode;
  name: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex items-center gap-2.5 rounded-ctl px-3 py-2.5 shadow-frame', className)}>
      {leading ?? <WebIcon name={icon} size={18} className="text-ink-2" />}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[14px]">{name}</span>
        {meta ? <span className="text-[12px] text-ink-2">{meta}</span> : null}
      </span>
      {trailing}
    </div>
  );
}
