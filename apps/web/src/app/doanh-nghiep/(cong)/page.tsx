// TODO(màn hình): dựng theo thiết kế WebDnTongQuan.dc.html
import { bizService } from '@/lib/server/data';

export default async function Page() {
  await bizService();
  return (
    <main className="p-12">
      <h1 className="text-[28px] font-bold">DN 1 · Tổng quan</h1>
    </main>
  );
}
