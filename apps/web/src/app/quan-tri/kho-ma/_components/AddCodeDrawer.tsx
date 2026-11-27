'use client';

import { useActionState, useState, type ChangeEvent } from 'react';
import { Button, Callout, Drawer, FieldGrid, Input, Segmented } from '@/components/web';
import { addCodeAction, type AddCodeState } from '../actions';

const FORM_ID = 'km-them-form';

/**
 * Khung "Thêm mã công khai" (WebQtKhoMa): hãng, mã, ưu đãi, điều kiện, nguồn, hạn dùng.
 * Mã ngân hàng: chọn thêm ngân hàng bắt buộc và app áp dụng. Lưu xong mã ở trạng thái "Chờ kiểm tra".
 */
export function AddCodeDrawer({ open, closeHref, banks }: { open: boolean; closeHref: string; banks: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<AddCodeState, FormData>(addCodeAction, null);
  const [brand, setBrand] = useState('grab');
  const [bankId, setBankId] = useState(banks[0]?.id ?? '');
  const [bankProvider, setBankProvider] = useState('grab');
  const [f, setF] = useState({ code: '', title: '', condition: '', source: '', expires: '' });
  const err = state?.errors ?? {};
  const field = (k: keyof typeof f) => ({
    name: k,
    value: f[k],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value })),
  });

  return (
    <Drawer
      open={open}
      title="Thêm mã công khai"
      closeHref={closeHref}
      footer={
        <>
          <Button variant="secondary" href={closeHref}>
            Hủy
          </Button>
          <Button type="submit" form={FORM_ID} disabled={pending}>
            {pending ? 'Đang lưu…' : 'Lưu và kiểm tra'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} action={action} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">Hãng</span>
          <Segmented
            name="brand"
            label="Hãng"
            value={brand}
            onChange={setBrand}
            items={[
              { value: 'grab', label: 'Grab' },
              { value: 'be', label: 'Be' },
              { value: 'gsm', label: 'Green SM' },
              { value: 'bank', label: 'Ngân hàng' },
            ]}
          />
        </div>
        {brand === 'bank' ? (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">Ngân hàng</span>
              <Segmented name="bankId" label="Ngân hàng" value={bankId} onChange={setBankId} items={banks.map((b) => ({ value: b.id, label: b.name }))} />
              {err.bank ? <span className="text-[12px] text-danger">{err.bank}</span> : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium">Dùng trên app</span>
              <Segmented
                name="bankProvider"
                label="Dùng trên app"
                value={bankProvider}
                onChange={setBankProvider}
                items={[
                  { value: 'grab', label: 'Grab' },
                  { value: 'be', label: 'Be' },
                  { value: 'gsm', label: 'Green SM' },
                ]}
              />
            </div>
          </>
        ) : null}
        <Input label="Mã" id="km-ma" placeholder="VD: GRABXMAS" autoCapitalize="characters" spellCheck={false} error={err.code} {...field('code')} />
        <Input label="Ưu đãi" id="km-uu-dai" placeholder="VD: Giảm 25.000đ GrabCar từ 120.000đ" error={err.title} {...field('title')} />
        <Input label="Điều kiện" id="km-dieu-kien" placeholder="VD: thẻ ngân hàng, giờ, khu vực" {...field('condition')} />
        <FieldGrid>
          <Input label="Nguồn" id="km-nguon" placeholder="VD: grab.com" error={err.source} {...field('source')} />
          <Input label="Hạn dùng" id="km-han" placeholder="dd/mm/yyyy" inputMode="numeric" error={err.expires} {...field('expires')} />
        </FieldGrid>
        {err.form ? <Callout tone="red" icon="x" role="alert" text={err.form} /> : null}
        <Callout text="Sau khi lưu, Frego mở nguồn để kiểm tra. Mã chỉ hiện trên app khi kiểm tra xong." />
      </form>
    </Drawer>
  );
}
