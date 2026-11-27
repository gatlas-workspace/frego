// TODO(màn hình): dựng theo thiết kế WebQtThongBao.dc.html
import { adminService } from '@/lib/server/data';

export default async function Page() {
  await adminService();
  return (
    <main className="p-12">
      <h1 className="text-[28px] font-bold">QT 9 · Thông báo</h1>
    </main>
  );
}
