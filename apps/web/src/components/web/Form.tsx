import type { ReactNode } from 'react';
import type { ProviderId } from '@frego/core';
import { cx } from './cx';
import { ProviderMark } from './Marks';
import { WebIcon } from './WebIcon';

/**
 * Mục của form nhiều bước (Tạo chiến dịch, Đăng ký doanh nghiệp): cột trái số bước + tiêu đề + mô tả,
 * cột phải các ô nhập; kẻ trên mỗi mục. labelWidth 200 (Tạo chiến dịch) hoặc 150 (Đăng ký).
 */
export function FormSection({
  step,
  title,
  description,
  id,
  labelWidth = 200,
  children,
  className,
}: {
  step?: number | string;
  title: ReactNode;
  description?: ReactNode;
  /** id của tiêu đề (aria-labelledby). */
  id: string;
  labelWidth?: 150 | 200;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cx(
        'grid grid-cols-1 border-t border-line',
        labelWidth === 200
          ? 'gap-x-6 gap-y-3 py-[18px] @min-[640px]:grid-cols-[200px_minmax(0,1fr)]'
          : 'gap-x-5 gap-y-3 py-4 @min-[560px]:grid-cols-[150px_minmax(0,1fr)]',
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h2 id={id} className="m-0 text-[14px] font-semibold leading-[1.4]">
          {step !== undefined ? <span className="font-medium text-ink-2">{step} </span> : null}
          {title}
        </h2>
        {description ? <p className="m-0 text-[13px] leading-normal text-ink-2">{description}</p> : null}
      </div>
      <div className="flex min-w-0 flex-col gap-3">{children}</div>
    </section>
  );
}

/** Lưới ô nhập 2 hoặc 4 cột cách nhau 12px, xuống 1 cột khi hẹp. */
export function FieldGrid({ cols = 2, children, className }: { cols?: 2 | 3 | 4; children: ReactNode; className?: string }) {
  const c = { 2: '@min-[480px]:grid-cols-2', 3: '@min-[560px]:grid-cols-3', 4: '@min-[480px]:grid-cols-2 @min-[720px]:grid-cols-4' }[cols];
  return <div className={cx('grid flex-none grid-cols-1 gap-3', c, className)}>{children}</div>;
}

/**
 * Ô tìm kiếm (32px, viền xám, icon kính lúp). Có `action` → tự bọc <form method="get"> để lọc qua URL.
 */
export function SearchField({
  name = 'q',
  label,
  placeholder,
  defaultValue,
  action,
  width = 320,
  className,
}: {
  name?: string;
  /** Tên ô cho trình đọc màn hình, vd. "Tìm người dùng". */
  label: string;
  placeholder?: string;
  defaultValue?: string;
  /** Đường dẫn nhận form GET (vd. "/quan-tri/nguoi-dung"). Bỏ trống thì chỉ là ô nhập. */
  action?: string;
  width?: number | 'full';
  className?: string;
}) {
  const field = (
    <span
      className={cx(
        'flex h-8 max-w-full items-center gap-2 rounded-frame border border-line-strong bg-white px-2.5 focus-within:shadow-field-focus',
        width === 'full' && 'w-full',
        className,
      )}
      style={width === 'full' ? undefined : { width }}
    >
      <WebIcon name="search" size={16} strokeWidth={2} className="text-nav-icon" />
      <input
        type="search"
        name={name}
        aria-label={label}
        placeholder={placeholder}
        defaultValue={defaultValue}
        autoComplete="off"
        className="web-field h-full min-w-0 flex-1 border-0 bg-transparent text-[14px] text-ink outline-none focus-visible:outline-none"
      />
    </span>
  );
  if (!action) return field;
  return (
    <form method="get" action={action} role="search" className="contents">
      {field}
    </form>
  );
}

export type ChoiceItem = { value: string; label: ReactNode; logo?: ProviderId; leading?: ReactNode; disabled?: boolean };

/**
 * Nhóm lựa chọn dạng ô (chọn hãng xe Grab / Be / Green SM ở Tạo chiến dịch): radio thật, cao 36px,
 * ô đang chọn nền xanh nhạt viền xanh 2px. Dùng được trong form không cần JavaScript.
 */
export function ChoiceGroup({
  items,
  name,
  label,
  defaultValue,
  value,
  onChange,
  className,
}: {
  items: ChoiceItem[];
  name: string;
  /** Tên nhóm cho trình đọc màn hình, vd. "Hãng xe". */
  label: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  const controlled = value !== undefined && onChange !== undefined;
  return (
    <div role="radiogroup" aria-label={label} className={cx('flex flex-wrap gap-2', className)}>
      {items.map((it) => (
        <label key={it.value} className="relative min-w-[120px] flex-1 basis-0">
          <input
            type="radio"
            name={name}
            value={it.value}
            disabled={it.disabled}
            className="peer absolute inset-0 m-0 cursor-pointer opacity-0"
            {...(controlled ? { checked: value === it.value, onChange: () => onChange(it.value) } : { defaultChecked: defaultValue === it.value })}
          />
          <span
            className={cx(
              'pointer-events-none flex h-9 items-center gap-2 rounded-ctl bg-white px-2.5 text-[14px] text-ink shadow-outline',
              'peer-checked:bg-blue-soft peer-checked:font-medium peer-checked:text-blue-deep peer-checked:shadow-choice-on',
              'peer-hover:bg-sidebar peer-checked:peer-hover:bg-blue-soft peer-disabled:opacity-50',
              'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue',
            )}
          >
            {it.logo ? <ProviderMark provider={it.logo} size={20} /> : it.leading}
            {it.label}
          </span>
        </label>
      ))}
    </div>
  );
}
