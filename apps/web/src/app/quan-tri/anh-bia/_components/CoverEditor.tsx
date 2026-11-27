'use client';

import { useActionState, useEffect, useId, useRef, useState, useTransition, type FormEvent } from 'react';
import { brand, coverContrastFromPixels, HOME_COVER_RULES, type HomeCoverRowView } from '@frego/core';
import { Button, Callout, Input, Segmented, Status, buttonClass, cx } from '@/components/web';
import { deleteCoverAction, saveCoverAction } from '../actions';

const ACCEPT = HOME_COVER_RULES.types.join(',');
const OVERLAYS = [
  { value: '0', label: 'Không' },
  { value: '0.2', label: 'Nhẹ 20%' },
  { value: '0.4', label: 'Vừa 40%' },
  { value: '0.6', label: 'Đậm 60%' },
];
/** Lớp phủ đậm nhất: chữ trắng luôn đạt 4,5:1 kể cả trên ảnh trắng, dùng khi không đo được ảnh. */
const SAFE_OVERLAY = 0.6;

function sizeText(bytes: number): string {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function ratioText(r: number): string {
  return `${r.toFixed(1).replace('.', ',')}:1`;
}

/** "#14152B" + 0.4 → "rgba(20, 21, 43, 0.4)" (màu lấy từ brand.colors). */
function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

/**
 * Đọc ảnh trong trình duyệt: kích thước thật và điểm ảnh nửa trái (canvas thu nhỏ 1/10) để đo tương phản chữ trắng.
 * Ảnh khác nguồn không cho đọc điểm ảnh (canvas "bẩn") → pixels null, trang yêu cầu lớp phủ Đậm 60%.
 */
function useImageProbe(url: string | null) {
  const [probe, setProbe] = useState<{ url: string; w: number; h: number; pixels: Uint8ClampedArray | null } | null>(null);
  useEffect(() => {
    if (!url || typeof Image === 'undefined') return;
    let alive = true;
    const img = new Image();
    if (/^https?:/i.test(url)) img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (!alive) return;
      let pixels: Uint8ClampedArray | null = null;
      try {
        const w = Math.max(2, Math.round(img.naturalWidth / 10));
        const h = Math.max(1, Math.round(img.naturalHeight / 10));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          pixels = ctx.getImageData(0, 0, Math.floor(w / 2), h).data;
        }
      } catch {
        pixels = null;
      }
      setProbe({ url, w: img.naturalWidth, h: img.naturalHeight, pixels });
    };
    img.onerror = () => alive && setProbe({ url, w: 0, h: 0, pixels: null });
    img.src = url;
    return () => {
      alive = false;
    };
  }, [url]);
  return probe && probe.url === url ? probe : null;
}

/** URL xem trước cho tệp vừa chọn (object URL, không có thì FileReader); gọi `show` khi chọn tệp. */
function useFileUrl() {
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
        const r = new FileReader();
        r.onload = () => {
          if (n === seq.current && typeof r.result === 'string') setUrl(r.result);
        };
        r.readAsDataURL(file);
      }
    } catch {
      setUrl(null);
    }
  };
  return [url, show] as const;
}

export type CoverEditorProps = {
  cover: HomeCoverRowView | null;
  defaults: { title: string; startsAt: string; endsAt: string };
  /** "dd/mm/yyyy hh:mm" của ảnh đang sửa */
  startsText: string;
  endsText: string;
  /** Lời chào mẫu trên khung điện thoại */
  greeting: string;
  walletChip: string;
};

/**
 * Sửa / tạo ảnh bìa Trang chủ (WebQtAnhBia): tải ảnh (kiểm 1170 × 630, ≤ 500 KB), tên, khung giờ, lớp phủ, tương phản
 * chữ trắng (chặn "Lưu và hẹn hiện" khi dưới 4,5:1), xem trước trên khung điện thoại 390 × 844.
 */
