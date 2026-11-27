import type { CSSProperties, ReactNode } from 'react';
import type { ProviderId } from '@frego/core';
import { cx } from './cx';
import { ProviderMark } from './Marks';
import { WebIcon, type AnyIconName } from './WebIcon';

/* ---------- Cặp nhãn – giá trị ---------- */

/**
 * Danh sách nhãn – giá trị (<dl>). Mặc định dạng lưới: nhãn xám cột 150px, giá trị đậm 500
 * (khung "Cài đặt", chi tiết doanh nghiệp, người dùng). Dùng `layout="between"` cho dòng hai đầu
 * (giờ mở cửa, "Ước tính chi phí").
 */
export function KeyValueList({ children, className, gap = 0 }: { children: ReactNode; className?: string; gap?: 0 | 2 | 10 }) {
  return (
    <dl className={cx('m-0 flex flex-col', gap === 2 ? 'gap-0.5' : gap === 10 ? 'gap-2.5' : '', className)}>{children}</dl>
  );
}

export type KeyValueProps = {
  label: ReactNode;
  children: ReactNode;
  /** grid: nhãn cột `labelWidth` px, giá trị đậm (mặc định); between: nhãn trái, giá trị phải. */
  layout?: 'grid' | 'between';
  labelWidth?: number;
  /** Dòng tổng: kẻ trên, nhãn màu chữ chính, giá trị đậm 600 (chỉ với between). */
  total?: boolean;
  /** Giá trị đậm 500 (mặc định: grid có, between không). */
  strong?: boolean;
  /** Số đều nhau (tiền). */
  numeric?: boolean;
  className?: string;
};

export function KeyValue({ label, children, layout = 'grid', labelWidth = 150, total = false, strong, numeric, className }: KeyValueProps) {
  if (layout === 'between') {
    return (
      <div className={cx('flex justify-between gap-2 py-1 text-[14px]', total && 'mt-1 border-t border-line pt-2.5', className)}>
        <dt className={total ? 'text-ink' : 'text-ink-2'}>{label}</dt>
        <dd className={cx('m-0 text-right', total ? 'font-semibold' : strong ? 'font-medium' : '', numeric && 'tabular-nums')}>
          {children}
        </dd>
      </div>
    );
  }
  return (
    <div
      className={cx('grid grid-cols-(--kv) items-baseline gap-3 py-1.5 text-[14px] max-[480px]:grid-cols-1 max-[480px]:gap-0.5', className)}
      style={{ '--kv': `${labelWidth}px minmax(0,1fr)` } as CSSProperties}
    >
      <dt className="text-ink-2">{label}</dt>
      <dd className={cx('m-0 min-w-0', strong === false ? '' : 'font-medium', numeric && 'tabular-nums')}>{children}</dd>
    </div>
  );
}

/* ---------- Lịch sử / nhật ký ---------- */

export type TimelineItem = { key?: string; time: ReactNode; text: ReactNode };

/**
 * Danh sách "Lịch sử" / nhật ký: cột thời điểm xám (64px cho ngày "22/11", 44px cho giờ "10:02") + nội dung 13px,
 * đường kẻ mảnh dưới mỗi dòng.
 */
export function Timeline({ items, timeWidth = 64, label, className }: { items: TimelineItem[]; timeWidth?: 44 | 64; label?: string; className?: string }) {
  return (
    <ul aria-label={label} className={cx('m-0 list-none p-0', className)}>
      {items.map((it, i) => (
        <li
          key={it.key ?? i}
          className={cx(
            'grid gap-2.5 text-[13px] leading-[1.45] shadow-soft-b',
            timeWidth === 64 ? 'grid-cols-[64px_minmax(0,1fr)] py-[7px]' : 'grid-cols-[44px_minmax(0,1fr)] py-2',
          )}
        >
          <span className="text-ink-2 tabular-nums">{it.time}</span>
          <span className="min-w-0">{it.text}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Thanh đo ---------- */

export type MeterTone = 'green' | 'amber' | 'blue' | 'orange' | 'grey';
const meterFill: Record<MeterTone, string> = {
  green: 'bg-good',
  amber: 'bg-warn',
  blue: 'bg-blue',
  orange: 'bg-accent-orange',
  grey: 'bg-meter-grey',
};

/**
 * Dòng thanh đo: nhãn (có thể kèm logo hãng) + số bên phải + thanh 6px.
 * Dùng cho "Theo hãng và loại xe", "Độ khớp giá ước tính", "Khách đi từ đâu", tỷ lệ loại mã.
 */
export function Meter({
  label,
  value,
  percent,
  tone = 'blue',
  logo,
  className,
}: {
  label: ReactNode;
  /** Chữ bên phải, vd. "312 · 81%", "84%", "Chưa bật". */
  value: ReactNode;
  /** Độ dài thanh 0–100. */
  percent: number;
  tone?: MeterTone;
  logo?: ProviderId;
  className?: string;
}) {
  const w = Math.max(0, Math.min(100, percent));
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2 text-[14px]">
          {logo ? <ProviderMark provider={logo} size={20} /> : null}
          <span className="min-w-0 truncate">{label}</span>
        </span>
        <span className="flex-none text-[14px] text-ink tabular-nums">{value}</span>
      </div>
      <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-[3px] bg-grey">
        <span className={cx('block h-full rounded-[3px]', meterFill[tone])} style={{ width: `${w}%` }} />
      </span>
    </div>
  );
}

/* ---------- Ô nền xám ---------- */

/** Khối nền xám nhạt bo 4px (vd. "Thử với chuyến…" ở Bảng giá). */
export function Tile({ children, className, padding = 'md' }: { children: ReactNode; className?: string; padding?: 'sm' | 'md' }) {
  return (
    <div className={cx('flex min-w-0 flex-col gap-1 rounded-ctl bg-sidebar', padding === 'md' ? 'px-4 py-3.5' : 'p-3', className)}>
      {children}
    </div>
  );
}

/** Ô giới thiệu: icon + tiêu đề 14px đậm 600, đoạn giải thích 14px xám (hàng 3 ô cuối trang Chiến dịch, Kho mã…). */
export function InfoTile({ icon, title, children, className }: { icon?: AnyIconName; title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Tile className={className}>
      <span className="flex items-center gap-2 text-[14px] font-semibold">
        {icon ? <WebIcon name={icon} size={17} strokeWidth={2} className="text-ink-2" /> : null}
        {title}
      </span>
      <span className="text-[14px] leading-normal text-ink-2">{children}</span>
    </Tile>
  );
}

/** Số liệu lớn trong thẻ: nhãn 13px xám, số 20/26/30px, dòng phụ 13px (vd. "Số dư ví"). */
export function Metric({
  label,
  value,
  sub,
  size = 'lg',
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  /** md 20px, lg 26px (mặc định), xl 30px. */
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const v = {
    md: 'text-[20px] leading-[1.3]',
    lg: 'text-[26px] leading-[1.25] tracking-[-0.3px]',
    xl: 'text-[30px] leading-[1.2] tracking-[-0.4px]',
  }[size];
  return (
    <div className={cx('flex flex-col gap-0.5', className)}>
      <span className="text-[13px] font-medium text-ink-2">{label}</span>
      <span className={cx('font-semibold tabular-nums', v)}>{value}</span>
      {sub ? <span className="text-[13px] leading-normal text-ink-2">{sub}</span> : null}
    </div>
  );
}
