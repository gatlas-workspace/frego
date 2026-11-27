'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/web';
import type { FormState } from '@/app/doanh-nghiep/_lib/form-state';
import { useFormSubmit } from '@/app/doanh-nghiep/_lib/use-form-submit';
import { saveInvoiceEmailAction } from '../actions';

/** Ô "Email nhận hóa đơn": hiện nút Lưu khi đổi. */
export function InvoiceEmailForm({ email, disabled }: { email: string; disabled?: boolean }) {
  const [value, setValue] = useState(email);
  const [saved, setSaved] = useState(email);
  const { state, pending, onSubmit } = useFormSubmit(async (prev: FormState, fd: FormData) => {
    const next = await saveInvoiceEmailAction(prev, fd);
    if (next.status === 'ok') setSaved(String(fd.get('invoiceEmail') ?? '').trim().toLowerCase());
    return next;
  });
  const dirty = value.trim().toLowerCase() !== saved;
  const error = state.status === 'error' && dirty ? state.message : undefined;
  return (
    <form onSubmit={onSubmit} noValidate className="mt-2 flex flex-col gap-1.5">
      <div className="flex items-end gap-2">
        <Input
          label="Email nhận hóa đơn"
          id="vi-email"
          name="invoiceEmail"
          type="email"
          autoComplete="email"
          value={value}
          onChange={(e) => setValue(e.currentTarget.value)}
          disabled={disabled}
          error={!!error}
          className="min-w-0 flex-1"
        />
        {dirty ? (
          <Button type="submit" variant="secondary" disabled={pending}>
            Lưu
          </Button>
        ) : null}
      </div>
      {error ? (
        <span role="alert" className="text-[12px] leading-[1.4] text-danger">
          {error}
        </span>
      ) : state.status === 'ok' && !dirty ? (
        <span role="status" className="text-[12px] leading-[1.4] text-good-ink">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
