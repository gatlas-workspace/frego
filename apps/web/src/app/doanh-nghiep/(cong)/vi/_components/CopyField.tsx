'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/web';

/**
 * Một dòng thông tin chuyển khoản + nút "Chép". Chạy được trong trình duyệt của Zalo, Facebook:
 * 1. navigator.clipboard (khi có và trang chạy https);
 * 2. không có → chọn chữ trong ô + document.execCommand('copy') (trình duyệt cũ, webview);
 * 3. vẫn không được → chữ đã được chọn sẵn, báo "Nhấn giữ để chép".
 */
export function CopyField({ label, value, copyValue, mono }: { label: string; value: string; copyValue?: string; mono?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const text = copyValue ?? value;

  const selectText = () => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.select();
    try {
      el.setSelectionRange(0, text.length);
    } catch {
      /* một số webview không hỗ trợ */
    }
  };

  const copy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setMsg('Đã chép');
        return;
      }
    } catch {
      /* thử cách dưới */
    }
    selectText();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    setMsg(ok ? 'Đã chép' : 'Chưa chép được. Chữ đã được chọn, nhấn giữ để chép.');
  };

  const id = `copy-${label.replace(/\s+/g, '-')}`;
  return (
    <div className="flex flex-col gap-0.5">
      <label htmlFor={id} className="text-[12px] text-ink-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          ref={ref}
          id={id}
          readOnly
          value={value}
          onFocus={selectText}
          className={`min-w-0 flex-1 rounded-ctl border border-line bg-white px-2 py-1.5 text-[14px] font-semibold text-ink ${mono ? 'font-mono' : ''}`}
        />
        <Button type="button" variant="secondary" size="sm" onClick={copy} aria-label={`Chép ${label.toLowerCase()}`}>
          Chép
        </Button>
      </div>
      {msg ? (
        <span role="status" className="text-[12px] text-ink-2">
          {msg}
        </span>
      ) : null}
    </div>
  );
}
