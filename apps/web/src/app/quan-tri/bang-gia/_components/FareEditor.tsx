'use client';

import { useActionState, useState } from 'react';
import { estimateFare, formatKm, formatNumber, formatVndRange, parseVnd, type FareTable, type FareTestTrip } from '@frego/core';
import { Button, Callout, FieldGrid, Input, Tile, ToggleRow } from '@/components/web';
import { saveFareTableAction } from '../actions';

export type FareEditorProps = {
  table: FareTable;
  label: string;
  test: FareTestTrip | null;
  /** Giá app đang hiện cho chuyến thử với bảng đã lưu (null nếu chưa bật). */
  currentText: string | null;
  canEnable: boolean;
  enableHelp: string;
  historyHref: string;
};

const decimalText = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
const parseFactor = (s: string) => {
  const n = Number(s.trim().replace(',', '.'));
  return s.trim() && Number.isFinite(n) ? n : null;
};

/**
 * Form sửa bảng giá + ước tính thử TRỰC TIẾP: dùng đúng estimateFare của app với số đang gõ,
 * nên quản trị viên thấy đúng khoảng giá app sẽ hiện (trước khi trừ mã) cho chuyến mẫu.
 */
export function FareEditor({ table, label, test, currentText, canEnable, enableHelp, historyHref }: FareEditorProps) {
  const [state, action, pending] = useActionState(saveFareTableAction, null);
  const [openFare, setOpenFare] = useState(formatNumber(table.openFare));
  const [perKm, setPerKm] = useState(formatNumber(table.perKm));
  const [perMin, setPerMin] = useState(formatNumber(table.perMin));
  const [peak, setPeak] = useState(decimalText(table.peakFactor));
  const [enabled, setEnabled] = useState(table.enabled);
  // Sửa tiếp sau khi lưu → hiện lại nút Lưu (đặt lại cờ khi có kết quả mới).
  const [dirty, setDirty] = useState(false);
  const [seenAt, setSeenAt] = useState(0);
  if (state && state.at !== seenAt) {
    setSeenAt(state.at);
    setDirty(false);
  }
  const edit = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setDirty(true);
  };

  const values = { openFare: parseVnd(openFare), perKm: parseVnd(perKm), perMin: parseVnd(perMin), peakFactor: parseFactor(peak) };
  const valid = Object.values(values).every((n) => n !== null && n >= 0) && (values.peakFactor ?? 0) >= 1;
  const draft: FareTable | null = valid
    ? {
        ...table,
        openFare: values.openFare!,
        perKm: values.perKm!,
        perMin: values.perMin!,
        peakFactor: Math.round(values.peakFactor! * 100) / 100,
        minFare: table.minFare === table.openFare ? values.openFare! : table.minFare,
      }
    : null;
  const est = draft && test ? estimateFare(draft, { km: test.km, minutes: test.minutes, at: test.at }) : null;
  const changed =
    !draft ||
    draft.openFare !== table.openFare ||
    draft.perKm !== table.perKm ||
    draft.perMin !== table.perMin ||
    draft.peakFactor !== table.peakFactor ||
    enabled !== table.enabled;

  const note = !enabled
    ? `App chưa hiện ước tính cho ${label}, người dùng chỉ thấy giá trong app hãng.`
    : !changed
      ? `khớp giá app đang hiện cho ${label} trước khi trừ mã`
      : table.enabled && currentText
        ? `app đang hiện ${currentText}, đổi sau khi lưu`
        : `app hiện giá này cho ${label} sau khi lưu, trước khi trừ mã`;
  const saved = state?.ok && !dirty;

  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <input type="hidden" name="id" value={table.id} />
      <FieldGrid>
        <Input
          label={`Giá mở cửa ${formatKm(table.openKm)} đầu`}
          id="bg-mo"
          name="openFare"
          value={openFare}
          onChange={(e) => edit(setOpenFare)(e.target.value)}
          suffix="đ"
          inputMode="numeric"
          error={values.openFare === null}
        />
        <Input label="Mỗi km sau đó" id="bg-km" name="perKm" value={perKm} onChange={(e) => edit(setPerKm)(e.target.value)} suffix="đ" inputMode="numeric" error={values.perKm === null} />
        <Input label="Mỗi phút di chuyển" id="bg-phut" name="perMin" value={perMin} onChange={(e) => edit(setPerMin)(e.target.value)} suffix="đ" inputMode="numeric" error={values.perMin === null} />
        <Input
          label="Hệ số giờ cao điểm"
          id="bg-cao-diem"
          name="peakFactor"
          value={peak}
          onChange={(e) => edit(setPeak)(e.target.value)}
          suffix="lần"
          inputMode="decimal"
          error={values.peakFactor === null || values.peakFactor < 1}
        />
      </FieldGrid>
      <ToggleRow
        name="enabled"
        title="Dùng để ước tính trong app"
        description={enableHelp}
        checked={enabled}
        onChange={edit(setEnabled)}
        disabled={!canEnable && !table.enabled}
      />
      {test ? (
        <Tile padding="sm">
          <span className="text-[13px] text-ink-2">
            Thử với chuyến {test.title}, {test.distanceText}
            {test.peak ? ' · giờ cao điểm' : ''}
          </span>
          <span aria-live="polite" className="text-[20px] font-semibold tabular-nums">
            {est ? formatVndRange(est.low, est.high) : '—'}
          </span>
          <span className="text-[13px] text-ink-2">{est ? note : 'Nhập đủ số để xem ước tính.'}</span>
        </Tile>
      ) : null}
      {state && !state.ok ? <Callout text={state.message} tone="red" icon="x" role="alert" /> : null}
      {saved ? (
        <div role="status">
          <Callout text={state.message} tone="green" icon="check" />
        </div>
      ) : (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" href={historyHref}>
            Xem lịch sử
          </Button>
          <Button type="submit" size="sm" disabled={pending || !valid}>
            {pending ? 'Đang lưu…' : 'Lưu bảng giá'}
          </Button>
        </div>
      )}
    </form>
  );
}
