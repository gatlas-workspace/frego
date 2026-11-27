import 'server-only';
import { BizServiceError } from '@frego/core';
import type { FormState } from './form-state';

/** Lỗi trong server action → FormState: lỗi nghiệp vụ hiện nguyên văn, lỗi khác hiện câu chung (ghi log server). */
export function failState(e: unknown, fallback = 'Chưa lưu được. Thử lại sau ít phút.'): FormState {
  if (e instanceof BizServiceError) {
    return { status: 'error', message: e.message, fieldErrors: e.field ? { [e.field]: e.message } : undefined, at: Date.now() };
  }
  console.error('[doanh-nghiep]', e);
  return { status: 'error', message: fallback, at: Date.now() };
}

export function okState(message: string, note?: string): FormState {
  return { status: 'ok', message, note, at: Date.now() };
}
