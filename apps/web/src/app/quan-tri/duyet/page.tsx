// QT 2 · Duyệt doanh nghiệp, chiến dịch và banner quảng cáo (WebQtDuyet): hàng chờ bên trái (?tab=, ?id=), chi tiết + kiểm tra tự động
// bên phải, Duyệt / Từ chối kèm lý do. Mục vừa xử lý vẫn hiện trong hàng chờ với nhãn "Đã duyệt" / "Đã từ chối".
import type { Metadata } from 'next';
import type { CategoryKey } from '@frego/core';
import { AdPopup, VoucherTicket, type MerchantLogoKind } from '@/components/app';
import {
  BizMark,
  Check,
  Columns,
  KeyValue,
  KeyValueList,
  PageBody,
  PageHeader,
  Panel,
  PreviewBox,
  ProviderMark,
  QueueItem,
  QueueList,
  Status,
  SubHeading,
  Tabs,
  Topbar,
  WebIcon,
} from '@/components/web';
import { adminService } from '@/lib/server/data';
import { ReviewPanel } from './_components/ReviewPanel';

export const metadata: Metadata = { title: 'Duyệt doanh nghiệp, chiến dịch và banner' };

type Search = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const LOGO: Record<CategoryKey, MerchantLogoKind> = { cafe: 'cup', bowl: 'bowl', tea: 'lotus', gym: 'gym', book: 'book', cake: 'cake' };

export default async function ReviewPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const { svc } = await adminService();
  const v = await svc.getReviewPage({ tab: first(params.tab), id: first(params.id) });
  const d = v.selected;

  return (
    <>
      <Topbar crumbs="Frego / Duyệt" />
      <PageBody>
        <PageHeader
          title="Duyệt doanh nghiệp, chiến dịch và banner"
          description="Kiểm tra trước khi mã hiện trên app. Mục tiêu: xử lý trong 1 ngày làm việc."
        />
        <Tabs
          label="Loại hồ sơ"
          toolbar
          active={v.tab}
          items={v.tabs.map((t) => ({ key: t.key, label: t.label, count: t.count, href: `/quan-tri/duyet?tab=${t.key}` }))}
        />
        <Columns template="340px minmax(0,1fr)" stackBelow="lg">
          <Panel padding="sm" gap={0} label="Hàng chờ duyệt">
            {v.items.length ? (
              <QueueList label="Hàng chờ duyệt">
                {v.items.map((it) => (
                  <QueueItem
                    key={it.id}
                    selected={d?.id === it.id}
                    href={`/quan-tri/duyet?tab=${v.tab}&id=${encodeURIComponent(it.id)}`}
                    leading={<BizMark category={it.category} size={32} />}
                    title={it.title}
                    subtitle={it.subtitle}
                    meta={
                      <>
                        {it.providerId ? (
                          <ProviderMark provider={it.providerId} size={16} />
                        ) : (
                          <WebIcon name={it.kind === 'banner' ? 'camera' : 'brief'} size={16} className="text-nav-icon" />
                        )}
                        {it.meta}
                      </>
                    }
                    time={it.timeText}
                    status={<Status text={it.chip.text} tone={it.chip.tone} />}
                  />
                ))}
              </QueueList>
            ) : (
              <p className="m-0 px-3 py-6 text-center text-[14px] text-ink-2">{v.emptyText}</p>
            )}
          </Panel>

          {d ? (
            <ReviewPanel
              key={d.id}
              kind={d.kind}
              id={d.id}
              title={d.title}
              sub={d.sub}
              leading={<BizMark category={d.category} size={40} />}
              decision={d.decision ? d.decision.chip : null}
              approveConfirm={d.approveConfirm ?? null}
              left={
                d.banner ? (
                  <>
                    <SubHeading>Người dùng sẽ thấy</SubHeading>
                    <PreviewBox padding={14}>
                      <AdPopup
                        imageUrl={d.banner.imageUrl}
                        title={d.banner.title}
                        body={d.banner.body}
                        businessName={d.banner.businessName}
                        category={d.banner.category}
                        address={d.banner.address}
                        giftText={d.banner.giftText}
                      />
                    </PreviewBox>
                    <KeyValueList>
                      {d.facts.map((f) => (
                        <KeyValue key={f.label} label={f.label}>
                          {f.value}
                        </KeyValue>
                      ))}
                    </KeyValueList>
                  </>
                ) : d.preview ? (
                  <>
                    <SubHeading>Người dùng sẽ thấy</SubHeading>
                    <PreviewBox>
                      <VoucherTicket
                        mode="static"
                        logo={LOGO[d.preview.category]}
                        tag="sponsor"
                        title={d.preview.title}
                        amount={d.preview.amountText}
                        service={d.preview.serviceText}
                        line={d.preview.line}
                        meta={d.preview.meta}
                      />
                    </PreviewBox>
                    <KeyValueList>
                      {d.facts.map((f) => (
                        <KeyValue key={f.label} label={f.label}>
                          {f.value}
                        </KeyValue>
                      ))}
                    </KeyValueList>
                  </>
                ) : (
                  <>
                    <SubHeading>Hồ sơ</SubHeading>
                    <KeyValueList>
                      {d.facts.map((f) => (
                        <KeyValue key={f.label} label={f.label}>
                          {f.value}
                        </KeyValue>
                      ))}
                    </KeyValueList>
                    <ul aria-label="Giấy tờ đã gửi" className="m-0 grid list-none grid-cols-2 gap-2 p-0">
                      {d.files.map((f) => (
                        <li
                          key={f.text}
                          className="flex h-[84px] flex-col items-center justify-center gap-1.5 rounded-frame border border-dashed border-line-strong px-2 text-center text-[12px] text-ink-2"
                        >
                          <WebIcon name={f.icon} size={20} className={f.ok ? 'text-ink-2' : 'text-hint'} />
                          {f.text}
                        </li>
                      ))}
                    </ul>
                  </>
                )
              }
              checks={d.checks.map((c) => (
                <Check key={c.title} tone={c.tone} title={c.title} text={c.text} />
              ))}
            />
          ) : (
            <Panel padding="xl" label="Chi tiết">
              <p className="m-0 text-[14px] text-ink-2">Chọn một mục trong hàng chờ để xem chi tiết.</p>
            </Panel>
          )}
        </Columns>
      </PageBody>
    </>
  );
}
