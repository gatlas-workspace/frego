import { formatNumber } from '@frego/core';
import { cx } from './cx';

export type Bar = {
  /** Nhãn trục ngang ("1", "15", "16h", "T7"); để "" nếu muốn thưa nhãn. */
  label?: string;
  value: number;
  /** Cột nổi bật: tô xanh đậm và hiện số phía trên (thiết kế: `hi`). */
  highlight?: boolean;
  hi?: boolean;
  /** Chữ số hiện trên cột nổi bật. Mặc định là value định dạng "1.250". */
  valueText?: string;
  /** Nhãn đầy đủ trong bảng ẩn cho trình đọc màn hình (vd. "14/11") khi nhãn trục để trống. */
  srLabel?: string;
};

export type BarChartProps = {
  /** WebBarChart bars. */
  bars: Bar[];
  /** WebBarChart height: chiều cao vùng vẽ, px (thiết kế: 130–150). Mặc định 150. */
  height?: number;
  /** WebBarChart summary: câu tóm tắt cho trình đọc màn hình, vd. "…cao nhất ngày 14/11 với 35 chuyến". */
  summary: string;
  /** Thêm bảng số liệu ẩn (chỉ trình đọc màn hình) sau biểu đồ. Mặc định true. */
  dataTable?: boolean;
  /** Tên cột trong bảng ẩn. */
  labelHeader?: string;
  valueHeader?: string;
  className?: string;
};

function niceScale(max: number) {
  const raw = Math.max(1, max);
  const pow = Math.pow(10, Math.floor(Math.log10(raw / 3)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => raw / s <= 4) ?? 10 * pow;
  return { step, top: Math.ceil(raw / step) * step };
}

/**
 * Biểu đồ cột (WebBarChart): HTML/CSS thuần, không thư viện. Cột xanh đậm là giá trị nổi bật,
 * các cột khác xanh nhạt; vạch chia trục dọc theo bước "đẹp" (1, 2, 2.5, 5 × 10ⁿ).
 * Hình vẽ là role="img" với `summary`; số liệu chi tiết nằm trong bảng ẩn.
 */
export function BarChart({
  bars,
  height = 150,
  summary,
  dataTable = true,
  labelHeader = 'Mốc',
  valueHeader = 'Giá trị',
  className,
}: BarChartProps) {
  const plot = height;
  const { step, top } = niceScale(Math.max(0, ...bars.map((b) => Number(b.value) || 0)));
  const ticks: { y: number; label: string; zero: boolean }[] = [];
  for (let v = top; v >= 0; v -= step) {
    ticks.push({ y: Math.round(plot - (v / top) * plot) + 3, label: formatNumber(v), zero: v === 0 });
  }
  const dense = bars.length > 16;
  const gap = dense ? 5 : 10;
  const barMax = dense ? 20 : 30;
  return (
    <div className={cx('w-full', className)}>
      <div role="img" aria-label={summary} className="relative w-full text-ink" style={{ height: plot + 34 }}>
        {ticks.map((t) => (
          <span key={t.label} aria-hidden="true" className="absolute inset-x-0 flex items-center gap-2" style={{ top: t.y }}>
            <span className="w-[34px] flex-none text-right text-[11px] leading-none text-ink-2 tabular-nums">{t.label}</span>
            <span className={cx('h-px flex-1', t.zero ? 'bg-line' : 'bg-grey')} />
          </span>
        ))}
        <div aria-hidden="true" className="absolute left-[42px] right-0 top-2.5 flex items-end" style={{ height: plot, gap }}>
          {bars.map((b, i) => {
            const v = Number(b.value) || 0;
            const h = Math.max(2, Math.round((v / top) * plot));
            const hi = !!(b.highlight ?? b.hi);
            return (
              <span key={i} className="relative flex h-full min-w-0 flex-1 basis-0 flex-col items-center justify-end">
                {hi ? (
                  <span
                    className="absolute whitespace-nowrap text-[11px] font-semibold leading-none text-blue-deep"
                    style={{ bottom: h + 3 }}
                  >
                    {b.valueText ?? formatNumber(v)}
                  </span>
                ) : null}
                <span
                  className={cx('w-full rounded-t-[2px]', hi ? 'bg-blue' : 'bg-blue-bar')}
                  style={{ height: h, maxWidth: barMax }}
                />
              </span>
            );
          })}
        </div>
        <div aria-hidden="true" className="absolute left-[42px] right-0 flex" style={{ top: plot + 16, gap }}>
          {bars.map((b, i) => (
            <span key={i} className="min-w-0 flex-1 basis-0 whitespace-nowrap text-center text-[11px] leading-none text-ink-2">
              {b.label ?? ''}
            </span>
          ))}
        </div>
      </div>
      {dataTable ? (
        <div className="sr-only">
          <table>
            <caption>{summary}</caption>
            <thead>
              <tr>
                <th scope="col">{labelHeader}</th>
                <th scope="col">{valueHeader}</th>
              </tr>
            </thead>
            <tbody>
              {bars.map((b, i) => (
                <tr key={i}>
                  <td>{b.srLabel ?? (b.label || String(i + 1))}</td>
                  <td>{b.valueText ?? formatNumber(Number(b.value) || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
