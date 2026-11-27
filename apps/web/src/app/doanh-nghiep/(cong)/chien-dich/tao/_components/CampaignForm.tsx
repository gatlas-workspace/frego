'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  bizServiceLabel,
  formatDiscount,
  formatMeters,
  formatNumber,
  formatVnd,
  parseVnd,
  type BizCampaignFormView,
  type CategoryKey,
  type ProviderId,
  type VehicleClass,
} from '@frego/core';
import { VoucherTicket, type MerchantLogoKind } from '@/components/app';
import {
  BizMark,
  Button,
  Callout,
  ChoiceGroup,
  Columns,
  FieldGrid,
  FormSection,
  Input,
  KeyValue,
  KeyValueList,
  PageHeader,
  Panel,
  PreviewBox,
  Segmented,
  ToggleRow,
  WebIcon,
} from '@/components/web';
import { FilePick } from '@/app/doanh-nghiep/_components/FilePick';
import { useFormSubmit } from '@/app/doanh-nghiep/_lib/use-form-submit';
import { createCampaignAction } from '../actions';
import { RadiusMap } from './RadiusMap';

const TICKET_LOGO: Record<CategoryKey, MerchantLogoKind> = { cafe: 'cup', bowl: 'bowl', tea: 'lotus', gym: 'gym', book: 'book', cake: 'cake' };

