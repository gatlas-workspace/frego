'use client';

import type { ReactNode } from 'react';
import type { BizProfileView } from '@frego/core';
import {
  BizMark,
  Button,
  Callout,
  Columns,
  FieldGrid,
  FileRow,
  Input,
  KeyValue,
  KeyValueList,
  PageHeader,
  Panel,
  Status,
  ToggleRow,
} from '@/components/web';
import { FilePick } from '@/app/doanh-nghiep/_components/FilePick';
import { useFormSubmit } from '@/app/doanh-nghiep/_lib/use-form-submit';
import { saveProfileAction } from '../actions';

const FORM = 'ho-so-form';

/**
 * Hồ sơ cửa hàng (WebDnHoSo): một form "ho-so-form" cho mọi ô ở các khung (gắn bằng thuộc tính form),
 * nút "Lưu thay đổi" ở đầu trang. Khung Thành viên (form mời riêng) truyền qua `members`.
 */
export function ProfileForm({ view, members }: { view: BizProfileView; members: ReactNode }) {
  const { state, pending, onSubmit } = useFormSubmit(saveProfileAction);
  const err = (k: string) => (state.status === 'error' ? state.fieldErrors?.[k] : undefined);
  const locked = !view.canManage;
  return (
    <>
      <form id={FORM} onSubmit={onSubmit} noValidate aria-label="Hồ sơ cửa hàng" className="hidden" />
      <PageHeader
        title="Hồ sơ cửa hàng"
        description="Thông tin Frego dùng để duyệt chiến dịch, vẽ vùng áp dụng và xuất hóa đơn. Đổi địa chỉ thì chiến dịch đang chạy cần duyệt lại."
        actions={
          <Button type="submit" form={FORM} disabled={pending || locked}>
            Lưu thay đổi
          </Button>
        }
      />
      {state.status === 'ok' ? (
        <div role="status">
          <Callout tone="green" icon="check" text={state.message} />
        </div>
      ) : null}
      {state.status === 'error' ? <Callout tone="red" icon="x" role="alert" text={state.message} /> : null}
      {locked ? <Callout tone="amber" text="Chỉ chủ cửa hàng sửa được hồ sơ. Bạn vẫn xem được thông tin." /> : null}
      <Columns template="minmax(0,1.2fr) minmax(0,1fr)">
        <Panel title="Cửa hàng" id="hs-ch">
          <FilePick
            leading={<BizMark category={view.category} size={48} />}
            name={<span className="font-medium">{view.logo.title}</span>}
            meta={view.logo.sub}
            accept="image/png,image/jpeg"
            buttonLabel="Đổi ảnh"
            disabled={locked}
            framed={false}
          />
          <FieldGrid>
            <Input label="Tên hiển thị" id="hs-ten" name="name" form={FORM} defaultValue={view.name} maxLength={60} disabled={locked} error={err('name')} />
            <Input label="Ngành" id="hs-nganh" name="industry" form={FORM} defaultValue={view.industry} maxLength={80} disabled={locked} />
          </FieldGrid>
          <Input
            label="Địa chỉ"
            id="hs-dia-chi"
            name="address"
            form={FORM}
            defaultValue={view.address}
            disabled={locked}
            help="Ghim trên bản đồ đã khớp địa chỉ. Vùng áp dụng của chiến dịch tính từ ghim này."
            error={err('address')}
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-[12px] font-medium text-ink-2">Giờ mở cửa</span>
            <KeyValueList>
              {view.openHours.map((h) => (
                <KeyValue key={h.label} layout="between" label={h.label}>
                  {h.value}
                </KeyValue>
              ))}
            </KeyValueList>
          </div>
          <FileRow
            icon="camera"
            name={view.storefront.title}
            trailing={<Status text={view.storefront.statusText} tone={view.storefront.tone} />}
          />
        </Panel>
        <div className="flex min-w-0 flex-col gap-5">
          <Panel title="Xuất hóa đơn" id="hs-hd">
            <Input label="Tên trên hóa đơn" id="hs-phap-nhan" name="invoiceName" form={FORM} defaultValue={view.invoiceName} disabled={locked} />
            <FieldGrid>
              <Input label="Mã số thuế" id="hs-mst" defaultValue={view.taxCodeMasked} readOnly />
              <Input
                label="Email nhận hóa đơn"
                id="hs-email"
                name="invoiceEmail"
                form={FORM}
                type="email"
                autoComplete="email"
                defaultValue={view.invoiceEmail}
                disabled={locked}
                error={err('invoiceEmail')}
              />
            </FieldGrid>
          </Panel>
          {members}
          <Panel title="Email thông báo" id="hs-email-tb">
            <ToggleRow
              title="Kết quả duyệt chiến dịch"
              description="Khi Frego duyệt hoặc từ chối"
              label="Email kết quả duyệt"
              name="notifyReview"
              form={FORM}
              defaultChecked={view.notifyPrefs.review}
              disabled={locked}
            />
            <ToggleRow
              title="Ví sắp hết tiền"
              description="Khi số dư đủ dưới 3 ngày"
              label="Email ví sắp hết"
              name="notifyLowBalance"
              form={FORM}
              defaultChecked={view.notifyPrefs.lowBalance}
              disabled={locked}
            />
            <ToggleRow
              title="Báo cáo hằng tuần"
              description="Thứ Hai, 8:00"
              label="Email báo cáo tuần"
              name="notifyWeekly"
              form={FORM}
              defaultChecked={view.notifyPrefs.weekly}
              disabled={locked}
            />
          </Panel>
        </div>
      </Columns>
    </>
  );
}
