'use client';

import { useActionState } from 'react';
import { Button, Callout, Input } from '@/components/web';
import { reviewPhotoAction, type PhotoReviewState } from '../actions';

/** Nút Từ chối / Duyệt + ô lý do cho một ảnh tại quán đang chờ. */
export function PhotoDecision({ id, label }: { id: string; label: string }) {
  const [state, action, pending] = useActionState<PhotoReviewState, FormData>(reviewPhotoAction, null);
  if (state?.ok) {
    return <Callout tone="green" icon="check" role="status" text={state.message} />;
  }
  return (
    <form action={action} aria-label={label} aria-busy={pending || undefined} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <Input
        label="Lý do từ chối (gửi người dùng)"
        id={`ly-do-${id}`}
        name="reason"
        placeholder="VD: Ảnh không thấy quán, chụp lại mặt tiền"
        error={state && !state.ok && state.field === 'reason' ? state.message : undefined}
      />
      {state && !state.ok && !state.field ? <Callout tone="red" icon="x" role="alert" text={state.message} /> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="submit" name="decision" value="reject" variant="danger" disabled={pending}>
          Từ chối
        </Button>
        <Button type="submit" name="decision" value="approve" icon="check" disabled={pending}>
          Duyệt +50 điểm
        </Button>
      </div>
    </form>
  );
}
