'use client';

import { useState } from 'react';
import { cx } from '@/components/web';

/**
 * Ô mã mời + nút "Chép mã" (V3-TrangMoi). Chạy được trong trình duyệt của Zalo, Facebook:
 * 1. navigator.clipboard (khi có và trang chạy https);
 * 2. không có → document.execCommand('copy') trên ô chữ ẩn (webview cũ);
 * 3. vẫn không được → báo "Giữ ngón tay lên mã để chép"; mã luôn chọn được cả cụm (user-select: all).
 */
export function InviteCode({ code }: { code: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');

  const fallbackCopy = (): boolean => {
    try {
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        ta.setSelectionRange(0, code.length);
      } catch {
        /* một số webview không hỗ trợ */
      }
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  const copy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        setState('ok');
        return;
      }
    } catch {
      /* thử cách dưới */
    }
    setState(fallbackCopy() ? 'ok' : 'fail');
  };

  return (
    <section aria-labelledby="ma-moi" className="flex flex-col gap-2.5 rounded-[10px] border border-dashed border-line-strong bg-field p-4">
      <span id="ma-moi" className="text-[13px] font-semibold text-ink-2">
        Mã mời
      </span>
      <div className="flex items-center justify-between gap-3">
        <span className="select-all text-[30px] font-bold tracking-[3px] text-ink [-webkit-user-select:all]">{code}</span>
        {state === 'ok' ? (
          <span
            role="status"
            className="flex min-h-11 min-w-[88px] flex-none items-center justify-center rounded-lg bg-tag-green px-3.5 text-[14px] font-semibold text-tag-green-ink"
          >
            Đã chép
          </span>
        ) : (
          <button
            type="button"
            onClick={copy}
            aria-label={`Chép mã ${code}`}
            className={cx(
              'min-h-11 min-w-[88px] flex-none cursor-pointer rounded-lg border border-line-strong bg-white px-3.5 text-[14px] font-semibold text-ink',
              'hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue',
            )}
          >
            Chép mã
          </button>
        )}
      </div>
      {state === 'fail' ? (
        <p role="alert" className="m-0 rounded-md bg-tag-amber px-2.5 py-2 text-[13px] leading-normal text-tag-amber-ink">
          Trình duyệt này không cho chép tự động. Giữ ngón tay lên mã để chép.
        </p>
      ) : null}
    </section>
  );
}
