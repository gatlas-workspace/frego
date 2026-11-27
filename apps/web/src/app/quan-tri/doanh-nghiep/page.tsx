// QT 5 · Doanh nghiệp (WebQtDoanhNghiep): danh sách lọc theo trạng thái (?tab=), chọn dòng (?id=) để xem
// hồ sơ, ví, chiến dịch; "Nhắc nạp ví", "Tạm khóa" / "Mở khóa". Hiện 7 dòng đầu, ?xem=tat-ca để xem hết.
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Columns,
  DetailHeader,
  Hint,
  KeyValue,
  KeyValueList,
  List,
  ListRow,
  PageBody,
  PageHeader,
  Panel,
  ProviderMark,
  Section,
  Status,
  SubHeading,
  Table,
  Tabs,
  Topbar,
  type TableColumn,
  type TableRow,
} from '@/components/web';
import { adminService } from '@/lib/server/data';
import { BizActions } from './_components/BizActions';

export const metadata: Metadata = { title: 'Doanh nghiệp' };

type Search = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const cols: TableColumn[] = [
  { label: 'Doanh nghiệp', w: 'minmax(0,1fr)' },
  { label: 'Chiến dịch', w: '150px', type: 'text' },
  { label: 'Mã dùng', align: 'right', w: '96px' },
  { label: 'Ví', w: '150px', type: 'money' },
  { label: 'Trạng thái', w: '146px' },
];

export default async function BusinessesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const all = first(params.xem) === 'tat-ca';
  const { svc } = await adminService();
  const v = await svc.getBusinessesPage({ tab: first(params.tab), id: first(params.id), all });

  const href = (q: { tab?: string; id?: string; all?: boolean }) => {
    const sp = new URLSearchParams();
    if (q.tab && q.tab !== 'tat-ca') sp.set('tab', q.tab);
    if (q.all) sp.set('xem', 'tat-ca');
    if (q.id) sp.set('id', q.id);
    const s = sp.toString();
    return `/quan-tri/doanh-nghiep${s ? `?${s}` : ''}`;
  };
  const rows: TableRow[] = v.rows.map((r) => ({
    key: r.id,
    highlight: v.selected?.id === r.id,
    cells: [
      { text: r.name, sub: r.sub, strong: true, href: href({ tab: v.tab, id: r.id, all }) },
      { text: r.campaignsText, sub: r.campaignsSub || undefined, muted: r.campaignsMuted },
      r.usedText,
      { text: r.wallet.text, status: r.wallet.tone },
      { text: r.chip.text, status: r.chip.tone },
    ],
  }));
  const d = v.selected;

  return (
    <>
      <Topbar crumbs="Frego / Doanh nghiệp" />
      <PageBody>
        <PageHeader
          title="Doanh nghiệp"
          description="Hồ sơ, ví và chiến dịch của từng doanh nghiệp tài trợ. Doanh nghiệp chỉ thấy số liệu tổng, không thấy người nhận mã."
        />
        <Columns template="minmax(0,1fr) 330px" gap={24}>
          <Section label="Danh sách doanh nghiệp" gap={0}>
            <Tabs
              label="Danh sách doanh nghiệp"
              toolbar
              active={v.tab}
              items={v.tabs.map((t) => ({ key: t.key, label: t.label, count: t.count, icon: t.icon, href: href({ tab: t.key }) }))}
            />
            <Table cols={cols} rows={rows} caption="Danh sách doanh nghiệp" flush emptyText="Không có doanh nghiệp nào ở trạng thái này." />
            <Hint>
              {v.shownText}{' '}
              {v.hasMore ? (
                <Link href={href({ tab: v.tab, id: d?.id, all: true })} scroll={false} className="font-medium text-blue-deep no-underline hover:underline">
                  Xem tất cả
                </Link>
              ) : all && v.total > 7 ? (
                <Link href={href({ tab: v.tab, id: d?.id })} scroll={false} className="font-medium text-blue-deep no-underline hover:underline">
                  Thu gọn
                </Link>
              ) : null}
            </Hint>
          </Section>

          {d ? (
            <Panel as="aside" padding="lg" gap={12} label={`Chi tiết ${d.name}`} sticky>
              <DetailHeader title={d.name} sub={d.sub} trailing={<Status text={d.chip.text} tone={d.chip.tone} />} />
              <KeyValueList>
                {d.facts.map((f) => (
                  <KeyValue key={f.label} label={f.label} labelWidth={120}>
                    {f.value}
                  </KeyValue>
                ))}
              </KeyValueList>
              <SubHeading className="mt-1">Chiến dịch</SubHeading>
              {d.campaigns.length ? (
                <List label={`Chiến dịch của ${d.name}`}>
                  {d.campaigns.map((c) => (
                    <ListRow
                      key={c.id}
                      padding={8}
                      strong={false}
                      leading={<ProviderMark provider={c.providerId} size={20} />}
                      title={
                        <Link href={`/quan-tri/chien-dich?id=${encodeURIComponent(c.id)}`} className="text-ink no-underline hover:underline">
                          {c.name}
                        </Link>
                      }
                      trailing={<Status text={c.chip.text} tone={c.chip.tone} />}
                    />
                  ))}
                </List>
              ) : (
                <p className="m-0 text-[14px] text-ink-2">Chưa có chiến dịch đang chạy hay chờ duyệt.</p>
              )}
              <BizActions key={d.id} businessId={d.id} status={d.status} lockNote={d.lockNote} reviewHref={d.reviewHref} />
            </Panel>
          ) : null}
        </Columns>
      </PageBody>
    </>
  );
}
