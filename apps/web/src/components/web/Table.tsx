import Link from 'next/link';
import { isValidElement, type CSSProperties, type ReactNode } from 'react';
import type { ProviderId } from '@frego/core';
import { cx } from './cx';
import { Avatar, ProviderMark } from './Marks';
import { Status, type StatusTone } from './Status';
import { WebIcon } from './WebIcon';

/** Loại cột → icon nhỏ ở tiêu đề (Aa, #, đ, trạng thái, ngày, người). 'none' = không icon. */
export type TableColumnType = 'text' | 'number' | 'money' | 'status' | 'date' | 'person' | 'none';

export type TableColumn = {
  /** WebTable cols[].label — tiêu đề cột. */
  label: string;
  /** WebTable cols[].align — 'right' cho cột số/tiền. */
  align?: 'left' | 'right';
  /** WebTable cols[].w — độ rộng track CSS grid: "130px", "1.6fr", "minmax(0,1fr)". Mặc định minmax(0,1fr). */
  w?: string;
  /** WebTable cols[].type — loại cột; bỏ trống thì đoán từ nhãn như thiết kế. */
  type?: TableColumnType;
  key?: string;
};

/** Ô dạng dữ liệu (như WebTable rows): mọi trường đều tùy chọn trừ text. */
export type TableCellData = {
  text: ReactNode;
  /** Dòng phụ 12px xám dưới chữ chính. */
  sub?: ReactNode;
  /** Chữ đậm 500 (tên chiến dịch, số tiền chính). */
  strong?: boolean;
  /** Chữ xám. */
  muted?: boolean;
  /** Màu chữ: good xanh lá, bad đỏ. */
  tone?: 'good' | 'bad' | '';
  /** Hiện như mã (chữ đơn cách, nền xám, chữ đỏ). */
  code?: boolean;
  /** Logo hãng trước chữ. */
  logo?: ProviderId;
  /** Có giá trị → ô là nhãn trạng thái (text là chữ của nhãn). */
  status?: StatusTone;
  /** Chữ chính là liên kết (vd. tên chiến dịch → trang chi tiết). */
  href?: string;
  /** Ảnh đại diện chữ cái trước chữ: true = lấy từ text, chuỗi = chữ cái ghi sẵn. */
  avatar?: boolean | string;
};

/** Một ô: TableCellData, chuỗi/số, hoặc ReactNode bất kỳ (nút, nhãn, liên kết…). */
export type TableCell = TableCellData | ReactNode;
export type TableRowObject = { key?: string; cells: TableCell[]; highlight?: boolean };
export type TableRow = TableCell[] | TableRowObject;

export type TableProps = {
  /** WebTable cols. */
  cols: TableColumn[];
  /** WebTable rows: mảng ô, hoặc { key, cells, highlight }. */
  rows: TableRow[];
  /** WebTable caption: tên bảng cho trình đọc màn hình (không hiện). Bắt buộc. */
  caption: string;
  /** WebTable emptyText khi không có dòng. Mặc định "Chưa có dữ liệu.". */
  emptyText?: ReactNode;
  /** WebTable addLabel: dòng "+ Mới" cuối bảng. Đi kèm addHref (liên kết) hoặc onAdd (chỉ trong Client Component). */
  addLabel?: string;
  addHref?: string;
  onAdd?: () => void;
  /** WebTable highlight: chỉ số dòng tô xám (dòng đang mở ở khung chi tiết bên cạnh). */
  highlight?: number;
  /** WebTable flush: bỏ đường kẻ trên tiêu đề (đặt ngay dưới <Tabs>). */
  flush?: boolean;
  /** Bề rộng tối thiểu (px) trước khi cuộn ngang. Mặc định: tổng cột px + 160px mỗi cột co giãn. */
  minWidth?: number;
  className?: string;
};

const MONEY_RE = /Đã chi|Số tiền|Số dư|Phí|Giá|Ước tính/;

