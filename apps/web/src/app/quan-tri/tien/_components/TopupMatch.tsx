'use client';

import { useState, useTransition } from 'react';
import { Button, Status } from '@/components/web';
import { confirmTopupAction } from '../actions';

type Pending = { id: string; businessName: string; amountText: string; reference: string; timeText: string };

/**
 * Nạp tiền chờ khớp: mỗi dòng có nút "Khớp 5.000.000đ" riêng → hỏi lại (doanh nghiệp, số tiền, nội dung chuyển khoản)
 * → cộng vào ví. Khớp xong dòng đó hiện "Đã cộng …"; KHÔNG tự chuyển sang dòng kế (tránh bấm nhầm hai lần).
 */
export function TopupMatch({ rows, note }: { rows: Pending[]; note: string }) {
  const [asking, setAsking] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { ok: boolean; message: string }>>({});
  // Dòng đã khớp vẫn hiện (máy chủ làm mới thì dòng đó rời danh sách chờ).
  const [kept, setKept] = useState<Pending[]>([]);
  const [pending, startTransition] = useTransition();
  const shown = [...kept.filter((k) => !rows.some((r) => r.id === k.id)), ...rows];

  const confirm = (row: Pending) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.set('transactionId', row.id);
      const r = await confirmTopupAction(null, fd);
      if (r) {
        setResults((m) => ({ ...m, [row.id]: { ok: r.ok, message: r.message } }));
        if (r.ok) setKept((k) => (k.some((x) => x.id === row.id) ? k : [...k, row]));
      }
      setAsking(null);
    });
  };

  return (
    <div className="mt-3 flex flex-col gap-2">
      <h3 className="m-0 text-[14px] font-semibold text-ink">Chờ khớp</h3>
      {shown.length === 0 ? <p className="m-0 text-[13px] text-ink-2">Không có lần nạp nào chờ khớp.</p> : null}
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {shown.map((row) => {
          const res = results[row.id];
          const done = res?.ok;
          return (
            <li key={row.id} className="flex flex-col gap-2 rounded-frame border border-line p-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-2">
                <b className="font-semibold text-ink">{row.businessName}</b>
                <span className="tabular-nums">{row.timeText}</span>
                <span>
                  Nội dung <code className="font-mono text-ink">{row.reference}</code>
                </span>
                <b className="font-semibold tabular-nums text-ink">{row.amountText}</b>
              </div>
              {res ? (
                <span role={res.ok ? 'status' : 'alert'}>
                  <Status text={res.message} tone={res.ok ? 'green' : 'red'} />
                </span>
              ) : null}
              {done ? null : asking === row.id ? (
                <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Xác nhận khớp ${row.amountText}`}>
                  <span className="text-[13px] text-ink">
                    Cộng {row.amountText} vào ví {row.businessName}? Chỉ khớp khi sao kê có đúng số tiền và nội dung {row.reference}.
                  </span>
                  <Button type="button" icon="check" disabled={pending} onClick={() => confirm(row)}>
                    {pending ? 'Đang khớp…' : 'Xác nhận khớp'}
                  </Button>
                  <Button type="button" variant="secondary" disabled={pending} onClick={() => setAsking(null)}>
                    Hủy
                  </Button>
                </div>
              ) : (
                <div>
                  <Button type="button" variant="secondary" icon="check" disabled={pending} onClick={() => setAsking(row.id)}>
                    Khớp {row.amountText}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <span className="text-[13px] text-ink-2">{note}</span>
    </div>
  );
}
