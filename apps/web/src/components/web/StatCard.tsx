import type { ReactNode } from 'react';
import { cx } from './cx';

export type StatTone = 'good' | 'bad' | 'neutral';

const deltaColor: Record<StatTone, string> = {
  good: 'text-good',
  bad: 'text-bad',
  neutral: 'text-ink-2',
};

export type StatCardProps = {
  /** WebStatCard label, 14px xám. */
  label: ReactNode;
  /** WebStatCard value, 26px đậm 600, số đều nhau. */
  value: ReactNode;
  /** WebStatCard sub: dòng mô tả dưới số, 13px xám. */
  sub?: ReactNode;
  /** WebStatCard delta: thay đổi so với kỳ trước, vd. "+9%". */
  delta?: ReactNode;
  /** WebStatCard tone: màu của delta — good xanh lá, bad đỏ, neutral xám. Mặc định good. */
  tone?: StatTone;
  className?: string;
};

/**
 * Ô số liệu (WebStatCard). Thường đặt trong <StatGroup> để có khung và đường chia như thiết kế.
 * Nếu dùng riêng, tự bọc khung (vd. <Panel>).
 */
export function StatCard({ label, value, sub, delta, tone = 'good', className }: StatCardProps) {
  return (
    <div className={cx('flex h-full min-w-0 flex-col gap-0.5 bg-white px-4 py-3.5 text-ink', className)}>
      <span className="text-[14px] text-ink-2">{label}</span>
      <span className="truncate text-[26px] font-semibold leading-[1.3] tracking-[-0.4px] tabular-nums">{value}</span>
      {delta || sub ? (
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          {delta ? (
            <span className={cx('whitespace-nowrap text-[13px] font-medium', deltaColor[tone])}>{delta}</span>
          ) : null}
          {sub ? <span className="text-[13px] leading-[1.4] text-ink-2">{sub}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

const groupCols: Record<number, string> = {
  1: '',
  2: '@min-[420px]:grid-cols-2',
  3: '@min-[640px]:grid-cols-3',
  4: '@min-[420px]:grid-cols-2 @min-[760px]:grid-cols-4',
  5: '@min-[420px]:grid-cols-2 @min-[900px]:grid-cols-5',
  6: '@min-[420px]:grid-cols-2 @min-[640px]:grid-cols-3 @min-[960px]:grid-cols-6',
};

/**
 * Dải ô số liệu đầu trang: khung viền 6px, đường chia 1px giữa các ô.
 * Trên khung hẹp tự xuống 2 cột hoặc 1 cột (cần cha có lớp `@container`, như <PageBody>).
 */
export function StatGroup({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  const count = Array.isArray(children) ? children.filter(Boolean).length : 1;
  return (
    <div
      role={label ? 'group' : undefined}
      aria-label={label}
      className={cx(
        'grid flex-none grid-cols-1 gap-px overflow-hidden rounded-frame border border-line bg-line',
        groupCols[Math.min(Math.max(count, 1), 6)],
        className,
      )}
    >
      {children}
    </div>
  );
}
