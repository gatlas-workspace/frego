// TODO(màn hình): dựng theo thiết kế WebDnBaoCao.dc.html
import { bizService } from '@/lib/server/data';

export default async function Page() {
  await bizService();
  return (
    <main className="p-12">
      <h1 className="text-[28px] font-bold">DN 4 · Báo cáo chuyến đến</h1>
    </main>
  );
}
