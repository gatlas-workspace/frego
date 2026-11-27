import type { ReactNode } from 'react';
import { cx } from './cx';

/**
 * Màu nhãn. Tên trong thiết kế: green, amber, grey, red, indigo (= blue), deal (= orange).
 */
export type StatusTone = 'green' | 'amber' | 'grey' | 'red' | 'blue' | 'orange' | 'indigo' | 'deal';
export type StatusShape = 'status' | 'tag';

type Canon = 'green' | 'amber' | 'grey' | 'red' | 'blue' | 'orange';

export function canonTone(tone: StatusTone): Canon {
  if (tone === 'indigo') return 'blue';
  if (tone === 'deal') return 'orange';
  return tone;
}

const fill: Record<Canon, string> = {
  green: 'bg-tag-green text-tag-green-ink',
  amber: 'bg-tag-amber text-tag-amber-ink',
  grey: 'bg-tag-grey text-tag-grey-ink',
  red: 'bg-tag-red text-tag-red-ink',
  blue: 'bg-tag-blue text-tag-blue-ink',
  orange: 'bg-tag-orange text-tag-orange-ink',
};

const dot: Record<Canon, string> = {
  green: 'bg-dot-green',
  amber: 'bg-dot-amber',
  grey: 'bg-dot-grey',
  red: 'bg-dot-red',
  blue: 'bg-dot-blue',
  orange: 'bg-dot-orange',
};

export type StatusProps = {
  /** WebStatus text. Có thể truyền children thay cho text. */
  text?: ReactNode;
  children?: ReactNode;
  /** WebStatus tone: green | amber | grey | red | blue (indigo) | orange (deal). Mặc định green. */
  tone?: StatusTone;
  /** WebStatus shape: status = bo tròn có chấm (trạng thái); tag = bo 3px (thuộc tính chọn). */
  shape?: StatusShape;
  className?: string;
};

/** Nhãn trạng thái / thuộc tính (WebStatus). Cao 20px, chữ 12px đậm 500. */
export function Status({ text, children, tone = 'green', shape = 'status', className }: StatusProps) {
  const t = canonTone(tone);
  if (shape === 'tag') {
    return (
      <span
        className={cx(
          'inline-flex h-5 max-w-full items-center whitespace-nowrap rounded-tag px-1.5 text-[12px] font-medium leading-none',
          fill[t],
          className,
        )}
      >
        {text ?? children}
      </span>
    );
  }
  return (
    <span
      className={cx(
        'inline-flex h-5 max-w-full items-center gap-[5px] whitespace-nowrap rounded-[10px] pl-[7px] pr-2 text-[12px] font-medium leading-none',
        fill[t],
        className,
      )}
    >
      <span aria-hidden="true" className={cx('size-2 flex-none rounded-full', dot[t])} />
      {text ?? children}
    </span>
  );
}
