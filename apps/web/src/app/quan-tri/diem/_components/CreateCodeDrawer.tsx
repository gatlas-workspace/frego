'use client';

import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';
import { PROVIDER_ORDER, PROVIDERS, VEHICLE_TABS } from '@frego/core';
import { Button, Callout, ChoiceGroup, Drawer, FieldGrid, Input, Segmented, ToggleRow } from '@/components/web';
import { createFregoCodeAction } from '../actions';

const FORM_ID = 'tao-ma-frego';

/** Nút "Tạo mã Frego" ở đầu trang + khung trượt có form. Tạo xong: đóng khung, mở tab Mã Frego, báo kết quả. */
export function CreateCodeDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createFregoCodeAction, null);
  const [handledAt, setHandledAt] = useState(0);

  // Có kết quả mới thành công: đóng khung (điều chỉnh state ngay khi render, không cần effect).
  if (state?.ok && state.at !== handledAt) {
    setHandledAt(state.at);
    setOpen(false);
  }
  // …và mở tab "Mã Frego" có dòng báo đã tạo.
  useEffect(() => {
    if (state?.ok && state.code) router.replace(`/quan-tri/diem?tab=codes&da-tao=${encodeURIComponent(state.code)}`, { scroll: false });
  }, [state, router]);

  return (
    <>
      <Button icon="plus" onClick={() => setOpen(true)}>
        Tạo mã Frego
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Tạo mã Frego"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" form={FORM_ID} disabled={pending}>
              {pending ? 'Đang tạo…' : 'Tạo mã'}
            </Button>
          </>
        }
      >
        <form id={FORM_ID} action={action} className="flex flex-col gap-4" noValidate>
          <p className="m-0 text-[14px] leading-normal text-ink-2">
            Frego tự trả tiền giảm của mã này, không trừ ví doanh nghiệp. Mã nháp chưa phát cho ai.
          </p>
          <Input label="Mã" id="ma-code" name="code" placeholder="VD: FREGOMOI" required maxLength={16} autoCapitalize="characters" help="4–16 chữ in hoa hoặc số, không dấu." />
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-2">Hãng xe</span>
            <ChoiceGroup
              name="providerId"
              label="Hãng xe"
              defaultValue="grab"
              items={PROVIDER_ORDER.map((p) => ({ value: p, label: PROVIDERS[p].name, logo: p }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-2">Loại xe</span>
            <Segmented name="vehicleClass" label="Loại xe" defaultValue="bike" items={VEHICLE_TABS.map((t) => ({ value: t.key, label: t.label }))} />
          </div>
          <FieldGrid>
            <Input label="Mức giảm" id="ma-amount" name="amount" defaultValue="15.000" suffix="đ" inputMode="numeric" required />
            <Input label="Hiệu lực sau khi nhận" id="ma-days" name="validDays" defaultValue="30" suffix="ngày" inputMode="numeric" required />
          </FieldGrid>
          <Input label="Mô tả ngắn" id="ma-title" name="title" placeholder="VD: Chuyến đầu" required maxLength={60} />
          <ToggleRow name="active" title="Chạy ngay" description="Tắt thì lưu ở dạng bản nháp." />
          {state && !state.ok ? <Callout tone="red" icon="x" role="alert" text={state.message} /> : null}
        </form>
      </Drawer>
    </>
  );
}