/** Form Tạo chiến dịch (WebDnTaoChienDich): chọn vùng, hãng, mức giảm; xem trước vé voucher và chi phí ngay khi đổi. */
export function CampaignForm({ view }: { view: BizCampaignFormView }) {
  const v = view.values;
  const [radiusM, setRadiusM] = useState(v.radiusM);
  const [providerId, setProviderId] = useState<ProviderId>(v.providerId);
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>(v.vehicleClass);
  const [amount, setAmount] = useState(v.amount);
  const [budget, setBudget] = useState(v.budget);
  const [endDate, setEndDate] = useState(v.endDate);
  const [onlyOpenHours, setOnlyOpenHours] = useState(v.onlyOpenHours);
  const { state, pending, onSubmit } = useFormSubmit(createCampaignAction);

  const sent = state.status === 'ok';
  const err = (k: string) => (state.status === 'error' ? state.fieldErrors?.[k] : undefined);
  const radiusText = formatMeters(radiusM);
  const audience = view.audience?.[String(radiusM)];
  const perCode = amount + view.fee;
  const budgetNum = parseVnd(budget) ?? 0;
  const codes = budgetNum > 0 ? Math.floor(budgetNum / perCode) : 0;
  const editing = view.mode === 'edit';
  const locked = !view.canManage;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {view.fromId ? <input type="hidden" name="fromId" value={view.fromId} /> : null}
      <PageHeader
        title={editing ? 'Sửa chiến dịch' : 'Tạo chiến dịch'}
        description="Frego duyệt trong 1 ngày làm việc. Ví chưa bị trừ tiền cho đến khi có mã được dùng."
        actions={
          <>
            <Button variant="secondary" href="/doanh-nghiep/chien-dich">
              {sent ? 'Về danh sách' : 'Hủy'}
            </Button>
            {!locked && !sent ? (
              <>
                <Button type="submit" variant="ghost" name="intent" value="draft" disabled={pending}>
                  Lưu nháp
                </Button>
                <Button type="submit" name="intent" value="submit" disabled={pending}>
                  Gửi Frego duyệt
                </Button>
              </>
            ) : null}
          </>
        }
      />
      {sent ? (
        <div role="status">
          <Callout tone="green" icon="check">
            {state.message} <Link href="/doanh-nghiep/chien-dich">Về danh sách chiến dịch</Link>
          </Callout>
        </div>
      ) : null}
      {state.status === 'error' ? <Callout tone="red" icon="x" role="alert" text={state.message} /> : null}
      {!view.canManage ? <Callout tone="amber" text="Chỉ chủ cửa hàng tạo và gửi duyệt được chiến dịch." /> : null}
      {view.rejectReason && !sent ? (
        <Callout tone="red" icon="x" text={`Lần trước Frego từ chối, lý do: ${view.rejectReason} Sửa rồi gửi lại.`} />
      ) : null}

      <Columns template="minmax(0,1fr) 340px" gap={32} stackBelow="lg">
        <fieldset disabled={locked} className="m-0 flex min-w-0 flex-col border-0 p-0">
          <legend className="sr-only">Thông tin chiến dịch</legend>
          <FormSection title="Tên chiến dịch" id="tc-ten" description="Chỉ bạn và Frego thấy tên này, để phân biệt các chiến dịch.">
            <Input
              label="Tên chiến dịch"
              hideLabel
              id="tc-ten-o"
              name="name"
              defaultValue={v.name}
              maxLength={80}
              placeholder="VD: Khách chiều quanh Chợ Bến Thành"
              error={err('name')}
            />
          </FormSection>

          <FormSection step={1} title="Vùng áp dụng" id="tc-vung" description="Ai đặt xe tới trong vòng tròn này sẽ dùng được mã.">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-3">
              <span className="flex min-w-0 flex-1 basis-[220px] items-center gap-2 text-[14px]">
                <WebIcon name="pin" size={16} strokeWidth={2} className="text-ink-2" />
                <span>
                  <b className="font-medium">{view.business.name}</b> <span className="text-ink-2">·</span>{' '}
                  <span className="whitespace-nowrap text-ink-2">{view.business.shortAddress}</span>
                </span>
              </span>
              <span className="w-[232px] flex-none max-[600px]:w-full">
                <Segmented
                  items={view.radii.map((r) => ({ value: String(r.value), label: r.label }))}
                  name="radiusM"
                  label="Bán kính vùng áp dụng"
                  value={String(radiusM)}
                  onChange={(x) => setRadiusM(Number(x))}
                />
              </span>
            </div>
            <RadiusMap radiusM={radiusM} radiusText={radiusText} name={view.business.name} category={view.business.category} />
            {audience !== undefined ? (
              <p role="status" className="m-0 text-[13px] text-ink-2">
                Khoảng <b className="font-semibold text-ink">{formatNumber(audience)}</b> người dùng Frego hay đặt xe tới vùng này mỗi
                tháng.
              </p>
            ) : null}
          </FormSection>

          <FormSection step={2} title="Hãng và loại xe" id="tc-hang" description="Mỗi chiến dịch dùng cho một hãng, một loại xe.">
            <ChoiceGroup
              items={view.providers.map((p) => ({ value: p.value, label: p.label, logo: p.value }))}
              name="providerId"
              label="Hãng xe"
              value={providerId}
              onChange={(x) => setProviderId(x as ProviderId)}
            />
            <Segmented
              items={view.vehicles.map((x) => ({ value: x.value, label: x.label }))}
              name="vehicleClass"
              label="Loại xe"
              value={vehicleClass}
              onChange={(x) => setVehicleClass(x as VehicleClass)}
            />
          </FormSection>

          <FormSection
            step={3}
            title="Mức giảm, ngân sách, thời gian"
            id="tc-tien"
            description="Mức giảm cao hơn mã công khai thì mã được gắn nhiều hơn."
          >
            <div className="flex flex-col gap-1.5">
              <span id="tc-muc-giam" className="text-[13px] font-medium">
                Mức giảm mỗi chuyến
              </span>
              <Segmented
                items={view.amounts.map((a) => ({ value: String(a.value), label: a.label }))}
                name="amount"
                label="Mức giảm mỗi chuyến"
                value={String(amount)}
                onChange={(x) => setAmount(Number(x))}
              />
            </div>
            <FieldGrid cols={4}>
              <Input
                label="Ngân sách tối đa"
                id="tc-ngan-sach"
                name="budget"
                value={budget}
                onChange={(e) => setBudget(e.currentTarget.value)}
                onBlur={() => {
                  const n = parseVnd(budget);
                  if (n !== null) setBudget(formatNumber(n));
                }}
                inputMode="numeric"
                suffix="đ"
                error={err('budget')}
              />
              <Input
                label="Tối đa mỗi ngày"
                id="tc-moi-ngay"
                name="dailyCap"
                defaultValue={v.dailyCap}
                inputMode="numeric"
                suffix="mã"
                error={err('dailyCap')}
              />
              <Input label="Bắt đầu" id="tc-bat-dau" name="startDate" defaultValue={v.startDate} placeholder="dd/mm/yyyy" error={err('startDate')} />
              <Input
                label="Kết thúc"
                id="tc-ket-thuc"
                name="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.currentTarget.value)}
                placeholder="dd/mm/yyyy"
                error={err('endDate')}
              />
            </FieldGrid>
            <ToggleRow
              title="Chỉ tặng mã trong giờ mở cửa"
              description={view.business.openHoursText}
              name="onlyOpenHours"
              checked={onlyOpenHours}
              onChange={setOnlyOpenHours}
            />
          </FormSection>

          <FormSection
            step={4}
            title="Ảnh hiển thị"
            id="tc-anh"
            description="Ảnh vuông: logo, banner hoặc poster. Tối thiểu 600 × 600, PNG hoặc JPG."
          >
            <FilePick
              leading={<BizMark category={view.business.category} size={44} />}
              name={<span className="font-medium">{view.image.name}</span>}
              meta={view.image.meta}
              accept="image/png,image/jpeg"
              buttonLabel="Đổi ảnh"
              disabled={locked}
              framed={false}
            />
          </FormSection>
        </fieldset>

        <aside className="flex min-w-0 flex-col gap-4" aria-label="Xem trước và chi phí">
          <Panel title="Người dùng sẽ thấy" id="tc-xem-truoc" description="Trong app Frego, ở bước gắn voucher cho chuyến.">
            <PreviewBox padding={14}>
              <VoucherTicket
                mode="static"
                logo={TICKET_LOGO[view.business.category]}
                tag="sponsor"
                title={view.business.name}
                amount={formatDiscount(amount)}
                service={bizServiceLabel(providerId, vehicleClass)}
                line={`Tặng riêng cho bạn. Điểm đến trong vùng ${radiusText} quanh quán.`}
                meta={endDate ? `HSD ${endDate}` : ''}
              />
            </PreviewBox>
          </Panel>
          <Panel title="Ước tính chi phí" id="tc-chi-phi" gap={10}>
            <KeyValueList>
              <KeyValue layout="between" strong numeric label="Giá trị giảm mỗi mã">
                {formatVnd(amount)}
              </KeyValue>
              <KeyValue layout="between" strong numeric label="Phí dịch vụ Frego">
                {view.feeText}
              </KeyValue>
              <KeyValue layout="between" total numeric label="Mỗi mã được dùng">
                {formatVnd(perCode)}
              </KeyValue>
            </KeyValueList>
            <Callout tone="blue">
              {budgetNum > 0 ? (
                <>
                  Ngân sách {formatVnd(budgetNum)} đủ cho khoảng <b>{formatNumber(codes)}</b> mã được dùng. Mã tặng mà không dùng thì
                  không tính tiền.
                </>
              ) : (
                'Nhập ngân sách để xem đủ cho bao nhiêu mã. Mã tặng mà không dùng thì không tính tiền.'
              )}
            </Callout>
          </Panel>
        </aside>
      </Columns>
    </form>
  );
}
