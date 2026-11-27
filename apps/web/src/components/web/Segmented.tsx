import type { ReactNode } from 'react';
import { cx } from './cx';

export type SegmentedItem = { value: string; label: ReactNode; disabled?: boolean };

export type SegmentedProps = {
  /** WebSegmented items: lựa chọn ngắn (bán kính, mức giảm, số tiền nạp…). */
  items: SegmentedItem[];
  /** Tên trường radio — server action đọc formData.get(name). Bắt buộc. */
  name: string;
  /** WebSegmented label: tên nhóm cho trình đọc màn hình (aria-label của radiogroup). */
  label: string;
  /** Giá trị chọn sẵn (không điều khiển) — dùng trong Server Component / form. */
  defaultValue?: string;
  /** Giá trị đang chọn (có điều khiển) — đi kèm onChange, chỉ trong Client Component. */
  value?: string;
  onChange?: (value: string) => void;
  /** WebSegmented block: rộng hết khung (mặc định true); false = vừa nội dung. */
  block?: boolean;
  /** Gắn với <form id> khác (thuộc tính form của input). */
  form?: string;
  required?: boolean;
  className?: string;
};

/**
 * Phân đoạn (WebSegmented): nhóm radio thật nên gửi được trong <form> (không cần JavaScript).
 * Mục đang chọn nền trắng nổi, các mục khác chữ xám trên nền xám.
 */
export function Segmented({
  items,
  name,
  label,
  defaultValue,
  value,
  onChange,
  block = true,
  form,
  required,
  className,
}: SegmentedProps) {
  const controlled = value !== undefined && onChange !== undefined;
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx('flex gap-0.5 rounded-seg bg-grey p-0.5', block ? 'w-full' : 'w-fit max-w-full', className)}
    >
      {items.map((it) => (
        <label key={it.value} className={cx('relative min-w-0', block ? 'flex-1 basis-0' : 'flex-none')}>
          <input
            type="radio"
            name={name}
            value={it.value}
            form={form}
            required={required}
            disabled={it.disabled}
            className="peer absolute inset-0 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            {...(controlled
              ? { checked: value === it.value, onChange: () => onChange(it.value) }
              : { defaultChecked: defaultValue === it.value })}
          />
          <span
            className={cx(
              'pointer-events-none flex h-[26px] items-center justify-center truncate whitespace-nowrap rounded-tag px-2.5 text-[14px] text-muted',
              'peer-checked:bg-white peer-checked:font-medium peer-checked:text-ink peer-checked:shadow-seg-on',
              'peer-hover:text-ink peer-disabled:opacity-50',
              'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-blue',
            )}
          >
            {it.label}
          </span>
        </label>
      ))}
    </div>
  );
}
