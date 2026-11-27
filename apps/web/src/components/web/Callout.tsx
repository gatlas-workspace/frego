import Link from 'next/link';
import type { ReactNode } from 'react';
import { cx } from './cx';
import { WebIcon, type AnyIconName } from './WebIcon';

/** grey = giải thích, amber = cảnh báo, green = xong, blue = thông tin, red = lỗi; subtle = nền thanh bên (#F7F7F5). */
export type CalloutTone = 'grey' | 'subtle' | 'amber' | 'green' | 'blue' | 'red';
/** Màu icon khi muốn khác màu mặc định của tone (vd. icon xanh lá trên nền subtle). */
export type CalloutIconColor = 'muted' | 'good' | 'bad' | 'warn' | 'info';

const toneBg: Record<CalloutTone, string> = {
  grey: 'bg-grey',
  subtle: 'bg-sidebar',
  amber: 'bg-callout-amber',
  green: 'bg-callout-green',
  blue: 'bg-blue-soft',
  red: 'bg-callout-red',
};
const toneIcon: Record<CalloutTone, CalloutIconColor> = {
  grey: 'muted',
  subtle: 'muted',
  amber: 'warn',
  green: 'good',
  blue: 'info',
  red: 'bad',
};
const iconColor: Record<CalloutIconColor, string> = {
  muted: 'text-ink-2',
  good: 'text-good',
  bad: 'text-bad',
  warn: 'text-warn',
  info: 'text-info',
};

export type CalloutProps = {
  /** WebCallout text. Cần chữ đậm hoặc liên kết bên trong → dùng children. */
  text?: ReactNode;
  children?: ReactNode;
  /** WebCallout tone: grey | amber | green | blue | red (+ subtle). Mặc định grey. */
  tone?: CalloutTone;
  /** WebCallout icon: info | check | clock | wallet | x, hoặc tên icon bất kỳ; null = không icon. Mặc định info. */
  icon?: AnyIconName | null;
  iconColor?: CalloutIconColor;
  /** Có href → cả khối là liên kết, bên phải hiện `action` + mũi tên (như thẻ "Đang chạy: …" ở trang Chiến dịch). */
  href?: string;
  action?: ReactNode;
  /** role="status" cho thông báo vừa xong (đọc ngay), "alert" cho lỗi. */
  role?: 'status' | 'alert';
  className?: string;
};

/** Khối ghi chú (WebCallout): nền màu nhạt, icon 18px, chữ 14px. */
export function Callout({
  text,
  children,
  tone = 'grey',
  icon = 'info',
  iconColor: ic,
  href,
  action,
  role,
  className,
}: CalloutProps) {
  const color = iconColor[ic ?? toneIcon[tone]];
  const body = text ?? children;
  if (href) {
    return (
      <Link
        href={href}
        className={cx(
          'flex items-center gap-2.5 rounded-ctl px-3.5 py-3 text-ink no-underline transition-[filter] hover:brightness-[0.97]',
          toneBg[tone],
          className,
        )}
      >
        {icon ? (
          <span className={cx('flex-none', color)}>
            <WebIcon name={icon} size={18} strokeWidth={2} />
          </span>
        ) : null}
        <span className="min-w-0 flex-1 text-[14px] leading-normal">{body}</span>
        {action ? <span className="flex-none text-[14px] text-ink-2">{action}</span> : null}
        <span className="flex-none text-nav-icon">
          <WebIcon name="chev" size={16} strokeWidth={2} />
        </span>
      </Link>
    );
  }
  return (
    <div
      role={role}
      className={cx(
        'flex w-full items-start gap-2.5 rounded-ctl py-3 pl-3 pr-3.5 text-ink',
        toneBg[tone],
        className,
      )}
    >
      {icon ? (
        <span className={cx('mt-px flex-none', color)}>
          <WebIcon name={icon} size={18} strokeWidth={2} />
        </span>
      ) : null}
      <div className="min-w-0 flex-1 text-[14px] leading-normal [&_a]:font-medium [&_a]:text-blue-deep [&_a:hover]:underline">
        {body}
      </div>
    </div>
  );
}
