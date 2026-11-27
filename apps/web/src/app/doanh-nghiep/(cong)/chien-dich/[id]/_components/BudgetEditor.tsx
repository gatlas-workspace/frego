'use client';

import { useState } from 'react';
import { formatNumber } from '@frego/core';
import { Button, Callout, Input } from '@/components/web';
import type { FormState } from '@/app/doanh-nghiep/_lib/form-state';
import { useFormSubmit } from '@/app/doanh-nghiep/_lib/use-form-submit';
import { updateCampaignBudgetAction } from '../actions';

/** "Ngân sách tối đa …" + "Sửa ngân sách" → ô nhập + Lưu → khối báo đã đổi (WebDnChiTietChienDich). */
export function BudgetEditor({ id, budget, budgetText }: { id: string; budget: number; budgetText: string }) {
  const [editing, setEditing] = useState(false);
  const { state, pending, onSubmit } = useFormSubmit(async (prev: FormState, fd: FormData) => {
    const next = await updateCampaignBudgetAction(prev, fd);
    if (next.status === 'ok') setEditing(false);
    return next;
  });
  const error = state.status === 'error' ? state.fieldErrors?.budget ?? state.message : undefined;
  return (
    <>
      {editing ? (
        <form onSubmit={onSubmit} className="flex flex-col gap-1.5">
          <input type="hidden" name="id" value={id} />
          <div className="flex items-end gap-2">
            <Input
              label="Ngân sách tối đa mới"
              id="ct-ngan-sach"
              name="budget"
              defaultValue={formatNumber(budget)}
              suffix="đ"
              inputMode="numeric"
              autoFocus
              error={!!error}
              className="min-w-0 flex-1"
            />
            <Button type="submit" disabled={pending}>
              Lưu
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Hủy
            </Button>
          </div>
          {error ? (
            <span role="alert" className="text-[12px] leading-[1.4] text-danger">
              {error}
            </span>
          ) : null}
        </form>
      ) : (
        <div className="flex items-center justify-between gap-3 pt-1.5">
          <span className="text-[14px]">
            Ngân sách tối đa <b className="font-medium tabular-nums">{budgetText}</b>
          </span>
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Sửa ngân sách
          </Button>
        </div>
      )}
      {state.status === 'ok' && !editing ? (
        <div role="status">
          <Callout tone="green" icon="check" text={state.message} />
        </div>
      ) : null}
    </>
  );
}
