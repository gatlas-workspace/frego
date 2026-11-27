'use client';

import { useEffect, useState } from 'react';
import { Button, Callout, Panel, Segmented } from '@/components/web';
import type { FormState } from '@/app/doanh-nghiep/_lib/form-state';
import { useFormSubmit } from '@/app/doanh-nghiep/_lib/use-form-submit';
import { reportTransferAction, startPayosTopupAction } from '../actions';
import { CopyField } from './CopyField';

type Bank = { bankName: string; accountNumber: string; accountName: string; branch: string };

/**
 * Khung "Nạp tiền": chọn số tiền →
 * - có PayOS: "Thanh toán bằng VietQR" mở trang PayOS (mã QR thật, tiền vào ví tự động);
 * - chuyển khoản tay: tên ngân hàng, số tài khoản, chủ tài khoản, số tiền, nội dung RIÊNG của lần nạp này (mỗi dòng có
 *   nút Chép, chạy được trong trình duyệt Zalo/Facebook) → "Tôi đã chuyển khoản".
 * Không còn mã QR minh họa (quét không được, dễ gây hiểu lầm trên điện thoại).
 */
export function TopupPanel({
  options,
  defaultAmount,
  nextReference,
  bank,
  payos,
  canPay,
}: {
  options: { value: number; label: string }[];
  defaultAmount: number;
  nextReference: string;
  bank: Bank;
  payos: boolean;
  canPay: boolean;
}) {
  const [amount, setAmount] = useState(String(defaultAmount));
  const [reported, setReported] = useState<{ amount: string; message: string } | null>(null);
  const transfer = useFormSubmit(async (prev: FormState, fd: FormData) => {
    const next = await reportTransferAction(prev, fd);
    if (next.status === 'ok') setReported({ amount: String(fd.get('amount')), message: next.message ?? '' });
    return next;
  });
  const online = useFormSubmit(startPayosTopupAction);
  const checkoutUrl = online.state.status === 'ok' ? online.state.note : undefined;
  useEffect(() => {
    if (checkoutUrl) window.location.assign(checkoutUrl);
  }, [checkoutUrl]);

  const label = options.find((o) => String(o.value) === amount)?.label ?? '';
  const amountItems = options.map((o) => ({ value: String(o.value), label: o.label }));
  const unset = bank.accountNumber.startsWith('[');

  return (
    <Panel
      title="Nạp tiền"
      id="vi-nap"
      description={payos ? 'Thanh toán bằng mã VietQR qua PayOS, tiền vào ví ngay khi ngân hàng báo.' : 'Chuyển khoản tới tài khoản của Frego, tiền vào ví sau khi Frego khớp.'}
    >
      <div className="flex flex-col gap-3">
        <div className="w-full max-w-[380px]">
          <Segmented items={amountItems} name="amount-pick" label="Số tiền nạp" value={amount} onChange={setAmount} />
        </div>

        {payos ? (
          <form onSubmit={online.onSubmit} className="flex flex-col gap-2">
            <input type="hidden" name="amount" value={amount} />
            <div>
              <Button type="submit" disabled={!canPay || online.pending || !!checkoutUrl}>
                {online.pending || checkoutUrl ? 'Đang mở PayOS…' : `Thanh toán ${label} bằng VietQR`}
              </Button>
            </div>
            {online.state.status === 'error' ? <Callout tone="red" icon="x" role="alert" text={online.state.message} /> : null}
            <span className="text-[13px] text-ink-2">Hoặc chuyển khoản tay theo thông tin dưới đây.</span>
          </form>
        ) : null}

        <form onSubmit={transfer.onSubmit} className="flex flex-col gap-3">
          <input type="hidden" name="amount" value={amount} />
          <input type="hidden" name="reference" value={nextReference} />
          <div className="flex flex-col gap-2.5 rounded-frame border border-line p-3">
            <div className="flex flex-col gap-0.5 text-[13px] leading-normal text-ink-2">
              <span>
                Ngân hàng: <b className="font-semibold text-ink">{bank.bankName}</b>
                {bank.branch && !bank.branch.startsWith('[') ? `, ${bank.branch}` : ''}
              </span>
              <span>
                Chủ tài khoản: <b className="font-semibold text-ink">{bank.accountName}</b>
              </span>
            </div>
            <CopyField label="Số tài khoản" value={bank.accountNumber} mono />
            <CopyField label="Số tiền" value={label} copyValue={amount} />
            <CopyField label="Nội dung chuyển khoản" value={nextReference} mono />
            <span className="text-[13px] leading-normal text-ink-2">
              Ghi đúng nội dung <b className="font-semibold text-ink">{nextReference}</b>: mỗi lần nạp có nội dung riêng để Frego khớp đúng
              lần nạp này.
            </span>
            {unset ? (
              <Callout tone="amber" text="Bản thử: Frego chưa điền số tài khoản nhận tiền. Đừng chuyển khoản theo thông tin này." />
            ) : null}
          </div>
          {reported && reported.amount === amount ? (
            <div role="status" className="flex flex-col gap-2">
              <Callout tone="green" icon="check" text={reported.message} />
              <div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setReported(null)}>
                  Nạp thêm lần khác
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Button type="submit" variant="secondary" disabled={!canPay || transfer.pending}>
                Tôi đã chuyển khoản
              </Button>
            </div>
          )}
          {transfer.state.status === 'error' ? <Callout tone="red" icon="x" role="alert" text={transfer.state.message} /> : null}
        </form>
      </div>
    </Panel>
  );
}
