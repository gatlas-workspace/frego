'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Button, Callout, FieldGrid, FormSection, Input } from '@/components/web';
import { FilePick } from '@/app/doanh-nghiep/_components/FilePick';
import { useFormSubmit } from '@/app/doanh-nghiep/_lib/use-form-submit';
import { registerBusinessAction, saveRegisteredPinAction } from '../actions';
import { PinMap } from './PinMap';

/** Form Đăng ký doanh nghiệp (WebDnDangKy): 4 mục, "Lưu nháp" / "Gửi đăng ký", gửi xong hiện khối xác nhận. */
export function RegisterForm({ needPassword }: { needPassword: boolean }) {
  const [hasLicense, setHasLicense] = useState(false);
  const [hasStorefront, setHasStorefront] = useState(false);
  const { state, pending, onSubmit } = useFormSubmit(registerBusinessAction);
  const err = (k: string) => (state.status === 'error' ? state.fieldErrors?.[k] : undefined);

  if (state.status === 'ok') {
    return (
      <div className="flex flex-col gap-4 pt-3">
        <div role="status" className="flex flex-col gap-3">
          <Callout tone="green" icon="check" text={state.message} />
          {state.note ? <Callout tone="amber" text={state.note} /> : null}
        </div>
        {state.data?.businessId ? (
          <PinStep
            businessId={String(state.data.businessId)}
            lat={Number(state.data.lat)}
            lng={Number(state.data.lng)}
            email={String(state.data.email ?? '')}
          />
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col">
      <input type="hidden" name="hasLicense" value={hasLicense ? '1' : '0'} />
      <input type="hidden" name="hasStorefront" value={hasStorefront ? '1' : '0'} />
      {state.status === 'error' ? <Callout tone="red" icon="x" role="alert" text={state.message} className="mb-3" /> : null}

      <FormSection step={1} title="Doanh nghiệp" id="dk-doanh-nghiep" labelWidth={150}>
        <FieldGrid>
          <Input label="Tên trên giấy phép" id="dk-ten" name="legalName" placeholder="VD: Công ty TNHH Nhà sách Gió" error={err('legalName')} />
          <Input label="Mã số thuế" id="dk-mst" name="taxCode" inputMode="numeric" placeholder="VD: 0318456789" error={err('taxCode')} />
        </FieldGrid>
        <Input label="Người đại diện" id="dk-dai-dien" name="representative" autoComplete="name" placeholder="VD: Trần Minh Khoa" error={err('representative')} />
      </FormSection>

      <FormSection step={2} title="Cửa hàng" id="dk-cua-hang" labelWidth={150}>
        <FieldGrid>
          <Input label="Tên hiển thị trên app" id="dk-ten-ht" name="name" maxLength={60} placeholder="VD: Nhà sách Gió" error={err('name')} />
          <Input label="Ngành" id="dk-nganh" name="industry" placeholder="VD: Bán lẻ · Sách, văn phòng phẩm" error={err('industry')} />
        </FieldGrid>
        <Input
          label="Địa chỉ cửa hàng"
          id="dk-dia-chi"
          name="address"
          autoComplete="street-address"
          placeholder="VD: Đường Nguyễn Thị Minh Khai, Quận 3, TP.HCM"
          help="Ghim vị trí trên bản đồ ở bước sau. Vùng áp dụng của mã tính từ ghim này."
          error={err('address')}
        />
      </FormSection>

      <FormSection step={3} title="Giấy tờ" id="dk-giay-to" labelWidth={150}>
        <FilePick
          icon="receipt"
          name="Giấy phép kinh doanh"
          meta="PDF hoặc ảnh chụp rõ, tối đa 10 MB"
          accept="application/pdf,image/png,image/jpeg"
          buttonLabel="Tải tệp"
          onPick={setHasLicense}
        />
        <FilePick
          icon="camera"
          name="Ảnh mặt tiền cửa hàng"
          meta="Thấy rõ biển hiệu, dùng để xác nhận vị trí"
          accept="image/png,image/jpeg"
          buttonLabel="Tải ảnh"
          onPick={setHasStorefront}
        />
      </FormSection>

      <FormSection step={4} title="Liên hệ" id="dk-lien-he" labelWidth={150}>
        <FieldGrid>
          <Input
            label="Email đăng nhập"
            id="dk-email"
            name="contactEmail"
            type="email"
            autoComplete="email"
            placeholder="VD: lienhe@nhasachgio.vn"
            error={err('contactEmail')}
          />
          <Input label="Số điện thoại" id="dk-sdt" name="contactPhone" type="tel" autoComplete="tel" placeholder="VD: 0283 123 456" error={err('contactPhone')} />
        </FieldGrid>
        {needPassword ? (
          <Input
            label="Mật khẩu"
            id="dk-mat-khau"
            name="password"
            type="password"
            autoComplete="new-password"
            help="Tối thiểu 8 ký tự, dùng để đăng nhập cổng doanh nghiệp."
            error={err('password')}
          />
        ) : null}
      </FormSection>

      <div className="flex flex-wrap justify-end gap-2 pt-3 shadow-line-t">
        <Button type="submit" variant="secondary" name="intent" value="draft" disabled={pending}>
          Lưu nháp
        </Button>
        <Button type="submit" name="intent" value="submit" disabled={pending}>
          Gửi đăng ký
        </Button>
      </div>
    </form>
  );
}

/** Bước 2: ghim vị trí cửa hàng trên bản đồ, rồi "Tiếp theo là gì / đăng nhập thế nào". */
function PinStep({ businessId, lat, lng, email }: { businessId: string; lat: number; lng: number; email: string }) {
  const [saved, setSaved] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, startSave] = useTransition();
  const save = (p: { lat: number; lng: number }) =>
    startSave(async () => {
      const r = await saveRegisteredPinAction(businessId, p.lat, p.lng);
      setSaved({ ok: r.status === 'ok', text: r.message ?? '' });
    });
  return (
    <>
      <FormSection step={5} title="Ghim vị trí" id="dk-ghim" labelWidth={150}>
        <p className="m-0 text-[14px] leading-normal text-ink-2">
          Kéo bản đồ để ghim đỏ nằm đúng cửa ra vào của cửa hàng. Vùng áp dụng của mã (VD 500 m quanh quán) tính từ ghim này.
        </p>
        <PinMap initial={{ lat, lng }} saving={saving} onSave={save} />
        {saved ? <Callout tone={saved.ok ? 'green' : 'red'} icon={saved.ok ? 'check' : 'x'} role={saved.ok ? 'status' : 'alert'} text={saved.text} /> : null}
      </FormSection>
      <FormSection step={6} title="Tiếp theo" id="dk-tiep-theo" labelWidth={150}>
        <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-[14px] leading-normal">
          <li>Frego xem hồ sơ trong 1 ngày làm việc, có thể gọi số điện thoại bạn khai để xác nhận.</li>
          <li>Kết quả gửi qua email{email ? ` ${email}` : ''}. Thiếu giấy tờ thì Frego nhắc bổ sung.</li>
          <li>
            Đăng nhập cổng doanh nghiệp ở <Link href="/dang-nhap?vai-tro=doanh-nghiep">trang Đăng nhập</Link> bằng email
            {email ? ` ${email}` : ' đã đăng ký'} và mật khẩu đã tạo khi gửi hồ sơ.
          </li>
          <li>Được duyệt: nạp ví (VietQR hoặc chuyển khoản) rồi tạo chiến dịch đầu tiên.</li>
        </ol>
      </FormSection>
    </>
  );
}
