import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * Vùng nội dung chính của một trang trong cổng (sau <Topbar>): <main id="noi-dung">,
 * lề 20px trên, 48px hai bên (16px trên màn hẹp), 28px dưới; các khối cách nhau 20px.
 * Là container query (`@container`) để <Columns>, <StatGroup> tự xuống dòng theo bề rộng thật.
 */
export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main
      id="noi-dung"
      tabIndex={-1}
      className={cx(
        '@container flex min-w-0 flex-1 flex-col gap-5 px-12 pb-7 pt-5 outline-none max-[900px]:px-4 max-[900px]:pt-3',
        className,
      )}
    >
      {children}
    </main>
  );
}

export type PageHeaderProps = {
  /** Tiêu đề trang: 28px đậm 700 (<h1>). */
  title: ReactNode;
  /** Dòng mô tả 14px xám dưới tiêu đề. */
  description?: ReactNode;
  /** Nút bên phải (nút chính, Hủy, Tải CSV…). */
  actions?: ReactNode;
  /** Thứ đặt cạnh tiêu đề, vd. <Status> của chiến dịch. */
  titleAddon?: ReactNode;
  className?: string;
};

/** Đầu trang: tiêu đề + mô tả bên trái, thao tác bên phải (căn đáy). */
export function PageHeader({ title, description, actions, titleAddon, className }: PageHeaderProps) {
  return (
    <header className={cx('flex flex-none flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className={cx('flex min-w-0 flex-col', titleAddon ? 'gap-1.5' : 'gap-1')}>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h1 className="m-0 text-[28px] font-bold leading-[1.25] tracking-[-0.4px] max-[600px]:text-[24px]">{title}</h1>
          {titleAddon}
        </div>
        {description ? <p className="m-0 text-[14px] leading-normal text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-none flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
