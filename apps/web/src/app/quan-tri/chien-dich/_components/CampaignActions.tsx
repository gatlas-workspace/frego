'use client';

import { useActionState, useState } from 'react';
import { Button, Callout, Input } from '@/components/web';
import { campaignAction, type CampaignActionState } from '../actions';

export type CampaignActionsProps = {
  campaignId: string;
  canPause: boolean;
  canResume: boolean;
  note: string | null;
  reviewHref: string | null;
};

/** Thao tác trong khung chi tiết chiến dịch: "Tạm dừng ngay" (nhập lý do) hoặc "Cho chạy lại". */
export function CampaignActions({ campaignId, canPause, canResume, note, reviewHref }: CampaignActionsProps) {
  const [pausing, setPausing] = useState(false);
  const [reason, setReason] = useState('');
  const [state, action, pending] = useActionState<CampaignActionState, FormData>(async (prev, fd) => {
    const r = await campaignAction(prev, fd);
    if (r?.ok) {
      setPausing(false);
      setReason('');
    }
    return r;
  }, null);

  return (
    <div className="flex flex-col gap-3">
      {state?.ok ? <Callout tone="green" icon="check" role="status" text={state.message} /> : null}
      {state && !state.ok && !state.field ? <Callout tone="red" icon="x" role="alert" text={state.message} /> : null}
      {note ? <Callout text={note} /> : null}
      {reviewHref ? (
        <div>
          <Button variant="secondary" size="sm" href={reviewHref} iconRight="chev">
            Xử lý ở mục Duyệt
          </Button>
        </div>
      ) : null}
      {canResume ? (
        <form action={action}>
          <input type="hidden" name="op" value="resume" />
          <input type="hidden" name="campaignId" value={campaignId} />
          <Button type="submit" size="sm" disabled={pending}>
            Cho chạy lại
          </Button>
        </form>
      ) : null}
      {canPause && !pausing ? (
        <div>
          <Button variant="danger" size="sm" onClick={() => setPausing(true)}>
            Tạm dừng ngay
          </Button>
        </div>
      ) : null}
      {canPause && pausing ? (
        <form action={action} className="flex flex-col gap-3 rounded-ctl bg-sidebar p-3" aria-label="Tạm dừng chiến dịch">
          <input type="hidden" name="op" value="pause" />
          <input type="hidden" name="campaignId" value={campaignId} />
          <Input
            label="Lý do tạm dừng (gửi doanh nghiệp)"
            id={`ly-do-dung-${campaignId}`}
            name="reason"
            placeholder="VD: bị báo lỗi"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={state && !state.ok && state.field === 'reason' ? state.message : undefined}
            help="App ngừng phát mã mới ngay. Mã đã phát vẫn dùng được."
            maxLength={120}
            autoFocus
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPausing(false)} disabled={pending}>
              Hủy
            </Button>
            <Button variant="danger" size="sm" type="submit" disabled={pending}>
              Tạm dừng
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
