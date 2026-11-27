'use client';

import { useActionState, useState } from 'react';
import { Button, Callout, Input } from '@/components/web';
import { bizAction, type BizActionState } from '../actions';

export type BizActionsProps = {
  businessId: string;
  status: 'pending' | 'active' | 'locked' | 'rejected' | 'draft';
  lockNote: string | null;
  reviewHref: string | null;
};

/**
 * Thao tác cuối khung chi tiết doanh nghiệp (WebQtDoanhNghiep): "Nhắc nạp ví" → thông báo đã gửi;
 * "Tạm khóa" → nhập lý do rồi xác nhận; doanh nghiệp đang khóa → "Mở khóa"; hồ sơ chờ duyệt → sang mục Duyệt.
 */
export function BizActions({ businessId, status, lockNote, reviewHref }: BizActionsProps) {
  const [locking, setLocking] = useState(false);
  const [reason, setReason] = useState('');
  const [state, action, pending] = useActionState<BizActionState, FormData>(async (prev, fd) => {
    const r = await bizAction(prev, fd);
    if (r?.ok) {
      setLocking(false);
      setReason('');
    }
    return r;
  }, null);
  const hidden = (op: string) => (
    <>
      <input type="hidden" name="op" value={op} />
      <input type="hidden" name="businessId" value={businessId} />
    </>
  );
  const reminded = state?.ok && state.op === 'remind';

  return (
    <div className="flex flex-col gap-3">
      {state?.ok ? (
        <div role="status">
          <Callout tone="green" icon="check" text={state.message} />
        </div>
      ) : null}
      {state && !state.ok && !state.field ? <Callout tone="red" icon="x" role="alert" text={state.message} /> : null}

      {status === 'pending' && reviewHref ? (
        <>
          <Callout tone="amber" icon="clock" text="Hồ sơ đang chờ Frego duyệt. Doanh nghiệp chưa tạo được chiến dịch." />
          <div>
            <Button variant="secondary" size="sm" href={reviewHref} iconRight="chev">
              Xem hồ sơ ở mục Duyệt
            </Button>
          </div>
        </>
      ) : null}

      {status === 'locked' ? (
        <>
          {lockNote ? <Callout text={lockNote} /> : null}
          <form action={action} className="flex flex-wrap items-center gap-2">
            {hidden('unlock')}
            <Button variant="secondary" size="sm" type="submit" disabled={pending}>
              Mở khóa
            </Button>
            <span className="text-[13px] text-ink-2">Chiến dịch đã dừng không tự chạy lại.</span>
          </form>
        </>
      ) : null}

      {status === 'active' && !locking ? (
        <div className="flex flex-wrap gap-2">
          {reminded ? null : (
            <form action={action}>
              {hidden('remind')}
              <Button variant="secondary" size="sm" type="submit" disabled={pending}>
                Nhắc nạp ví
              </Button>
            </form>
          )}
          <Button variant="danger" size="sm" onClick={() => setLocking(true)}>
            Tạm khóa
          </Button>
        </div>
      ) : null}

      {status === 'active' && locking ? (
        <form action={action} className="flex flex-col gap-3 rounded-ctl bg-sidebar p-3" aria-label="Tạm khóa doanh nghiệp">
          {hidden('lock')}
          <Input
            label="Lý do tạm khóa (gửi doanh nghiệp)"
            id={`ly-do-khoa-${businessId}`}
            name="reason"
            placeholder="VD: Nhiều khách báo quán không nhận mã"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={state && !state.ok && state.field === 'reason' ? state.message : undefined}
            help="Mọi chiến dịch đang chạy sẽ dừng ngay."
            maxLength={200}
            autoFocus
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setLocking(false)} disabled={pending}>
              Hủy
            </Button>
            <Button variant="danger" size="sm" type="submit" disabled={pending}>
              Tạm khóa
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