/** Đoán loại cột từ nhãn (giống WebTable). */
export function guessColumnType(c: TableColumn): TableColumnType {
  if (c.type) return c.type;
  if (c.align === 'right') return MONEY_RE.test(c.label) ? 'money' : 'number';
  if (/Trạng thái|Kết quả|^Ví$/.test(c.label)) return 'status';
  if (/Ngày|Thời gian|Kiểm tra/.test(c.label)) return 'date';
  if (/Người dùng|Doanh nghiệp/.test(c.label)) return 'person';
  return 'text';
}

function track(w?: string): string {
  if (!w) return 'minmax(0,1fr)';
  return /^[\d.]+fr$/.test(w) ? `minmax(0,${w})` : w;
}

function minWidthOf(cols: TableColumn[]): number {
  return cols.reduce((sum, c) => {
    const px = c.w && /^(\d+(?:\.\d+)?)px$/.exec(c.w);
    return sum + (px ? Number(px[1]) : 160);
  }, 0);
}

function isCellData(c: TableCell): c is TableCellData {
  return typeof c === 'object' && c !== null && !Array.isArray(c) && !isValidElement(c) && 'text' in c;
}

function HeadIcon({ type }: { type: TableColumnType }) {
  const glyph = 'w-4 flex-none text-center text-hint';
  switch (type) {
    case 'text':
      return <span aria-hidden="true" className={cx(glyph, 'text-[12px] font-semibold')}>Aa</span>;
    case 'number':
      return <span aria-hidden="true" className={cx(glyph, 'text-[14px]')}>#</span>;
    case 'money':
      return <span aria-hidden="true" className={cx(glyph, 'text-[13px] font-semibold')}>đ</span>;
    case 'status':
      return <WebIcon name="status" size={15} strokeWidth={2} className="text-hint" />;
    case 'date':
      return <WebIcon name="calendar" size={15} strokeWidth={2} className="text-hint" />;
    case 'person':
      return <WebIcon name="user" size={15} strokeWidth={2} className="text-hint" />;
    default:
      return null;
  }
}

// Đường kẻ: vẽ bằng bóng trong trên từng ô (hàng dùng display: contents).
const headLine = {
  first: 'shadow-[inset_0_1px_0_var(--color-line),inset_0_-1px_0_var(--color-line)]',
  other: 'shadow-[inset_1px_0_0_var(--color-line),inset_0_1px_0_var(--color-line),inset_0_-1px_0_var(--color-line)]',
  firstFlush: 'shadow-line-b',
  otherFlush: 'shadow-[inset_1px_0_0_var(--color-line),inset_0_-1px_0_var(--color-line)]',
};
const bodyLine = {
  first: 'shadow-line-b',
  other: 'shadow-[inset_1px_0_0_var(--color-line),inset_0_-1px_0_var(--color-line)]',
};

function CellContent({ cell }: { cell: TableCell }) {
  if (!isCellData(cell)) {
    if (typeof cell === 'string' || typeof cell === 'number') {
      return <span className="text-[14px] leading-[1.45] tabular-nums">{cell}</span>;
    }
    return <>{cell}</>;
  }
  if (cell.status) return <Status tone={cell.status} text={cell.text} />;
  const color = cell.muted ? 'text-ink-2' : cell.tone === 'good' ? 'text-good' : cell.tone === 'bad' ? 'text-bad' : 'text-ink';
  const main = cell.code ? (
    <code className="self-start rounded-tag bg-code-bg px-1 font-mono text-[13px] leading-[1.6] text-code">{cell.text}</code>
  ) : (
    <span className={cx('text-[14px] leading-[1.45] tabular-nums', cell.strong ? 'font-medium' : 'font-normal', color)}>
      {cell.href ? (
        <Link href={cell.href} className="text-inherit no-underline decoration-line-strong underline-offset-2 hover:underline">
          {cell.text}
        </Link>
      ) : (
        cell.text
      )}
    </span>
  );
  const avatar =
    cell.avatar === true && typeof cell.text === 'string' ? (
      <Avatar name={cell.text} size={20} />
    ) : typeof cell.avatar === 'string' ? (
      <Avatar initials={cell.avatar} size={20} />
    ) : null;
  return (
    <span className="inline-flex max-w-full items-center gap-2">
      {cell.logo ? <ProviderMark provider={cell.logo} size={18} /> : null}
      {avatar}
      <span className="flex min-w-0 flex-col">
        {main}
        {cell.sub ? <span className="text-[12px] leading-[1.4] text-ink-2">{cell.sub}</span> : null}
      </span>
    </span>
  );
}

