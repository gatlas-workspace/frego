'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Button, Callout, Textarea } from '@/components/web';
import { replyTicketAction, type ReplyState } from '../actions';

/** Ô trả lời yêu cầu hỗ trợ: gửi xong thì xóa ô, cuộc trò chuyện phía trên tự cập nhật. */
export function ReplyBox({ ticketId }: { ticketId: string }) {
  const [state, action, pending] = useActionState<ReplyState, FormData>(replyTicketAction, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);
  return (
    <form ref={form} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={ticketId} />
      <Textarea label="Trả lời" id={`tra-loi-${ticketId}`} name="body" rows={4} maxLength={2000} placeholder="Nhập câu trả lời gửi người dùng" />
      {state ? <Callout tone={state.ok ? 'green' : 'red'} icon={state.ok ? 'check' : 'x'} role={state.ok ? 'status' : 'alert'} text={state.message} /> : null}
      <div>
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? 'Đang gửi…' : 'Gửi trả lời'}
        </Button>
      </div>
    </form>
  );
}
