// DN 7 · Hồ sơ cửa hàng (thiết kế WebDnHoSo.dc.html): thông tin cửa hàng, xuất hóa đơn, thành viên, email thông báo.
import type { Metadata } from 'next';
import { PageBody, Topbar } from '@/components/web';
import { bizService } from '@/lib/server/data';
import { MembersPanel } from './_components/MembersPanel';
import { ProfileForm } from './_components/ProfileForm';

export const metadata: Metadata = { title: 'Hồ sơ cửa hàng', robots: { index: false, follow: false } };

export default async function Page() {
  const { session, svc } = await bizService();
  const v = await svc.getProfile();
  return (
    <>
      <Topbar crumbs={`${session.businessName ?? v.name} / Hồ sơ cửa hàng`} />
      <PageBody>
        <ProfileForm view={v} members={<MembersPanel members={v.members} canManage={v.canManage} />} />
      </PageBody>
    </>
  );
}
