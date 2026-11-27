// TODO(màn hình): dựng theo thiết kế WebQtBangGia.dc.html
import { adminService } from '@/lib/server/data';

export default async function Page() {
  await adminService();
  return (
    <main className="p-12">
      <h1 className="text-[28px] font-bold">QT 10 · Bảng giá ước tính</h1>
    </main>
  );
}
