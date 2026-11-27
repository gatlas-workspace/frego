import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cx } from './cx';

type FieldCommon = {
  /** WebInput label: nhãn 12px phía trên ô (thẻ <label> thật). */
  label: ReactNode;
  /** WebInput fieldId: id của ô, nối với nhãn. Bắt buộc. */
  id: string;
  /** WebInput help: dòng giải thích dưới ô. */
  help?: ReactNode;
  /** Lỗi: nội dung = dòng lỗi đỏ (thay help); true = chỉ viền đỏ. Đặt aria-invalid. */
  error?: ReactNode | boolean;
  /** WebInput state — để trưng bày trạng thái trong bảng thành phần ("focus" vẽ vòng xanh cố định). */
  state?: 'default' | 'focus' | 'error';
  /** Ẩn nhãn khỏi mắt (vẫn đọc được). */
  hideLabel?: boolean;
  className?: string;
};

function frame(isError: boolean, state: FieldCommon['state'], multiline: boolean) {
  return cx(
    'flex rounded-ctl transition-shadow',
    multiline ? 'min-h-8 items-stretch' : 'h-8 items-center',
    isError
      ? 'bg-white shadow-field-error'
      : state === 'focus'
        ? 'bg-white shadow-field-focus'
        : 'bg-field shadow-field focus-within:bg-white focus-within:shadow-field-focus',
  );
}

const fieldCls =
  'web-field min-w-0 flex-1 rounded-ctl border-0 bg-transparent px-2.5 text-[14px] text-ink outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:text-ink-2';

function Shell({
  label,
  id,
  help,
  error,
  state = 'default',
  hideLabel,
  className,
  children,
}: FieldCommon & { children: (a: { describedBy?: string; invalid: boolean }) => ReactNode }) {
  const invalid = state === 'error' || !!error;
  const message = error && error !== true ? error : help;
  const describedBy = message ? `${id}-goi-y` : undefined;
  return (
    <span className={cx('flex w-full flex-col gap-1.5 text-ink', className)}>
      <label htmlFor={id} className={cx('text-[12px] font-medium leading-[1.3] text-ink-2', hideLabel && 'sr-only')}>
        {label}
      </label>
      {children({ describedBy, invalid })}
      {message ? (
        <span id={describedBy} className={cx('text-[12px] leading-[1.4]', invalid ? 'text-danger' : 'text-ink-2')}>
          {message}
        </span>
      ) : null}
    </span>
  );
}

export type InputProps = FieldCommon &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'size' | 'id'> & {
    /** WebInput suffix: đơn vị sau ô, vd. "đ", "mã", "lần". */
    suffix?: ReactNode;
  };

/**
 * Ô nhập (WebInput): <label> + <input> thật. Nền xám nhạt viền mảnh; đang nhập có vòng xanh; lỗi viền đỏ + dòng lỗi.
 * Không điều khiển (name, defaultValue) trong Server Component / form; có điều khiển (value + onChange) trong Client Component.
 * Thuộc tính khác của <input> (type, inputMode, autoComplete, required, min, pattern…) truyền thẳng.
 */
export function Input({ label, id, help, error, state, hideLabel, className, suffix, type = 'text', autoComplete = 'off', ...rest }: InputProps) {
  return (
    <Shell label={label} id={id} help={help} error={error} state={state} hideLabel={hideLabel} className={className}>
      {({ describedBy, invalid }) => (
        <span className={frame(invalid, state, false)}>
          <input
            {...rest}
            id={id}
            type={type}
            autoComplete={autoComplete}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cx(fieldCls, 'h-full')}
          />
          {suffix ? <span className="flex-none px-2.5 text-[14px] text-ink-2">{suffix}</span> : null}
        </span>
      )}
    </Shell>
  );
}

export type TextareaProps = FieldCommon & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className' | 'id'>;

/** Ô nhập nhiều dòng cùng kiểu WebInput (nội dung tin, lý do từ chối dài…). */
export function Textarea({ label, id, help, error, state, hideLabel, className, rows = 3, ...rest }: TextareaProps) {
  return (
    <Shell label={label} id={id} help={help} error={error} state={state} hideLabel={hideLabel} className={className}>
      {({ describedBy, invalid }) => (
        <span className={frame(invalid, state, true)}>
          <textarea
            {...rest}
            id={id}
            rows={rows}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            className={cx(fieldCls, 'resize-y py-1.5 leading-normal')}
          />
        </span>
      )}
    </Shell>
  );
}
