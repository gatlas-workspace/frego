'use client';

import { useActionState } from 'react';
import { Button, Status } from '@/components/web';
import { confirmTopupAction } from '../actions';

/**
 * Nút "Khớp giao dịch của …" dưới bảng Nạp tiền: khớp giao dịch đang chọn (hoặc giao dịch chờ đầu tiên),
 * xong thì hiện "Đã cộng … vào ví …". Còn giao dịch chờ khác thì hiện nút cho giao dịch đó.
 */
export function TopupMatch({ target, note }: { target: { id: string; businessName: string } | null; note: string }) {
  const [state, action, pending] = useActionState(confirmTopupAction, null);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2.5">
      {state ? (
        <span role={state.ok ? 'status' : 'alert'}>
          <Status text={state.message} tone={state.ok ? 'green' : 'red'} />
        </span>
      ) : null}
      {target ? (
        <form action={action} className="contents">
          <input type="hidden" name="transactionId" value={target.id} />
          <Button type="submit" icon="check" variant={state?.ok ? 'secondary' : 'primary'} disabled={pending}>
            {pending ? 'Đang khớp…' : `Khớp giao dịch của ${target.businessName}`}
          </Button>
        </form>
      ) : null}
      <span className="text-[13px] text-ink-2">{note}</span>
    </div>
  );
}
