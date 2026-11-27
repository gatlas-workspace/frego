// Cổng doanh nghiệp · Quảng cáo (kế hoạch "popup quảng cáo nhà tài trợ", 27/11/2026): banner hiện ở popup trong app
// sau khi khách chọn hãng có mã của quán ở màn So giá. Doanh nghiệp gửi, Frego duyệt; lượt xem chỉ là số tổng.
import type { Metadata } from 'next';
import { AD_BODY_MAX, AD_IMAGE_MAX_BYTES, AD_TITLE_MAX, type BizAdBannerView } from '@frego/core';
import { Callout, Hint, PageBody, PageHeader, Panel, StatCard, StatGroup, Status, Topbar, type StatusTone } from '@/components/web';
import { bizService } from '@/lib/server/data';
import { AdComposer } from './_components/AdComposer';

export const metadata: Metadata = { title: 'Quảng cáo', robots: { index: false, follow: false } };

function BannerRow({ banner, chip, tone, reason }: { banner: BizAdBannerView; chip: string; tone: StatusTone; reason?: string }) {
  return (
    <li className="flex flex-wrap items-start gap-3.5 border-b border-line-soft py-3 last:border-b-0">
      <span className="block aspect-[16/9] w-[168px] flex-none overflow-hidden rounded-tile bg-grey max-[480px]:w-full">
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh banner (data URL ở DEMO, URL có hạn ở Supabase) */}
        <img src={banner.imageUrl} alt={`Ảnh banner: ${banner.title}`} className="block size-full object-cover" />
      </span>
      <span className="flex min-w-0 flex-1 basis-[220px] flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <Status text={chip} tone={tone} />
          <span className="text-[13px] text-ink-2">{banner.statusText}</span>
        </span>
        <span className="break-words text-[15px] font-semibold leading-[1.35]">{banner.title}</span>
        {banner.body ? <span className="break-words text-[14px] leading-normal text-ink-2">{banner.body}</span> : null}
        {reason ? <Callout tone="red" icon="x" className="mt-1" text={`Lý do: ${reason}`} /> : null}
      </span>
    </li>
  );
}

export default async function Page() {
  const { session, svc } = await bizService();
  const v = await svc.getAd();
  const bizName = session.businessName ?? v.preview.name;
  const hasAny = !!(v.running || v.pending || v.rejected);
  return (
    <>
      <Topbar crumbs={`${bizName} / Quảng cáo`} />
      <PageBody>
        <PageHeader
          title="Quảng cáo"
          description="Banner của quán hiện trong popup khi khách chọn hãng xe có mã của quán ở màn So giá, trước khi mở app hãng."
        />
        <StatGroup label="Số liệu quảng cáo">
          <StatCard label={v.adViews.label} value={v.adViews.value} sub={v.adViews.sub} />
        </StatGroup>
        <Panel title="Banner của quán" id="qc-banner">
          {hasAny ? (
            <ul className="m-0 flex list-none flex-col p-0">
              {v.running ? <BannerRow banner={v.running} chip="Đang chạy" tone="green" /> : null}
              {v.pending ? <BannerRow banner={v.pending} chip="Chờ duyệt" tone="amber" /> : null}
              {v.rejected ? <BannerRow banner={v.rejected} chip="Bị từ chối" tone="red" reason={v.rejected.reason} /> : null}
            </ul>
          ) : (
            <Hint className="mt-0!">Quán chưa có banner. Khi chưa có banner được duyệt, popup chỉ hiện tên, địa chỉ quán và quà tặng.</Hint>
          )}
        </Panel>
        <AdComposer
          canSubmit={v.canSubmit}
          submitBlockedText={v.submitBlockedText}
          preview={v.preview}
          rules={v.rules}
          titleMax={AD_TITLE_MAX}
          bodyMax={AD_BODY_MAX}
          maxBytes={AD_IMAGE_MAX_BYTES}
        />
      </PageBody>
    </>
  );
}
