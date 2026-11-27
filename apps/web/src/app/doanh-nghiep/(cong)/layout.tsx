// Khung cổng doanh nghiệp: thanh bên (WebSidebar role="biz") + cột nội dung. Topbar nằm trong từng trang.
import type { CategoryKey } from '@frego/core';
import { PortalShell } from '@/components/web';
import { getDb, requireRole } from '@/lib/server/data';

export default async function BizLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('biz');
  let category: CategoryKey = 'cafe';
  if (session.businessId) {
    const b = await (await getDb()).get('businesses', session.businessId);
    if (b?.category) category = b.category;
  }
  return (
    <PortalShell
      role="biz"
      businessName={session.businessName}
      businessCategory={category}
      account={{ displayName: session.displayName, email: session.email }}
    >
      {children}
    </PortalShell>
  );
}