export function CoverEditor({ cover, defaults, startsText, endsText, greeting, walletChip }: CoverEditorProps) {
  const [state, dispatch, pending] = useActionState(saveCoverAction, null);
  const [delState, delDispatch, deleting] = useActionState(deleteCoverAction, null);
  const [, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [overlay, setOverlay] = useState(String(cover?.overlay ?? 0.4));
  const [previewKind, setPreviewKind] = useState<'edit' | 'default'>('edit');
  const [clientError, setClientError] = useState<string | null>(null);
  const [fileUrl, showFile] = useFileUrl();
  const imageUrl = fileUrl ?? cover?.imageUrl ?? null;
  const probe = useImageProbe(imageUrl);
  const fileId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const ov = Number(overlay);
  const contrast = probe?.pixels ? coverContrastFromPixels(probe.pixels, ov) : null;
  const measured = contrast !== null;
  const contrastOk = measured ? contrast >= HOME_COVER_RULES.minContrast : ov >= SAFE_OVERLAY;

  // Lỗi tệp mới chọn: loại, dung lượng, kích thước đúng 1170 × 630.
  let fileError: string | null = null;
  if (file) {
    if (!HOME_COVER_RULES.types.includes(file.type)) fileError = 'Ảnh phải là JPG, PNG hoặc WebP.';
    else if (file.size > HOME_COVER_RULES.maxBytes) fileError = `Ảnh ${sizeText(file.size)}, tối đa ${sizeText(HOME_COVER_RULES.maxBytes)}.`;
    else if (probe && (probe.w !== HOME_COVER_RULES.width || probe.h !== HOME_COVER_RULES.height)) {
      fileError = probe.w
        ? `Ảnh ${probe.w} × ${probe.h} px, cần đúng ${HOME_COVER_RULES.width} × ${HOME_COVER_RULES.height} px.`
        : 'Không đọc được ảnh. Chọn tệp khác.';
    }
  }
  const checkingFile = !!file && !probe;

  const contrastText = measured
    ? contrastOk
      ? `Chữ trắng trên ảnh: tương phản ${ratioText(contrast)}, đạt (cần từ 4,5:1).`
      : `Chữ trắng trên ảnh: tương phản ${ratioText(contrast)}, chưa đạt 4,5:1. Chọn lớp phủ đậm hơn mới lưu và hẹn hiện được.`
    : imageUrl
      ? contrastOk
        ? 'Không đo được màu ảnh; lớp phủ Đậm 60% luôn đạt tương phản 4,5:1.'
        : 'Không đo được màu ảnh. Chọn lớp phủ Đậm 60% để chắc chắn chữ trắng dễ đọc.'
      : null;

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = submitter?.value === 'scheduled' ? 'scheduled' : 'draft';
    fd.set('intent', intent);
    if (!imageUrl) return setClientError('Chọn ảnh bìa trước khi lưu.');
    if (fileError) return setClientError(fileError);
    if (checkingFile) return setClientError('Đang đọc ảnh, thử lại sau giây lát.');
    if (intent === 'scheduled' && !contrastOk) return setClientError('Tương phản chưa đạt 4,5:1, chưa hẹn hiện được.');
    setClientError(null);
    startTransition(() => dispatch(fd));
  };

  const shownError = clientError ?? (state && !state.ok ? state.message : null);
  const heading = cover ? `Sửa ảnh: ${cover.title}` : 'Ảnh bìa mới';
  const showImage = previewKind === 'edit' && imageUrl;

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_380px] items-start gap-7 max-[1100px]:grid-cols-1">
      <section aria-labelledby="ab-sua" className="flex min-w-0 flex-col gap-3.5 rounded-frame bg-white px-5 py-4 shadow-frame">
        <div className="flex items-center justify-between gap-3">
          <h2 id="ab-sua" className="m-0 text-[15px] font-semibold leading-[1.35]">
            {heading}
          </h2>
          {cover ? <Status text={cover.label.text} tone={cover.label.tone} /> : null}
        </div>
        <form onSubmit={submit} noValidate className="flex flex-col gap-3.5" aria-busy={pending || undefined}>
          <input type="hidden" name="id" value={cover?.id ?? ''} />
          <input type="hidden" name="imageUrl" value={file ? '' : (cover?.imageUrl ?? '')} />
          <input type="hidden" name="storagePath" value={file ? '' : (cover?.storagePath ?? '')} />

          <div className="flex items-stretch gap-3.5 max-[700px]:flex-col">
            <div className="h-[98px] w-[182px] flex-none overflow-hidden rounded-frame bg-app-primary shadow-frame" aria-hidden="true">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước (blob/data URL hoặc URL Storage)
                <img src={imageUrl} alt="" className="block size-full object-cover" />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 rounded-frame bg-field px-3.5 py-3 shadow-frame">
              <span className="text-[14px] font-medium">
                {file
                  ? `${file.name} · ${probe?.w ? `${probe.w} × ${probe.h} px · ` : ''}${sizeText(file.size)}`
                  : cover
                    ? 'Ảnh đang dùng'
                    : 'Chưa chọn ảnh'}
              </span>
              <span className="text-[13px] leading-normal text-ink-2">
                JPG, PNG hoặc WebP, đúng {HOME_COVER_RULES.width} × {HOME_COVER_RULES.height} px (gấp 3 khung 390 × 210), tối đa{' '}
                {sizeText(HOME_COVER_RULES.maxBytes)}.
              </span>
              <span>
                <input
                  ref={inputRef}
                  id={fileId}
                  type="file"
                  name="file"
                  accept={ACCEPT}
                  className="peer sr-only"
                  aria-invalid={fileError ? true : undefined}
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0] ?? null;
                    setFile(f);
                    showFile(f);
                    setClientError(null);
                    setPreviewKind('edit');
                  }}
                />
                <label
                  htmlFor={fileId}
                  className={cx(
                    buttonClass({ variant: 'secondary', size: 'sm' }),
                    'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue',
                  )}
                >
                  {file || cover ? 'Chọn ảnh khác' : 'Chọn ảnh'}
                </label>
              </span>
              {fileError ? (
                <span role="alert" className="text-[12px] text-danger">
                  {fileError}
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 max-[700px]:grid-cols-1">
            <Input label="Tên ảnh (chỉ hiện trong quản trị)" id="ab-ten" name="title" defaultValue={cover?.title ?? defaults.title} maxLength={60} />
            <Input label="Hiện từ" id="ab-tu" name="startsAt" defaultValue={cover ? startsText : defaults.startsAt} placeholder="28/11/2026 00:00" />
            <Input label="Đến hết" id="ab-den" name="endsAt" defaultValue={cover ? endsText : defaults.endsAt} placeholder="30/11/2026 23:59" />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-2">Lớp phủ tối để chữ trắng dễ đọc</span>
            <Segmented name="overlay" label="Lớp phủ tối" items={OVERLAYS} value={overlay} onChange={setOverlay} className="max-w-[360px]" />
          </div>

          <div role="status" aria-live="polite">
            {contrastText ? <Callout text={contrastText} tone={contrastOk ? 'green' : 'amber'} icon={contrastOk ? 'check' : 'info'} /> : null}
          </div>
          <Callout
            tone="grey"
            icon="info"
            text="Vùng an toàn: chừa trống nửa trái cho lời chào và tiêu đề; khoảng 50 px dưới cùng bị ô tìm kiếm che. Khi ảnh chưa tải xong, app hiện màu nền tím Frego."
          />

          {shownError ? <Callout tone="red" icon="x" role="alert" text={shownError} /> : null}
          {state?.ok ? <Callout tone="green" icon="check" role="status" text={`${state.message} Thay đổi được ghi vào Nhật ký (QT 12).`} /> : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="submit" name="intent" value="draft" variant="secondary" size="sm" disabled={pending}>
              Lưu nháp
            </Button>
            <Button
              type="submit"
              name="intent"
              value="scheduled"
              size="sm"
              disabled={pending}
              aria-disabled={!contrastOk || undefined}
              className={contrastOk ? undefined : 'opacity-50'}
            >
              {pending ? 'Đang lưu…' : 'Lưu và hẹn hiện'}
            </Button>
          </div>
        </form>
        {cover ? (
          <form action={delDispatch} className="flex flex-col items-end gap-1.5 border-t border-line pt-3">
            <input type="hidden" name="id" value={cover.id} />
            <Button type="submit" variant="danger" size="sm" disabled={deleting}>
              Gỡ ảnh
            </Button>
            {delState ? (
              <span role={delState.ok ? 'status' : 'alert'} className={cx('text-[12px]', delState.ok ? 'text-ink-2' : 'text-danger')}>
                {delState.message}
              </span>
            ) : null}
          </form>
        ) : null}
      </section>

      <aside aria-labelledby="ab-xem" className="flex flex-col gap-2.5 min-[1100px]:sticky min-[1100px]:top-[57px]">
        <div className="flex items-center justify-between gap-2">
          <h2 id="ab-xem" className="m-0 text-[15px] font-semibold leading-[1.35]">
            Xem trước trên điện thoại
          </h2>
          <span className="text-[12px] text-ink-2">390 × 844</span>
        </div>
        <Segmented
          name="xem-truoc"
          label="Ảnh xem trước"
          items={[
            { value: 'edit', label: 'Ảnh đang sửa' },
            { value: 'default', label: 'Ảnh mặc định' },
          ]}
          value={previewKind}
          onChange={(v) => setPreviewKind(v === 'default' ? 'default' : 'edit')}
          className="w-[340px] max-w-full"
        />
        <div aria-hidden="true" className="h-[430px] w-[340px] max-w-full rounded-[32px] bg-app-ink p-2.5 shadow-pop">
          <div className="relative h-[410px] w-full overflow-hidden rounded-[24px] bg-app-bg font-app text-white">
            <div className="absolute inset-x-0 top-0 h-[172px] overflow-hidden bg-app-primary">
              {showImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- ảnh xem trước (blob/data URL hoặc URL Storage) */}
                  <img src={imageUrl!} alt="" className="block size-full object-cover object-right-bottom" />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(90deg, ${rgba(brand.colors.coverOverlay, ov)} 0%, ${rgba(brand.colors.coverOverlay, ov / 4)} 70%)`,
                    }}
                  />
                </>
              ) : (
                <div className="flex size-full items-end justify-end bg-app-primary p-3 text-[11px] font-semibold text-app-on-primary-soft">
                  Ảnh mặc định “Sài Gòn tím” do app vẽ
                </div>
              )}
            </div>
            <div className="absolute inset-x-4 top-10 flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-app-on-primary-soft">{greeting}</span>
              <span className="rounded-[18px] bg-app-primary-deep px-[11px] py-[7px] text-[11px] font-bold">{walletChip}</span>
            </div>
            <div className="absolute left-4 top-[82px] text-[21px] font-extrabold tracking-[-0.3px]">Hôm nay đi đâu?</div>
            <div className="absolute inset-x-[13px] top-[136px] flex h-[150px] flex-col gap-2 rounded-app-block bg-white p-2.5 text-app-ink shadow-app-card">
              <span className="px-1.5 py-1 text-[11px] text-app-muted">
                Điểm đón
                <br />
                <strong className="text-[12px] text-app-ink">Vị trí hiện tại · 720A Điện Biên Phủ</strong>
              </span>
              <span className="flex h-11 items-center rounded-app-small bg-app-alt px-3 text-[14px] font-extrabold">Bạn muốn đi đâu?</span>
            </div>
            <div className="absolute inset-x-[13px] top-[300px] h-14 rounded-[14px] border border-app-line bg-white" />
          </div>
        </div>
        <p className="m-0 text-[12px] leading-normal text-ink-2">
          Lời chào, nút điểm và ô tìm kiếm luôn do app vẽ đè lên ảnh, không cần đưa chữ vào ảnh.
        </p>
      </aside>
    </div>
  );
}
