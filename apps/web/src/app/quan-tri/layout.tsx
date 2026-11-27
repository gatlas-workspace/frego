// Khung quản trị: thanh bên (WebSidebar role="admin", số chờ duyệt ở mục Duyệt) + cột nội dung. Topbar nằm trong từng trang.
import { PortalShell } from '@/components/web';
import { getDb, requireRole } from '@/lib/server/data';

/** Số mục chờ duyệt: chiến dịch, hồ sơ doanh nghiệp và banner quảng cáo đang 'pending' (khớp các tab ở mục Duyệt). */
async function pendingCount(): Promise<number> {
  const db = await getDb();
  const [campaigns, businesses, banners] = await Promise.all([
    db.list('campaigns', { where: { status: 'pending' } }),
    db.list('businesses', { where: { status: 'pending' } }),
    db.list('ad_banners', { where: { status: 'pending' } }),
  ]);
  return campaigns.length + businesses.length + banners.length;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('admin');
  const badge = await pendingCount();
  return (
    <PortalShell role="admin" badge={badge} account={{ displayName: session.displayName, email: session.email }}>
      {children}
    </PortalShell>
  );
}
