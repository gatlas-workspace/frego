'use client';

import { useActionState, useTransition, type FormEvent } from 'react';
import { IDLE_STATE, type FormState } from './form-state';

/**
 * useActionState gửi bằng onSubmit (không dùng thuộc tính action của <form>), nên React không tự xóa
 * các ô nhập sau khi gửi — giữ nguyên chữ người dùng gõ khi có lỗi. Nút gửi có name/value (vd. intent=draft)
 * được thêm vào FormData qua SubmitEvent.submitter.
 */
export function useFormSubmit(action: (prev: FormState, fd: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, IDLE_STATE);
  const [, startTransition] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | HTMLInputElement | null;
    if (submitter && submitter.name) fd.set(submitter.name, submitter.value);
    startTransition(() => dispatch(fd));
  };
  return { state, pending, onSubmit };
}
