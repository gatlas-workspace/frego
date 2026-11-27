// TODO(màn hình): dựng theo thiết kế WebDnChienDich.dc.html
import { bizService } from '@/lib/server/data';

export default async function Page() {
  await bizService();
  return (
    <main className="p-12">
      <h1 className="text-[28px] font-bold">DN 2 · Chiến dịch</h1>
    </main>
  );
}
