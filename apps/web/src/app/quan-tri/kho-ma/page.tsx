// TODO(màn hình): dựng theo thiết kế WebQtKhoMa.dc.html
import { adminService } from '@/lib/server/data';

export default async function Page() {
  await adminService();
  return (
    <main className="p-12">
      <h1 className="text-[28px] font-bold">QT 3 · Kho mã công khai</h1>
    </main>
  );
}
