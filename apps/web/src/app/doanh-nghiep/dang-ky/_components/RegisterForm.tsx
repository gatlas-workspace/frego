'use client';

import { useState } from 'react';
import { Button, Callout, FieldGrid, FormSection, Input } from '@/components/web';
import { FilePick } from '@/app/doanh-nghiep/_components/FilePick';
import { useFormSubmit } from '@/app/doanh-nghiep/_lib/use-form-submit';
import { registerBusinessAction } from '../actions';

/** Form Đăng ký doanh nghiệp (WebDnDangKy): 4 mục, "Lưu nháp" / "Gửi đăng ký", gửi xong hiện khối xác nhận. */
export function RegisterForm({ needPassword }: { needPassword: boolean }) {
  const [hasLicense, setHasLicense] = useState(false);
  const [hasStorefront, setHasStorefront] = useState(false);
  const { state, pending, onSubmit } = useFormSubmit(registerBusinessAction);
  const err = (k: string) => (state.status === 'error' ? state.fieldErrors?.[k] : undefined);

  if (state.status === 'ok') {
    return (
      <div role="status" className="flex flex-col gap-3 pt-3">
        <Callout tone="green" icon="check" text={state.message} />
        {state.note ? <Callout tone="amber" text={state.note} /> : null}
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
