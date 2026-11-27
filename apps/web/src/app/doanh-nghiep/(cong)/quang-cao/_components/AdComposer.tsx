'use client';

import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import type { BizAdView } from '@frego/core';
import { AdPopup } from '@/components/app';
import { Button, Callout, Columns, Input, Panel, PreviewBox, Textarea, buttonClass, cx } from '@/components/web';
import { useFormSubmit } from '@/app/doanh-nghiep/_lib/use-form-submit';
import { submitAdAction } from '../actions';

const ACCEPT = 'image/jpeg,image/png,image/webp';

function sizeText(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Ảnh xem trước trước khi tải lên: URL.createObjectURL nếu có, không thì FileReader (data URL),
 * không có cả hai (một số trình duyệt trong app) thì bỏ qua xem trước — vẫn gửi được.
 */
function useImagePreview() {
  const [url, setUrl] = useState<string | null>(null);
  const objectUrl = useRef<string | null>(null);
  const seq = useRef(0);
  const revoke = () => {
    if (!objectUrl.current) return;
    try {
      URL.revokeObjectURL(objectUrl.current);
    } catch {
      /* bỏ qua */
    }
    objectUrl.current = null;
  };
  useEffect(() => revoke, []);
  const show = (file: File | null) => {
    const n = ++seq.current;
    revoke();
    setUrl(null);
    if (!file) return;
    try {
      if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
        objectUrl.current = URL.createObjectURL(file);
        setUrl(objectUrl.current);
      } else if (typeof FileReader !== 'undefined') {
        const reader = new FileReader();
        reader.onload = () => {
          if (n === seq.current && typeof reader.result === 'string') setUrl(reader.result);
        };
        reader.readAsDataURL(file);
      }
    } catch {
      setUrl(null);
    }
  };
  return [url, show] as const;
}

export type AdComposerProps = {
  canSubmit: boolean;
  submitBlockedText: string | null;
  preview: BizAdView['preview'];
  rules: string[];
  titleMax: number;
  bodyMax: number;
  maxBytes: number;
};

/**
 * Gửi banner mới (trang Quảng cáo): chọn ảnh, tiêu đề, nội dung + khung xem trước đúng như popup trong app.
 * Gửi xong trang tải lại: đang có bản chờ duyệt nên form ẩn, hiện lời xác nhận.
 */
