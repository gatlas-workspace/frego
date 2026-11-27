// TODO(thành phần): khung quản trị: <Sidebar role="admin"> + nội dung. Topbar nằm trong từng trang.
import { requireRole } from '@/lib/server/data';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole('admin');
  return <div className="flex min-h-screen">{children}</div>;
}
