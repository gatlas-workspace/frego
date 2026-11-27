// TODO(màn hình): dựng theo thiết kế WebQtDiemThuong.dc.html
import { adminService } from '@/lib/server/data';

export default async function Page() {
  await adminService();
  return (
    <main className="p-12">
      <h1 className="text-[28px] font-bold">QT 8 · Điểm và mã Frego</h1>
    </main>
  );
}