export function AdComposer({ canSubmit, submitBlockedText, preview, rules, titleMax, bodyMax, maxBytes }: AdComposerProps) {
  const { state, pending, onSubmit } = useFormSubmit(submitAdAction);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, showImage] = useImagePreview();
  const fileId = useId();
  const fileErrId = `${fileId}-loi`;

  // Lỗi từ máy chủ của một ô chỉ hiện tới khi người dùng sửa ô đó (VD đã chọn ảnh thì thôi báo "Chọn ảnh banner.").
  const [editedAt, setEditedAt] = useState<Record<string, number>>({});
  const touch = (k: string) => setEditedAt((m) => ({ ...m, [k]: Date.now() }));
  const serverErr = (k: string) =>
    state.status === 'error' && !((editedAt[k] ?? 0) > (state.at ?? 0)) ? state.fieldErrors?.[k] : undefined;
  const shownFileError = fileError ?? serverErr('file');
  const formError = state.status === 'error' && !state.fieldErrors ? state.message : undefined;

  const rulesList = (
    <ul className="m-0 flex list-disc flex-col gap-1 pl-5 text-[13px] leading-normal text-ink-2">
      {rules.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ul>
  );

  const success =
    state.status === 'ok' ? (
      <div role="status">
        <Callout tone="green" icon="check" text={state.message} />
      </div>
    ) : null;

  if (!canSubmit) {
    return (
      <Panel title="Gửi banner mới" id="qc-gui">
        {success}
        {submitBlockedText ? <Callout tone={success ? 'grey' : 'amber'} icon="clock" text={submitBlockedText} /> : null}
        {rulesList}
      </Panel>
    );
  }

  const submit = (e: FormEvent<HTMLFormElement>) => {
    if (file && file.size > maxBytes) {
      e.preventDefault();
      setFileError(`Ảnh ${sizeText(file.size)}, tối đa ${sizeText(maxBytes)}. Chọn ảnh nhỏ hơn.`);
      return;
    }
    onSubmit(e);
  };

  return (
    <Columns template="minmax(0,1.1fr) minmax(0,1fr)" stackBelow="lg">
      <Panel title="Gửi banner mới" id="qc-gui" description="Frego duyệt rồi mới hiện trong app. Banner đang chạy vẫn hiện tới khi bản mới được duyệt.">
        <form onSubmit={submit} noValidate aria-labelledby="qc-gui" className="flex flex-col gap-4" aria-busy={pending || undefined}>
          {success}
          {formError ? <Callout tone="red" icon="x" role="alert" text={formError} /> : null}
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium leading-[1.3] text-ink-2">Ảnh banner</span>
            <div
              className={cx(
                'flex items-center gap-2.5 rounded-ctl px-3 py-2.5',
                shownFileError ? 'shadow-field-error' : 'shadow-frame',
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px]">{file ? file.name : 'Chưa chọn ảnh'}</span>
                <span className="text-[12px] text-ink-2">{file ? `Đã chọn · ${sizeText(file.size)}` : 'JPG, PNG hoặc WebP, tối đa 1 MB'}</span>
              </span>
              <input
                id={fileId}
                type="file"
                name="file"
                accept={ACCEPT}
                className="peer sr-only"
                aria-invalid={shownFileError ? true : undefined}
                aria-describedby={shownFileError ? fileErrId : undefined}
                onChange={(e) => {
                  const f = e.currentTarget.files?.[0] ?? null;
                  setFile(f);
                  showImage(f);
                  touch('file');
                  setFileError(f && f.size > maxBytes ? `Ảnh ${sizeText(f.size)}, tối đa ${sizeText(maxBytes)}. Chọn ảnh nhỏ hơn.` : null);
                }}
              />
              <label
                htmlFor={fileId}
                className={cx(
                  buttonClass({ variant: 'secondary', size: 'sm' }),
                  'flex-none peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue',
                )}
              >
                {file ? 'Đổi ảnh' : 'Chọn ảnh'}
              </label>
            </div>
            {shownFileError ? (
              <span id={fileErrId} className="text-[12px] leading-[1.4] text-danger">
                {shownFileError}
              </span>
            ) : null}
          </div>
          <Input
            label="Tiêu đề"
            id="qc-tieu-de"
            name="title"
            value={title}
            onChange={(e) => {
              setTitle(e.currentTarget.value);
              touch('title');
            }}
            maxLength={titleMax}
            placeholder="VD: Cà phê sữa đá mua 2 tặng 1"
            help={`${title.length}/${titleMax} ký tự`}
            error={serverErr('title')}
          />
          <Textarea
            label="Nội dung"
            id="qc-noi-dung"
            name="body"
            value={body}
            onChange={(e) => {
              setBody(e.currentTarget.value);
              touch('body');
            }}
            maxLength={bodyMax}
            rows={3}
            placeholder="Một câu ngắn về ưu đãi tại quán"
            help={`${body.length}/${bodyMax} ký tự`}
            error={serverErr('body')}
          />
          {rulesList}
          <div>
            <Button type="submit" disabled={pending}>
              {pending ? 'Đang gửi…' : 'Gửi duyệt'}
            </Button>
          </div>
        </form>
      </Panel>
      <Panel title="Xem trước trong app" id="qc-xem-truoc" description="Hiện khi khách chọn hãng có mã của quán ở màn So giá.">
        <PreviewBox padding={14}>
          <AdPopup
            imageUrl={imageUrl}
            title={title.trim()}
            body={body.trim()}
            businessName={preview.name}
            category={preview.category}
            address={preview.address}
            giftText={preview.giftText}
          />
        </PreviewBox>
      </Panel>
    </Columns>
  );
}
