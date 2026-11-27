'use client';

// Ví dụ có trạng thái cho bảng thành phần: Tabs / Segmented / Toggle có điều khiển và khung trượt.
import { useState } from 'react';
import { Button, Callout, ChoiceGroup, Drawer, FieldGrid, Input, Segmented, Tabs, Toggle } from '@/components/web';

export function TabsDemo() {
  const [view, setView] = useState('all');
  return (
    <Tabs
      label="Chế độ xem"
      toolbar
      active={view}
      onChange={setView}
      items={[
        { key: 'all', label: 'Tất cả', count: 4, icon: 'table' },
        { key: 'run', label: 'Đang chạy', count: 1 },
        { key: 'wait', label: 'Chờ duyệt', count: 1 },
        { key: 'end', label: 'Đã kết thúc', count: 1 },
      ]}
    />
  );
}

export function SegmentedDemo() {
  const [r, setR] = useState('500');
  return (
    <div className="w-80">
      <Segmented
        name="ban-kinh-demo"
        label="Bán kính"
        value={r}
        onChange={setR}
        items={[
          { value: '300', label: '300 m' },
          { value: '500', label: '500 m' },
          { value: '800', label: '800 m' },
          { value: '1000', label: '1 km' },
        ]}
      />
    </div>
  );
}

export function ToggleDemo() {
  const [on, setOn] = useState(true);
  return (
    <span className="flex items-center gap-3">
      <Toggle label="Công tắc có điều khiển" checked={on} onChange={setOn} />
      <span className="text-[13px] text-ink-2">{on ? 'Đang bật' : 'Đang tắt'}</span>
    </span>
  );
}

export function DrawerDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" icon="plus" onClick={() => setOpen(true)}>
        Mở khung trượt
      </Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Thêm mã công khai"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => setOpen(false)}>Lưu và kiểm tra</Button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium">Hãng</span>
          <Segmented
            name="hang-demo"
            label="Hãng"
            defaultValue="grab"
            items={[
              { value: 'grab', label: 'Grab' },
              { value: 'be', label: 'Be' },
              { value: 'gsm', label: 'Green SM' },
            ]}
          />
        </div>
        <Input label="Mã" id="km-ma-demo" defaultValue="GRABXMAS" />
        <Input label="Ưu đãi" id="km-uu-dai-demo" defaultValue="Giảm 25.000đ GrabCar từ 120.000đ" />
        <Input label="Điều kiện" id="km-dieu-kien-demo" placeholder="VD: thẻ ngân hàng, giờ, khu vực" />
        <FieldGrid>
          <Input label="Nguồn" id="km-nguon-demo" defaultValue="grab.com" />
          <Input label="Hạn dùng" id="km-han-demo" defaultValue="25/12/2026" />
        </FieldGrid>
        <Callout text="Sau khi lưu, Frego mở nguồn để kiểm tra. Mã chỉ hiện trên app khi kiểm tra xong." />
      </Drawer>
    </>
  );
}

export function ChoiceDemo() {
  const [b, setB] = useState('grab');
  return (
    <ChoiceGroup
      name="hang-xe-demo"
      label="Hãng xe"
      value={b}
      onChange={setB}
      items={[
        { value: 'grab', label: 'Grab', logo: 'grab' },
        { value: 'be', label: 'Be', logo: 'be' },
        { value: 'gsm', label: 'Green SM', logo: 'gsm' },
      ]}
    />
  );
}
