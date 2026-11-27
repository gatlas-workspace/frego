import type { ChangeEvent, ReactNode } from 'react';
import { cx } from './cx';

export type ToggleProps = {
  /** Tên cho trình đọc màn hình (công tắc không có chữ đi kèm). Trong <ToggleRow> lấy từ tiêu đề dòng. */
  label?: string;
  /** Tên trường — form gửi `name=on` khi bật (đổi bằng `value`). */
  name?: string;
  value?: string;
  /** WebToggle checked — không điều khiển (Server Component / form). */
  defaultChecked?: boolean;
  /** Có điều khiển — đi kèm onChange, chỉ trong Client Component. */
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  form?: string;
  className?: string;
};

/** Chỉ phần công tắc: input checkbox role="switch" phủ trong suốt lên rãnh 28×16. */
function SwitchInput({ label, name, value, defaultChecked, checked, onChange, disabled, id, form }: ToggleProps) {
  const controlled = checked !== undefined && onChange !== undefined;
  return (
    <>
      <input
        type="checkbox"
        role="switch"
        id={id}
        name={name}
        value={value}
        form={form}
        disabled={disabled}
        aria-label={label}
        className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...(controlled
          ? { checked, onChange: (e: ChangeEvent<HTMLInputElement>) => onChange(e.currentTarget.checked) }
          : { defaultChecked })}
      />
      <span
        aria-hidden="true"
        className={cx(
          'pointer-events-none block h-4 w-7 rounded-full bg-toggle-off transition-colors',
          'peer-checked:bg-blue peer-disabled:opacity-50',
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue',
          'peer-checked:[&>span]:translate-x-3',
        )}
      >
        <span className="absolute left-0.5 top-0.5 block size-3 rounded-full bg-white shadow-knob transition-transform" />
      </span>
    </>
  );
}

/**
 * Công tắc bật/tắt (WebToggle): checkbox thật (role="switch"), gửi được trong form.
 * Vùng chạm được nới ra 44px quanh rãnh 28×16.
 */
export function Toggle(props: ToggleProps) {
  return (
    <span
      className={cx(
        "relative inline-block h-4 w-7 flex-none before:absolute before:-inset-x-2 before:-inset-y-3.5 before:content-['']",
        props.className,
      )}
    >
      <SwitchInput {...props} />
    </span>
  );
}

export type ToggleRowProps = Omit<ToggleProps, 'label'> & {
  /** Tiêu đề dòng 14px (cũng là tên của công tắc). */
  title: ReactNode;
  /** Mô tả 13px xám. */
  description?: ReactNode;
  /** Tên cho trình đọc màn hình nếu khác tiêu đề, vd. "Email kết quả duyệt". */
  label?: string;
};

/**
 * Dòng cài đặt có công tắc bên phải (mẫu lặp ở Ví, Hồ sơ, Tạo chiến dịch). Cả dòng bấm được để bật/tắt.
 */
export function ToggleRow({ title, description, label, className, ...rest }: ToggleRowProps) {
  return (
    <label className={cx('flex cursor-pointer items-center gap-3', className)}>
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-[14px] text-ink">{title}</span>
        {description ? <span className="text-[13px] text-ink-2">{description}</span> : null}
      </span>
      <span className="relative inline-block h-4 w-7 flex-none">
        <SwitchInput {...rest} label={label ?? (typeof title === 'string' ? title : undefined)} />
      </span>
    </label>
  );
}