/**
 * Bảng dữ liệu kiểu database Notion (WebTable): đường kẻ cột, icon loại cột ở tiêu đề, dòng "Mới" ở cuối.
 * Là <table> thật (caption, th scope="col") dàn bằng CSS grid để giữ đúng độ rộng cột của thiết kế;
 * role được ghi rõ để trình đọc màn hình vẫn hiểu là bảng. Bảng rộng hơn khung thì cuộn ngang trong khung.
 * Dùng được trong Server Component (trừ onAdd).
 */
export function Table({
  cols,
  rows,
  caption,
  emptyText = 'Chưa có dữ liệu.',
  addLabel,
  addHref,
  onAdd,
  highlight,
  flush = false,
  minWidth,
  className,
}: TableProps) {
  const style = {
    gridTemplateColumns: cols.map((c) => track(c.w)).join(' '),
    minWidth: minWidth ?? minWidthOf(cols),
  } satisfies CSSProperties;
  const list: TableRowObject[] = rows.map((r) => (Array.isArray(r) ? { cells: r } : (r as TableRowObject)));
  const spanAll = { gridColumn: '1 / -1' } satisfies CSSProperties;
  return (
    <div className={cx('w-full overflow-x-auto', className)}>
      <table role="table" className="grid w-full border-collapse text-ink" style={style}>
        <caption className="sr-only">{caption}</caption>
        <thead role="rowgroup" className="contents">
          <tr role="row" className="contents">
            {cols.map((c, j) => {
              const right = c.align === 'right';
              return (
                <th
                  key={c.key ?? j}
                  role="columnheader"
                  scope="col"
                  className={cx(
                    'flex h-[33px] min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap px-2 text-left text-[14px] font-normal text-ink-2',
                    right && 'justify-end text-right',
                    j === 0 ? (flush ? headLine.firstFlush : headLine.first) : flush ? headLine.otherFlush : headLine.other,
                  )}
                >
                  <HeadIcon type={guessColumnType(c)} />
                  <span className="truncate">{c.label}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody role="rowgroup" className="contents">
          {list.length === 0 ? (
            <tr role="row" className="contents">
              <td role="cell" style={spanAll} className="px-2 py-3.5 text-[14px] text-ink-2 shadow-line-b">
                {emptyText}
              </td>
            </tr>
          ) : (
            list.map((row, i) => {
              const hl = row.highlight ?? highlight === i;
              return (
                <tr key={row.key ?? i} role="row" className="contents">
                  {row.cells.map((cell, j) => {
                    const right = cols[j]?.align === 'right';
                    return (
                      <td
                        key={cols[j]?.key ?? j}
                        role="cell"
                        className={cx(
                          'flex min-h-9 min-w-0 items-center px-2 py-1.5',
                          right ? 'justify-end text-right' : 'justify-start text-left',
                          hl ? 'bg-grey' : 'bg-white',
                          j === 0 ? bodyLine.first : bodyLine.other,
                        )}
                      >
                        <CellContent cell={cell} />
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
        {addLabel && (addHref || onAdd) ? (
          <tfoot role="rowgroup" className="contents">
            <tr role="row" className="contents">
              <td role="cell" style={spanAll} className="p-0">
                {addHref ? (
                  <Link
                    href={addHref}
                    className="flex h-[33px] w-full items-center gap-1.5 px-2 text-[14px] text-ink-2 no-underline shadow-line-b hover:bg-hover"
                  >
                    <WebIcon name="plus" size={16} />
                    {addLabel}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={onAdd}
                    className="flex h-[33px] w-full cursor-pointer items-center gap-1.5 border-0 bg-transparent px-2 text-left text-[14px] text-ink-2 shadow-line-b hover:bg-hover"
                  >
                    <WebIcon name="plus" size={16} />
                    {addLabel}
                  </button>
                )}
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
