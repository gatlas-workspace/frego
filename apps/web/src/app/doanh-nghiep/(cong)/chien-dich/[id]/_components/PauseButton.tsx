'use client';

import { Button } from '@/components/web';
import { useFormSubmit } from '@/app/doanh-nghiep/_lib/use-form-submit';
import { setCampaignPausedAction } from '../actions';

/** Nút "Tạm dừng" (đang chạy) hoặc "Tiếp tục chạy" (đang tạm dừng). Trạng thái mới hiện ngay ở đầu trang. */
export function PauseButton({ id, running }: { id: string; running: boolean }) {
  const { state, pending, onSubmit } = useFormSubmit(setCampaignPausedAction);
  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="paused" value={running ? '1' : '0'} />
      {state.status === 'error' ? (
        <span role="alert" className="text-[13px] text-danger">
          {state.message}
        </span>
      ) : null}
      <Button type="submit" variant={running ? 'secondary' : 'primary'} disabled={pending}>
        {running ? 'Tạm dừng' : 'Tiếp tục chạy'}
      </Button>
    </form>
  );
}
