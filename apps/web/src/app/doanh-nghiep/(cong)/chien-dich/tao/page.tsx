// DN 3 · Tạo chiến dịch (thiết kế WebDnTaoChienDich.dc.html). ?tu=<id>: sửa và gửi lại chiến dịch nháp / bị từ chối,
// hoặc tạo bản sao từ chiến dịch đã chạy.
import type { Metadata } from 'next';
import { PageBody, Topbar, type SearchParamsLike } from '@/components/web';
import { bizService } from '@/lib/server/data';
import { CampaignForm } from './_components/CampaignForm';

export const metadata: Metadata = { title: 'Tạo chiến dịch', robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParamsLike> }) {
  const sp = await searchParams;
  const { session, svc } = await bizService();
  const view = await svc.getCampaignForm(typeof sp.tu === 'string' ? sp.tu : null);
  const bizName = session.businessName ?? view.business.name;
  return (
    <>
      <Topbar crumbs={`${bizName} / Chiến dịch / ${view.mode === 'edit' ? 'Sửa chiến dịch' : 'Tạo chiến dịch'}`} />
      <PageBody>
        <CampaignForm key={view.fromId ?? 'moi'} view={view} />
      </PageBody>
    </>
  );
}
