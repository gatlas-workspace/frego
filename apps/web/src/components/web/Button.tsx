import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from './cx';
import { WebIcon, type AnyIconName } from './WebIcon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

const base =
  'relative inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-ctl text-[14px] font-medium leading-none no-underline transition-colors ' +
  // Vùng chạm ≥ 44px trên màn hình cảm ứng mà không đổi kích thước nhìn thấy.
  "pointer-coarse:before:absolute pointer-coarse:before:inset-x-0 pointer-coarse:before:-inset-y-2 pointer-coarse:before:content-['']";

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-action text-white shadow-btn-primary hover:bg-blue-deep',
  secondary: 'bg-white text-ink shadow-btn-secondary hover:bg-hover',
  ghost: 'bg-transparent text-ink hover:bg-hover',
  danger: 'bg-white text-danger shadow-btn-danger hover:bg-callout-red',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-7 px-2',
  md: 'h-8 px-3',
};

/** Lớp CSS của nút — dùng khi cần tạo kiểu nút cho phần tử khác (vd. <label> chọn tệp, <summary>). */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean; disabled?: boolean; className?: string } = {}) {
  return cx(
    base,
    variants[variant],
    sizes[size],
    block ? 'flex w-full' : '',
    disabled ? 'pointer-events-none cursor-not-allowed opacity-50' : 'cursor-pointer',
    className,
  );
}

/** Icon trong nút: tên ngắn như thiết kế (WebButton icon=…) hoặc bất kỳ tên icon nào. */
export type ButtonIcon = 'none' | 'download' | AnyIconName;

function iconName(icon: ButtonIcon): AnyIconName | null {
  if (icon === 'none') return null;
  if (icon === 'download') return 'downloadWeb';
  return icon;
}

type CommonProps = {
  /** WebButton variant: primary (một nút mỗi trang) | secondary | ghost | danger. Mặc định primary. */
  variant?: ButtonVariant;
  /** WebButton size: md cao 32px, sm cao 28px. */
  size?: ButtonSize;
  /** WebButton icon: plus, check, x, download, chev, external, back, search, filter… (đứng trước chữ). */
  icon?: ButtonIcon;
  /** Icon đứng sau chữ (vd. chev, external). */
  iconRight?: ButtonIcon;
  /** WebButton caret: thêm vạch chia + mũi tên xuống (nút mở menu). */
  caret?: boolean;
  /** WebButton block: rộng hết khung. */
  block?: boolean;
  /** Nhãn; có thể truyền `label` hoặc children. */
  label?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export type ButtonAsButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> & { href?: undefined };
export type ButtonAsLinkProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'className' | 'href'> & {
    /** Có href → render <Link> trông như nút. */
    href: string;
    disabled?: boolean;
  };
export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

function Inner({ icon, iconRight, caret, children }: { icon: ButtonIcon; iconRight?: ButtonIcon; caret?: boolean; children: ReactNode }) {
  const left = iconName(icon);
  const right = iconRight ? iconName(iconRight) : null;
  return (
    <>
      {left ? <WebIcon name={left} size={16} strokeWidth={2} /> : null}
      {children}
      {right ? <WebIcon name={right} size={16} strokeWidth={2} /> : null}
      {caret ? (
        <>
          <span aria-hidden="true" className="ml-1 mr-0.5 w-px self-stretch bg-current opacity-25" />
          <WebIcon name="caret" size={14} strokeWidth={2.2} />
        </>
      ) : null}
    </>
  );
}

/**
 * Nút web (WebButton). Dùng được trong Server Component.
 * - `href` → <Link> trông như nút (điều hướng); không có href → <button> (mặc định type="button").
 * - Nút gửi form: `type="submit"`, có thể kèm `name`/`value`/`formAction` cho server action.
 */
export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { variant, size, icon = 'none', iconRight, caret, block, label, children, className, href, disabled, ...rest } =
      props;
    return (
      <Link
        {...rest}
        href={href}
        className={buttonClass({ variant, size, block, disabled, className })}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : rest.tabIndex}
      >
        <Inner icon={icon} iconRight={iconRight} caret={caret}>
          {label ?? children}
        </Inner>
      </Link>
    );
  }
  const {
    variant,
    size,
    icon = 'none',
    iconRight,
    caret,
    block,
    label,
    children,
    className,
    type = 'button',
    disabled,
    ...rest
  } = props;
  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      className={buttonClass({ variant, size, block, disabled, className })}
    >
      <Inner icon={icon} iconRight={iconRight} caret={caret}>
        {label ?? children}
      </Inner>
    </button>
  );
}
