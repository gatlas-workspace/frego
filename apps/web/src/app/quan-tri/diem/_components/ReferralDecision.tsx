'use client';

import { useActionState } from 'react';
import { Button, Input } from '@/components/web';
import { setReferralStatusAction, type ReferralDecisionState } from '../actions';

/**
 * Duyệt / Từ chối một lượt giới thiệu đang "giữ để kiểm tra" (QT 8 · tab Giới thiệu).
 * Duyệt: cộng 200 điểm người giới thiệu + 100 điểm người mới. Từ chối cần ghi chú (lý do).
 */
export function ReferralDecision({ id, label }: { id: string; label: string }) {
  const [state, action, pending] = useActionState<ReferralDecisionState, FormData>(setReferralStatusAction, null);
  return (
    <form action={action} className="flex min-w-0 flex-col gap-1.5" aria-busy={pending || undefined} aria-label={label}>
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-wrap items-end gap-2">
        <Input
          label="Ghi chú (bắt buộc khi từ chối)"
          id={`ghi-chu-${id}`}
          name="note"
          hideLabel
          placeholder="Ghi chú, VD lý do từ chối"
          className="min-w-[160px] flex-1"
          error={state && !state.ok && state.field === 'note' ? state.message : undefined}
        />
        <Button type="submit" name="status" value="rejected" variant="danger" size="sm" disabled={pending}>
          Từ chối
        </Button>
        <Button type="submit" name="status" value="rewarded" icon="check" size="sm" disabled={pending}>
          Duyệt
        </Button>
      </div>
      {state && (state.ok || state.field !== 'note') ? (
        <span role={state.ok ? 'status' : 'alert'} className={state.ok ? 'text-[12px] text-ink-2' : 'text-[12px] text-danger'}>
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
