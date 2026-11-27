import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { cx } from './cx';
import { WebIcon } from './WebIcon';

const gapCls = {
  0: 'gap-0',
  6: 'gap-1.5',
  8: 'gap-2',
  10: 'gap-2.5',
  12: 'gap-3',
  14: 'gap-3.5',
  16: 'gap-4',
  20: 'gap-5',
  24: 'gap-6',
  32: 'gap-8',
} as const;
export type Gap = keyof typeof gapCls;

export type SectionHeaderProps = {
  /** Tiêu đề mục 15px đậm 600 (<h2>). */
  title: ReactNode;
  /** id của <h2>, để khung dùng aria-labelledby. */
  id?: string;
  /** Mô tả 13px xám dưới tiêu đề. */
  description?: ReactNode;
  /** Bên phải: <MoreLink>, nút nhỏ, <Status> hoặc ghi chú 13px. */
  action?: ReactNode;
  /** Cấp tiêu đề, mặc định h2. */
  as?: 'h2' | 'h3';
};

/** Đầu mục: tiêu đề + mô tả, thao tác bên phải. */
export function SectionHeader({ title, id, description, action, as: H = 'h2' }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <H id={id} className="m-0 text-[15px] font-semibold leading-[1.35]">
          {title}
        </H>
        {description ? <p className="m-0 text-[13px] leading-[1.45] text-ink-2">{description}</p> : null}
      </div>
      {action ? <div className="flex flex-none items-center gap-2">{action}</div> : null}
    </div>
  );
}

type BoxProps = {
  title?: ReactNode;
  /** id cho tiêu đề; có id thì khung dùng aria-labelledby, không có thì aria-label = title (nếu là chuỗi). */
  id?: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Tên vùng cho trình đọc màn hình khi không có tiêu đề. */
  label?: string;
  /** Khoảng cách giữa các phần tử con (px). */
  gap?: Gap;
  as?: 'section' | 'aside' | 'div';
  children?: ReactNode;
  className?: string;
};

function regionProps(title: ReactNode, id?: string, label?: string) {
  if (id && title) return { 'aria-labelledby': id };
  if (label) return { 'aria-label': label };
  if (typeof title === 'string') return { 'aria-label': title };
  return {};
}

const padCls = {
  sm: 'p-1.5',
  md: 'px-5 py-4',
  lg: 'px-5 py-[18px]',
  xl: 'px-[22px] py-[18px]',
} as const;

/**
 * Khung viền 6px (thẻ thông tin, biểu đồ, khung chi tiết bên phải).
 * padding: md 16/20 (mặc định), lg 18/20 (khung chi tiết), xl 18/22 (chi tiết duyệt), sm 6 (danh sách hàng chờ).
 * `sticky` giữ khung chi tiết đứng yên khi cuộn danh sách bên cạnh.
 */
export function Panel({
  title,
  id,
  description,
  action,
  label,
  gap = 12,
  as: Tag = 'section',
  padding = 'md',
  sticky = false,
  children,
  className,
}: BoxProps & { padding?: keyof typeof padCls; sticky?: boolean }) {
  return (
    <Tag
      {...regionProps(title, id, label)}
      className={cx(
        'flex min-w-0 flex-col rounded-frame bg-white shadow-frame',
        padCls[padding],
        gapCls[gap],
        sticky && 'min-[900px]:sticky min-[900px]:top-[57px]',
        className,
      )}
    >
      {title ? <SectionHeader title={title} id={id} description={description} action={action} /> : null}
      {children}
    </Tag>
  );
}

/** Mục không khung: đầu mục + nội dung (thường là <Table>), cách nhau 6px. */
export function Section({ title, id, description, action, label, gap = 6, as: Tag = 'section', children, className }: BoxProps) {
  return (
    <Tag {...regionProps(title, id, label)} className={cx('flex min-w-0 flex-none flex-col', gapCls[gap], className)}>
      {title ? <SectionHeader title={title} id={id} description={description} action={action} /> : null}
      {children}
    </Tag>
  );
}

