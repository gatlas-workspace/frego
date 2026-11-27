// QT 6 · Chiến dịch (WebQtChienDich): số liệu tháng, mọi chiến dịch tài trợ lọc theo trạng thái (?tab=, ?trang=).
// Bấm tên chiến dịch (?id=) mở khung chi tiết để Frego tạm dừng ngay hoặc cho chạy lại.
import type { Metadata } from 'next';
import Link from 'next/link';
import { brand } from '@frego/core';
import {
  BizMark,
  Button,
  Callout,
  DetailHeader,
  Drawer,
  Hint,
  KeyValue,
  KeyValueList,
  PageBody,
  PageHeader,
  Section,
  StatCard,
  StatGroup,
  Status,
  SubHeading,
  Table,
  Tabs,
  Timeline,
  Topbar,
  type TableColumn,
  type TableRow,
} from '@/components/web';
import { adminService } from '@/lib/server/data';
import { CampaignActions } from './_components/CampaignActions';

export const metadata: Metadata = { title: 'Chiến dịch' };

type Search = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const cols: TableColumn[] = [
  { label: 'Chiến dịch', w: 'minmax(0,1.3fr)' },
  { label: 'Ưu đãi', w: 'minmax(0,1.1fr)', type: 'text' },
  { label: 'Vùng', w: '80px', type: 'text' },
  { label: 'Mã dùng / tặng', align: 'right', w: '130px' },
  { label: 'Ngân sách còn', align: 'right', w: '130px', type: 'money' },
  { label: 'Trạng thái', w: '180px' },
];

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const { svc } = await adminService();
  const v = await svc.getCampaignsPage({ tab: first(params.tab), id: first(params.id), page: Number(first(params.trang) ?? 1) || 1 });

  const href = (q: { tab?: string; page?: number; id?: string }) => {
    const sp = new URLSearchParams();
    if (q.tab && q.tab !== 'tat-ca') sp.set('tab', q.tab);
    if (q.page && q.page > 1) sp.set('trang', String(q.page));
    if (q.id) sp.set('id', q.id);
    const s = sp.toString();
    return `/quan-tri/chien-dich${s ? `?${s}` : ''}`;
  };
  const here = { tab: v.tab, page: v.page };
  const rows: TableRow[] = v.rows.map((r) => ({
    key: r.id,
    highlight: v.selected?.id === r.id,
    cells: [
      { text: r.name, sub: r.businessName, strong: true, href: href({ ...here, id: r.id }) },
      { text: r.offerText, logo: r.providerId },
      r.radiusText,
      r.codesText,
      { text: r.budgetText, muted: r.budgetMuted },
      { text: r.chip.text, status: r.chip.tone },
    ],
  }));
  const d = v.selected;
  const linkCls = 'font-medium text-blue-deep no-underline hover:underline';

  return (
    <>
      <Topbar crumbs="Frego / Chiến dịch" />
      <PageBody>
        <PageHeader
          title="Chiến dịch"
          description="Mọi chiến dịch voucher tài trợ trên hệ thống. Frego có thể tạm dừng ngay chiến dịch có vấn đề, doanh nghiệp được báo qua email."
        />
        <StatGroup label="Số liệu chiến dịch">
          {v.kpis.map((k) => (
            <StatCard key={k.key} label={k.label} value={k.value} sub={k.sub} delta={k.delta ?? undefined} tone={k.deltaTone} />
          ))}
        </StatGroup>
        <Section label="Danh sách chiến dịch" gap={0}>
          <Tabs
            label="Danh sách chiến dịch"
            toolbar
            active={v.tab}
            items={v.tabs.map((t) => ({ key: t.key, label: t.label, count: t.count, icon: t.icon, href: href({ tab: t.key }) }))}
          />
          <Table cols={cols} rows={rows} caption="Chiến dịch trên hệ thống" flush emptyText="Không có chiến dịch nào ở trạng thái này." />
          <Hint>
            {v.hint}
            {v.pageCount > 1 ? (
              <span className="ml-2 inline-flex gap-3">
                {v.page > 1 ? (
                  <Link href={href({ tab: v.tab, page: v.page - 1 })} scroll={false} className={linkCls}>
                    Trang trước
                  </Link>
                ) : null}
                {v.page < v.pageCount ? (
                  <Link href={href({ tab: v.tab, page: v.page + 1 })} scroll={false} className={linkCls}>
                    Trang sau ({v.page + 1}/{v.pageCount})
                  </Link>
                ) : null}
              </span>
            ) : null}
          </Hint>
        </Section>
        <Callout
          text={`Frego tự dừng chiến dịch khi ví doanh nghiệp hết tiền, hoặc khi từ ${brand.autoHideReportThreshold} người báo mã không dùng được trong 24 giờ. Mã đã phát vẫn dùng được đến hết hạn.`}
        />
      </PageBody>

      <Drawer
        open={!!d}
        title="Chi tiết chiến dịch"
        closeHref={href(here)}
        footer={
          <Button variant="secondary" href={href(here)}>
            Đóng
          </Button>
        }
      >
        {d ? (
          <>
            <DetailHeader
              leading={<BizMark category={d.category} size={40} />}
              title={d.name}
              sub={d.businessName}
              trailing={<Status text={d.chip.text} tone={d.chip.tone} />}
            />
            <KeyValueList>
              {d.facts.map((f) => (
                <KeyValue key={f.label} label={f.label} labelWidth={130}>
                  {f.value}
                </KeyValue>
              ))}
            </KeyValueList>
            <CampaignActions
              key={d.id}
              campaignId={d.id}
              canPause={d.canPause}
              canResume={d.canResume}
              note={d.note}
              reviewHref={d.reviewHref}
            />
            {d.events.length ? (
              <div className="flex flex-col gap-1">
                <SubHeading>Lịch sử</SubHeading>
                <Timeline items={d.events} label={`Lịch sử chiến dịch ${d.name}`} />
              </div>
            ) : null}
          </>
        ) : null}
      </Drawer>
    </>
  );
}
