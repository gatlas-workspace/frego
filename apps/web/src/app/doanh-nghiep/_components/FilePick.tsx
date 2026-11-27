'use client';

import { useId, useState, type ReactNode } from 'react';
import { formatNumber } from '@frego/core';
import { FileRow, Status, buttonClass, cx, type AnyIconName } from '@/components/web';

function sizeText(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  return `${formatNumber(Math.max(1, Math.round(bytes / 1024)))} KB`;
}

/**
 * Dòng chọn tệp (giấy tờ, ảnh mặt tiền, logo). Chưa có kho tệp nên chỉ ghi nhận tên tệp đã chọn ở trình duyệt;
 * trạng thái "Đã chọn" báo cho form cha qua onPick. Ô chọn tệp không có name nên tệp không bị gửi kèm form.
 */
export function FilePick({
  name,
  meta,
  icon = 'receipt',
  leading,
  accept,
  buttonLabel,
  onPick,
  disabled,
  framed = true,
}: {
  name: ReactNode;
  meta: ReactNode;
  icon?: AnyIconName;
  leading?: ReactNode;
  accept: string;
  buttonLabel: string;
  onPick?: (picked: boolean) => void;
  disabled?: boolean;
  /** false: dòng không viền (ảnh logo ở Tạo chiến dịch, Hồ sơ cửa hàng). */
  framed?: boolean;
}) {
  const id = useId();
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const shownName = file ? file.name : name;
  const shownMeta = file ? `Đã chọn · ${sizeText(file.size)}` : meta;
  const trailing = (
    <span className="flex flex-none items-center gap-2">
      {file ? <Status text="Đã chọn" tone="green" /> : null}
      <input
        id={id}
        type="file"
        accept={accept}
        disabled={disabled}
        className="peer sr-only"
        onChange={(e) => {
          const f = e.currentTarget.files?.[0];
          setFile(f ? { name: f.name, size: f.size } : null);
          onPick?.(!!f);
        }}
      />
      <label
        htmlFor={id}
        className={cx(
          buttonClass({ variant: 'secondary', size: 'sm', disabled }),
          'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue',
        )}
      >
        {file ? 'Đổi tệp' : buttonLabel}
      </label>
    </span>
  );
  if (framed) return <FileRow icon={icon} leading={leading} name={shownName} meta={shownMeta} trailing={trailing} />;
  return (
    <div className="flex items-center gap-3">
      {leading}
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-[14px]">{shownName}</span>
        <span className="text-[13px] text-ink-2">{shownMeta}</span>
      </span>
      {trailing}
    </div>
  );
}
