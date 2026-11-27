'use client';

import { startTransition, useActionState, useRef, useState } from 'react';
import { formatDayMonth, formatTime, parseSendAt, shiftOutOfQuietHours } from '@frego/core';
import { PushNotif } from '@/components/app';
import { Button, Callout, Input, PreviewBox } from '@/components/web';
import { broadcastAction } from '../actions';

type Draft = { id: string; title: string; body: string; sendAtText: string } | null;

export type ComposerProps = {
  draft: Draft;
  audience: { label: string; countText: string };
  /** Thời điểm hiện tại của server (ISO) để kiểm tra giờ yên lặng ngay khi gõ. */
  now: string;
};

/** Khung soạn tin ưu đãi chung: tiêu đề, nội dung, giờ gửi, xem trước thông báo đẩy, "Lưu nháp" / "Hẹn gửi". */
export function Composer(props: ComposerProps) {
  // Đổi key → soạn tin mới từ đầu (xóa cả kết quả lần gửi trước).
  const [round, setRound] = useState(0);
  return <ComposerForm key={round} {...props} draft={round === 0 ? props.draft : null} onNew={() => setRound((r) => r + 1)} />;
}

function ComposerForm({ draft, audience, now, onNew }: ComposerProps & { onNew: () => void }) {
  const [state, action, pending] = useActionState(broadcastAction, null);
  const [title, setTitle] = useState(draft?.title ?? '');
  const [body, setBody] = useState(draft?.body ?? '');
  const [sendAt, setSendAt] = useState(draft?.sendAtText ?? '');
  const formRef = useRef<HTMLFormElement>(null);

  const scheduled = state?.ok && state.intent === 'schedule';
  const id = state?.id ?? draft?.id ?? '';

  // Giờ trên thông báo xem trước, và cảnh báo nếu rơi vào giờ yên lặng.
  const picked = sendAt.trim() ? parseSendAt(sendAt, new Date(now)) : null;
  const shifted = picked ? shiftOutOfQuietHours(picked) : null;
  const sendHelp = !sendAt.trim()
    ? 'VD 28/11 17:30'
    : !picked
      ? 'Chưa đúng dạng, VD 28/11 17:30'
      : shifted?.shifted
        ? `Giờ yên lặng, sẽ gửi lúc ${formatTime(shifted.at)} ngày ${formatDayMonth(shifted.at)}`
        : undefined;
  const previewTime = shifted ? formatTime(shifted.at) : 'bây giờ';

  const saveDraft = () => {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    fd.set('intent', 'draft');
    startTransition(() => action(fd));
  };

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="intent" value="schedule" />
      <input type="hidden" name="id" value={id} />
      <Input label="Tiêu đề" id="tb-tieu-de" name="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={65} readOnly={scheduled} />
      <Input label="Nội dung" id="tb-noi-dung" name="body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={180} readOnly={scheduled} />
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        <Input label="Gửi cho" id="tb-nhom" value={audience.label} readOnly help={audience.countText} />
        <Input
          label="Gửi lúc"
          id="tb-luc"
          name="sendAt"
          value={sendAt}
          onChange={(e) => setSendAt(e.target.value)}
          placeholder="28/11 17:30"
          inputMode="text"
          help={sendHelp}
          error={!!sendAt.trim() && !picked}
          readOnly={scheduled}
        />
      </div>
      <PreviewBox>
        <PushNotif title={title || 'Tiêu đề tin'} body={body || 'Nội dung tin hiện ở đây.'} time={previewTime} />
      </PreviewBox>
      {scheduled ? (
        <div role="status" className="flex flex-col gap-2">
          <Callout text={state.message} tone="green" icon="check" />
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={onNew}>
              Soạn tin mới
            </Button>
          </div>
        </div>
      ) : (
        <>
          {state && !state.ok ? <Callout text={state.message} tone="red" icon="x" role="alert" /> : null}
          <div className="flex flex-wrap items-center justify-end gap-2">
            {state?.ok && state.intent === 'draft' ? (
              <span role="status" className="mr-auto text-[13px] text-ink-2">
                {state.message}
              </span>
            ) : null}
            <Button variant="secondary" size="sm" onClick={saveDraft} disabled={pending}>
              Lưu nháp
            </Button>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? 'Đang lưu…' : 'Hẹn gửi'}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
