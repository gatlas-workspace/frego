'use client';

import { useActionState, useState } from 'react';
import { Button, Callout, Drawer, Input, Segmented, Status } from '@/components/web';
import { addPartnerAction } from '../actions';

const FORM_ID = 'them-doi-tac';

/** Nút "Thêm đối tác" + khung trượt có form. Thêm xong thì đóng khung và báo cạnh nút; dòng mới hiện trong bảng. */
export function AddPartner() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(addPartnerAction, null);
  const [handledAt, setHandledAt] = useState(0);
  if (state?.ok && state.at !== handledAt) {
    setHandledAt(state.at);
    setOpen(false);
  }

  return (
    <>
      <Button variant="secondary" size="sm" icon="plus" onClick={() => setOpen(true)}>
        Thêm đối tác
      </Button>
      {state?.ok && !open ? (
        <span role="status" className="order-first max-[600px]:sr-only">
          <Status text={state.message} tone="green" />
        </span>
      ) : null}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Thêm đối tác"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" form={FORM_ID} disabled={pending}>
              {pending ? 'Đang thêm…' : 'Thêm đối tác'}
            </Button>
          </>
        }
      >
        <form id={FORM_ID} action={action} className="flex flex-col gap-4" noValidate>
          <p className="m-0 text-[14px] leading-normal text-ink-2">
            Đối tác mới hiện ở màn Liên kết của app. Frego chỉ ghi nhận tên ngân hàng, loại thẻ và tên ví, không lưu số thẻ hay mật khẩu.
          </p>
          <div className="flex flex-col gap-1.5">
            <span className="text-[12px] font-medium text-ink-2">Loại</span>
            <Segmented
              name="kind"
              label="Loại đối tác"
              defaultValue="wallet"
              items={[
                { value: 'bank', label: 'Ngân hàng' },
                { value: 'wallet', label: 'Ví điện tử' },
                { value: 'email', label: 'Email' },
              ]}
            />
          </div>
          <Input label="Tên đối tác" id="dt-ten" name="name" placeholder="VD: VNPay" required maxLength={40} />
          <Input label="Mô tả trong app" id="dt-mo-ta" name="description" placeholder="VD: Hợp mã đặt xe trả bằng VNPay" required maxLength={80} />
          {state && !state.ok ? <Callout tone="red" icon="x" role="alert" text={state.message} /> : null}
        </form>
      </Drawer>
    </>
  );
}
