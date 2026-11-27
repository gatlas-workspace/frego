// TODO(màn hình): dựng theo thiết kế WebQtThanhToan.dc.html
import { adminService } from '@/lib/server/data';

export default async function Page() {
  await adminService();
  return (
    <main className="p-12">
      <h1 className="text-[28px] font-bold">QT 7 · Tiền và đối soát</h1>
    </main>
  );
}