/** Liên kết "Xem tất cả ›" ở đầu mục. */
export function MoreLink({ href, children = 'Xem tất cả' }: { href: string; children?: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-7 flex-none items-center gap-0.5 rounded-ctl px-1.5 text-[14px] text-ink-2 no-underline hover:bg-hover hover:text-ink"
    >
      {children}
      <WebIcon name="chev" size={14} strokeWidth={2} />
    </Link>
  );
}

/** Tiêu đề nhỏ trong khung chi tiết: 13px đậm 600 xám (<h3>), vd. "Lịch sử điểm", "Kiểm tra tự động". */
export function SubHeading({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cx('m-0 text-[13px] font-semibold text-ink-2', className)}>{children}</h3>;
}

/**
 * Đầu khung chi tiết: (logo) + tên 18px + dòng phụ + thứ bên phải (nhãn, nút), có đường kẻ dưới.
 */
export function DetailHeader({
  title,
  sub,
  leading,
  trailing,
  id,
  size = 18,
  divider = true,
  className,
}: {
  title: ReactNode;
  sub?: ReactNode;
  /** <BizMark size={40}>, <Avatar size={40}>… */
  leading?: ReactNode;
  /** <Status>, <ProviderMark>, nút Duyệt/Từ chối… */
  trailing?: ReactNode;
  id?: string;
  /** Cỡ tên: 18 (doanh nghiệp, bảng giá, duyệt) hoặc 17 (người dùng). */
  size?: 17 | 18;
  divider?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'flex gap-3',
        leading ? 'items-center' : 'items-start',
        divider && 'border-b border-line pb-3',
        className,
      )}
    >
      {leading}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <h2 id={id} className={cx('m-0 font-semibold leading-[1.35]', size === 18 ? 'text-[18px]' : 'text-[17px]')}>
          {title}
        </h2>
        {sub ? <span className="text-[13px] text-ink-2">{sub}</span> : null}
      </div>
      {trailing ? <div className="flex flex-none flex-wrap items-center gap-2">{trailing}</div> : null}
    </div>
  );
}

const colsBreak = {
  sm: '@min-[560px]:grid-cols-(--cols)',
  md: '@min-[760px]:grid-cols-(--cols)',
  lg: '@min-[960px]:grid-cols-(--cols)',
} as const;

/**
 * Lưới nhiều cột của trang, vd. `template="minmax(0,1fr) 380px"` (danh sách + khung chi tiết),
 * `"minmax(0,2fr) minmax(0,1fr)"` (biểu đồ + thẻ), `"repeat(3,minmax(0,1fr))"` (ô giới thiệu).
 * Dưới mốc `stackBelow` (đo theo bề rộng <PageBody>) xếp thành một cột.
 */
export function Columns({
  template,
  gap = 20,
  align = 'start',
  stackBelow = 'md',
  children,
  className,
}: {
  template: string;
  gap?: Gap;
  /** start: mỗi cột cao theo nội dung (mặc định); stretch: các khung cao bằng nhau. */
  align?: 'start' | 'stretch';
  stackBelow?: keyof typeof colsBreak;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'grid flex-none grid-cols-1',
        colsBreak[stackBelow],
        gapCls[gap],
        align === 'start' ? 'items-start' : 'items-stretch',
        className,
      )}
      style={{ '--cols': template } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** Đường kẻ ngang 1px. */
export function Divider({ className }: { className?: string }) {
  return <hr className={cx('m-0 h-px flex-none border-0 bg-line', className)} />;
}

/** Ghi chú 13px xám dưới bảng, vd. "Hiển thị 7 trong 31 doanh nghiệp." */
export function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('m-0 mt-2.5 text-[13px] leading-normal text-ink-2', className)}>{children}</p>;
}

/** Nền xem trước "Người dùng sẽ thấy" (nền app #F4F5FA, bo 8px) cho vé voucher, thông báo đẩy… */
export function PreviewBox({ children, padding = 12, className }: { children: ReactNode; padding?: 12 | 14; className?: string }) {
  return <div className={cx('rounded-tile bg-app-bg', padding === 12 ? 'p-3' : 'p-3.5', className)}>{children}</div>;
}
