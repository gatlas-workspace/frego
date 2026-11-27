'use client';

import { useState, useTransition } from 'react';
import { ToggleRow } from '@/components/web';
import { setAutoTopupAction } from '../actions';

/** Công tắc "Tự nạp … khi số dư dưới …": lưu ngay khi bật/tắt, lỗi thì trả về như cũ. */
export function AutoTopupToggle({ enabled, title, sub, disabled }: { enabled: boolean; title: string; sub: string; disabled?: boolean }) {
  const [on, setOn] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-1.5">
      <ToggleRow
        title={title}
        description={sub}
        label="Tự nạp tiền khi số dư thấp"
        checked={on}
        disabled={disabled || pending}
        onChange={(next) => {
          setOn(next);
          setError(null);
          startTransition(async () => {
            const r = await setAutoTopupAction(next);
            if (r.status === 'error') {
              setOn(!next);
              setError(r.message ?? 'Chưa lưu được.');
            }
          });
        }}
      />
      {error ? (
        <span role="alert" className="text-[12px] text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
