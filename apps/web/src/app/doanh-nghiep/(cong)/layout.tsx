// TODO(thành phần): khung cổng doanh nghiệp: <Sidebar role="biz"> + nội dung. Topbar nằm trong từng trang.
import { requireRole } from '@/lib/server/data';

export default async function BizLayout({ children }: { children: React.ReactNode }) {
  await requireRole('biz');
  return <div className="flex min-h-screen">{children}</div>;
}
