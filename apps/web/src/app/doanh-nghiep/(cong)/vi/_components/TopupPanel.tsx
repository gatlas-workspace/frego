'use client';

import { useState } from 'react';
import { Button, Callout, Panel, Segmented } from '@/components/web';
import type { FormState } from '@/app/doanh-nghiep/_lib/form-state';
import { useFormSubmit } from '@/app/doanh-nghiep/_lib/use-form-submit';
import { reportTransferAction } from '../actions';
import { TransferQr } from './TransferQr';

/** Khung "Nạp tiền": chọn số tiền → mã QR + nội dung chuyển khoản → "Tôi đã chuyển khoản" (WebDnVi). */
export function TopupPanel({
  options,
  defaultAmount,
  transferCode,
}: {
  options: { value: number; label: string }[];
  defaultAmount: number;
  transferCode: string;
}) {
  const [amount, setAmount] = useState(String(defaultAmount));
  const [reported, setReported] = useState<string | null>(null);
  const { state, pending, onSubmit } = useFormSubmit(async (prev: FormState, fd: FormData) => {
    const next = await reportTransferAction(prev, fd);
    if (next.status === 'ok') setReported(String(fd.get('amount')));
    return next;
  });
  const label = options.find((o) => String(o.value) === amount)?.label ?? '';
  const paid = state.status === 'ok' && reported === amount;
  return (
    <Panel title="Nạp tiền" id="vi-nap" description="Chuyển khoản qua mã QR, tiền vào ví sau khi ngân hàng xác nhận.">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="w-full max-w-[380px]">
          <Segmented
            items={options.map((o) => ({ value: String(o.value), label: o.label }))}
            name="amount"
            label="Số tiền nạp"
            value={amount}
            onChange={setAmount}
          />
        </div>
        <div className="flex items-center gap-4 rounded-frame border border-line p-3 max-[480px]:flex-col max-[480px]:items-start">
          <TransferQr />
          <div className="flex min-w-0 flex-1 flex-col gap-[3px] text-[13px] leading-normal text-ink-2">
            <span>
              Số tiền: <b className="font-semibold text-ink tabular-nums">{label}</b>
            </span>
            <span>
              Nội dung: <b className="font-semibold text-ink">{transferCode}</b>
            </span>
            <span>Quét bằng app ngân hàng bất kỳ. Giữ nguyên nội dung để tiền vào đúng ví.</span>
          </div>
        </div>
        {paid ? (
          <div role="status">
            <Callout tone="green" icon="check" text={state.message} />
          </div>
        ) : (
          <div>
            <Button type="submit" variant="secondary" disabled={pending}>
              Tôi đã chuyển khoản
            </Button>
          </div>
        )}
        {state.status === 'error' ? <Callout tone="red" icon="x" role="alert" text={state.message} /> : null}
      </form>
    </Panel>
  );
}
