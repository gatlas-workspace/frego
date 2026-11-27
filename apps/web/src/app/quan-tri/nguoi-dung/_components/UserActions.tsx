'use client';

import { useActionState, useState } from 'react';
import { Button, Callout, Input } from '@/components/web';
import { userAction, type UserActionState } from '../actions';

/**
 * Thao tác trong khung chi tiết người dùng: "Điều chỉnh điểm" (số điểm ± và lý do), "Tạm khóa" (lý do) / "Mở khóa".
 * Bấm nút thì mở form ngay trong khung; lưu xong form đóng lại và hiện kết quả.
 */
export function UserActions({ userId, name, locked }: { userId: string; name: string; locked: boolean }) {
  const [mode, setMode] = useState<'points' | 'lock' | null>(null);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [state, action, pending] = useActionState<UserActionState, FormData>(async (prev, fd) => {
    const r = await userAction(prev, fd);
    if (r?.ok) {
      setMode(null);
      setDelta('');
      setReason('');
    }
    return r;
  }, null);
  const fieldError = (f: 'delta' | 'reason') => (state && !state.ok && state.field === f ? state.message : undefined);
  const open = (m: 'points' | 'lock') => {
    setMode(m);
    setReason('');
  };

  return (
    <div className="flex flex-col gap-3">
      {state?.ok ? <Callout tone="green" icon="check" role="status" text={state.message} /> : null}
      {state && !state.ok && !state.field ? <Callout tone="red" icon="x" role="alert" text={state.message} /> : null}

      {mode === null ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => open('points')}>
            Điều chỉnh điểm
          </Button>
          {locked ? (
            <form action={action}>
              <input type="hidden" name="op" value="unlock" />
              <input type="hidden" name="userId" value={userId} />
              <input type="hidden" name="name" value={name} />
              <Button variant="secondary" size="sm" type="submit" disabled={pending}>
                Mở khóa
              </Button>
            </form>
          ) : (
            <Button variant="danger" size="sm" onClick={() => open('lock')}>
              Tạm khóa
            </Button>
          )}
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-3 rounded-ctl bg-sidebar p-3" aria-label={mode === 'points' ? 'Điều chỉnh điểm' : 'Tạm khóa người dùng'}>
          <input type="hidden" name="op" value={mode} />
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="name" value={name} />
          {mode === 'points' ? (
            <Input
              label="Số điểm cộng (+) hoặc trừ (−)"
              id={`diem-${userId}`}
              name="delta"
              inputMode="numeric"
              placeholder="VD: 50 hoặc -20"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              error={fieldError('delta')}
              autoFocus
            />
          ) : null}
          <Input
            label={mode === 'points' ? 'Lý do (ghi vào nhật ký)' : 'Lý do tạm khóa'}
            id={`ly-do-${mode}-${userId}`}
            name="reason"
            placeholder={mode === 'points' ? 'VD: Bù điểm báo giá chưa được cộng' : 'VD: Nhiều báo giá trùng nhau'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={fieldError('reason')}
            maxLength={200}
            autoFocus={mode === 'lock'}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setMode(null)} disabled={pending}>
              Hủy
            </Button>
            <Button variant={mode === 'lock' ? 'danger' : 'primary'} size="sm" type="submit" disabled={pending}>
              {mode === 'points' ? 'Lưu điều chỉnh' : 'Tạm khóa'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
