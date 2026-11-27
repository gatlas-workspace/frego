import Link from 'next/link';
import type { ReactNode } from 'react';
import { cx } from './cx';
import { WebIcon, type AnyIconName } from './WebIcon';

export type TabItem = {
  /** Giá trị ghi vào ?tab= (hoặc tham số `param`) và để so với `active`. */
  key: string;
  label: ReactNode;
  /** Số đếm nhỏ sau nhãn. */
  count?: number | string;
  /** Liên kết riêng; bỏ trống thì tự tạo "?tab=key" (giữ các tham số khác trong `query`). */
  href?: string;
  /** Icon trước nhãn như view của Notion. */
  icon?: 'table' | 'board' | 'list';
};

export type SearchParamsLike = Record<string, string | string[] | undefined>;

/** "?a=1&tab=key": giữ các tham số đang có, thay tham số `param`. */
export function tabHref(key: string, param = 'tab', query: SearchParamsLike = {}, pathname = ''): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (k === param || v === undefined) continue;
    (Array.isArray(v) ? v : [v]).forEach((x) => sp.append(k, x));
  }
  sp.set(param, key);
  return `${pathname}?${sp.toString()}`;
}

export type TabsProps = {
  /** WebTabs items. */
  items: TabItem[];
  /** key đang chọn (thiết kế: item.on). Mặc định mục đầu. */
  active?: string;
  /** WebTabs label: tên nhóm cho trình đọc màn hình, vd. "Lọc chiến dịch". */
  label: string;
  /** Tên tham số URL. Mặc định "tab". */
  param?: string;
  /** searchParams hiện tại của trang, để giữ các tham số khác khi đổi tab. */
  query?: SearchParamsLike;
  /** Đường dẫn trang; bỏ trống thì liên kết là "?tab=…" (cùng trang). */
  pathname?: string;
  /** Có onChange → dùng nút thay liên kết (chỉ trong Client Component). */
  onChange?: (key: string) => void;
  /**
   * WebTabs toolbar: truyền ReactNode (vd. các <TabsTool>) để có công cụ thật. true = không hiện gì
   * (cụm "Lọc · Sắp xếp · Tìm" trang trí của thiết kế đã bỏ vì bấm không được).
   */
  toolbar?: boolean | ReactNode;
  className?: string;
};

const itemBase =
  'relative flex h-[34px] items-center gap-1.5 whitespace-nowrap border-0 bg-transparent px-1.5 text-[14px] font-medium no-underline';

function ItemInner({ item, on }: { item: TabItem; on: boolean }) {
  return (
    <>
      {item.icon ? <WebIcon name={item.icon === 'board' ? 'board' : 'table'} size={16} /> : null}
      {item.label}
      {item.count !== undefined && item.count !== '' ? (
        <span className={cx('text-[12px]', on ? 'text-ink-2' : 'text-muted')}>{item.count}</span>
      ) : null}
      {on ? <span aria-hidden="true" className="absolute inset-x-1 -bottom-px h-0.5 bg-ink" /> : null}
    </>
  );
}

/** Công cụ nhỏ bên phải thanh tab (Lọc, Sắp xếp, Tìm…): href → liên kết, onClick → nút. */
export function TabsTool({
  icon,
  label,
  href,
  onClick,
  iconOnly = false,
  active = false,
}: {
  icon: AnyIconName;
  label: string;
  href?: string;
  onClick?: () => void;
  /** Chỉ hiện icon (nhãn thành aria-label). */
  iconOnly?: boolean;
  active?: boolean;
}) {
  const cls = cx(
    'flex h-7 items-center gap-1 rounded-ctl border-0 bg-transparent px-1.5 text-[14px] no-underline hover:bg-hover',
    active ? 'text-blue-deep' : 'text-ink-2',
  );
  const inner = (
    <>
      <WebIcon name={icon} size={16} />
      {iconOnly ? null : label}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls} aria-label={iconOnly ? label : undefined}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cx(cls, 'cursor-pointer')} aria-label={iconOnly ? label : undefined}>
      {inner}
    </button>
  );
}

/**
 * Tab chế độ xem (WebTabs): lọc bảng như view của Notion, gạch chân mục đang chọn.
 * Mặc định là liên kết "?tab=key" nên chạy trong Server Component (trang đọc searchParams.tab);
 * truyền onChange để đổi tại chỗ trong Client Component.
 */
export function Tabs({ items, active, label, param = 'tab', query, pathname, onChange, toolbar, className }: TabsProps) {
  const current = active ?? items[0]?.key;
  return (
    <div className={cx('flex w-full flex-none items-end shadow-line-b', className)}>
      <div role="group" aria-label={label} className="flex min-w-0 items-end gap-0.5 overflow-x-auto pb-px [scrollbar-width:none]">
        {items.map((item) => {
          const on = item.key === current;
          const cls = cx(itemBase, on ? 'text-ink' : 'text-ink-2 hover:text-ink');
          if (onChange) {
            return (
              <button key={item.key} type="button" aria-pressed={on} onClick={() => onChange(item.key)} className={cx(cls, 'cursor-pointer')}>
                <ItemInner item={item} on={on} />
              </button>
            );
          }
          return (
            <Link
              key={item.key}
              href={item.href ?? tabHref(item.key, param, query, pathname)}
              aria-current={on ? 'page' : undefined}
              scroll={false}
              className={cls}
            >
              <ItemInner item={item} on={on} />
            </Link>
          );
        })}
      </div>
      {/* toolbar === true trước đây là cụm "Lọc · Sắp xếp · Tìm" chỉ để trang trí (bấm không được) → bỏ. Chỉ hiện công cụ thật. */}
      {toolbar && toolbar !== true ? (
        <div className="ml-auto flex flex-none items-center gap-0.5 pb-[3px] pl-2">{toolbar}</div>
      ) : null}
    </div>
  );
}
