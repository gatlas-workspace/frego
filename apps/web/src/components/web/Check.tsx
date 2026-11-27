import type { ReactNode } from 'react';
import { cx } from './cx';
import { WebIcon, type AnyIconName } from './WebIcon';

/** green = đạt, amber = cần chú ý, red = không đạt, blue (indigo) = gợi ý. */
export type CheckTone = 'green' | 'amber' | 'red' | 'blue' | 'indigo';

const look: Record<'green' | 'amber' | 'red' | 'blue', { icon: AnyIconName; color: string; label: string }> = {
  green: { icon: 'check', color: 'text-good', label: 'Đạt' },
  amber: { icon: 'info', color: 'text-warn', label: 'Cần chú ý' },
  red: { icon: 'x', color: 'text-bad', label: 'Không đạt' },
  blue: { icon: 'info', color: 'text-info', label: 'Gợi ý' },
};

export type CheckProps = {
  /** WebCheck tone: green | amber | red | blue (indigo). Mặc định green. */
  tone?: CheckTone;
  /** WebCheck title: kết quả kiểm tra, 14px. */
  title: ReactNode;
  /** WebCheck text: giải thích thêm, 13px xám. */
  text?: ReactNode;
  className?: string;
};

/**
 * Dòng kết quả kiểm tra tự động (WebCheck), dùng khi duyệt chiến dịch / doanh nghiệp.
 * Icon có nhãn ẩn cho trình đọc màn hình ("Đạt", "Cần chú ý"…), vì màu không được là tín hiệu duy nhất.
 */
export function Check({ tone = 'green', title, text, className }: CheckProps) {
  const l = look[tone === 'indigo' ? 'blue' : tone];
  return (
    <div className={cx('flex w-full items-start gap-2 text-ink', className)}>
      <span className={cx('mt-0.5 flex size-[18px] flex-none items-center justify-center', l.color)}>
        <WebIcon name={l.icon} size={17} strokeWidth={2.4} />
        <span className="sr-only">{l.label}: </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-[14px] leading-normal">{title}</span>
        {text ? <span className="text-[13px] leading-normal text-ink-2">{text}</span> : null}
      </span>
    </div>
  );
}
