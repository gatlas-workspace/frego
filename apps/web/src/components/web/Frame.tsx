import Link from 'next/link';
import type { ReactNode } from 'react';
import { cx } from './cx';
import { FregoMark } from './Marks';

/** Logo chữ "Frego cho doanh nghiệp" (ô F tím 24px + chữ 15px đậm 600), về trang chủ. */
export function FregoLogo({ text = 'Frego cho doanh nghiệp', href = '/' }: { text?: ReactNode; href?: string | null }) {
  const inner = (
    <>
      <FregoMark size={24} />
      <span className="text-[15px] font-semibold text-ink">{text}</span>
    </>
  );
  if (!href) return <span className="flex items-center gap-2">{inner}</span>;
  return (
    <Link href={href} className="flex w-fit items-center gap-2 rounded-ctl no-underline">
      {inner}
    </Link>
  );
}

/**
 * Khung trang đứng riêng, không thanh bên (WebDnDangKy): cột trái 320px nền xám (logo, giới thiệu, các bước),
 * nội dung bên phải lề 28px/56px, rộng tối đa 760px. Màn hẹp: cột trái lên trên.
 */
export function StandalonePage({ aside, children, className }: { aside: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx('flex min-h-screen bg-white text-ink max-[900px]:flex-col', className)}>
      <aside className="flex w-80 flex-none flex-col gap-5 bg-sidebar p-7 shadow-sidebar max-[900px]:w-full max-[900px]:gap-4 max-[900px]:p-5 max-[900px]:shadow-soft-b min-[900px]:sticky min-[900px]:top-0 min-[900px]:h-screen">
        {aside}
      </aside>
      <main id="noi-dung" className="@container min-w-0 flex-1 px-14 py-7 max-[900px]:px-4 max-[900px]:py-5">
        <div className="flex max-w-[760px] flex-col gap-1">{children}</div>
      </main>
    </div>
  );
}

/** Danh sách bước đánh số (cột trái trang Đăng ký). `current` = số bước đang làm (tô đậm). */
export function StepList({ steps, current }: { steps: ReactNode[]; current?: number }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
      {steps.map((s, i) => {
        const on = current === i + 1;
        return (
          <li
            key={i}
            aria-current={on ? 'step' : undefined}
            className={cx('flex h-8 items-center gap-2.5 rounded-frame px-2.5 text-[14px] text-ink', on && 'bg-nav-active font-medium')}
          >
            <span aria-hidden="true" className="flex size-5 flex-none items-center justify-center rounded-full bg-tag-grey text-[12px] font-semibold">
              {i + 1}
            </span>
            {s}
          </li>
        );
      })}
    </ol>
  );
}
