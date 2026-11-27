// QT 1 · Tổng quan hệ thống (WebQtTongQuan): số liệu tháng, mã được dùng mỗi ngày, việc cần xử lý,
// doanh nghiệp tài trợ theo mã được dùng, độ khớp giá ước tính. Số liệu lấy từ createAdminService().getOverview().
import type { Metadata } from 'next';
import {
  BarChart,
  Columns,
  List,
  ListRow,
  Meter,
  MoreLink,
  PageBody,
  PageHeader,
  Panel,
  Section,
  StatCard,
  StatGroup,
  Table,
  Topbar,
  WebIcon,
  type TableColumn,
  type TableRow,
} from '@/components/web';
import { adminService } from '@/lib/server/data';

export const metadata: Metadata = { title: 'Tổng quan hệ thống' };

const sponsorCols: TableColumn[] = [
  { label: 'Doanh nghiệp', w: 'minmax(0,1fr)' },
  { label: 'Đang chạy', align: 'right', w: '112px' },
  { label: 'Mã dùng', align: 'right', w: '104px' },
  { label: 'Phí dịch vụ', align: 'right', w: '128px' },
  { label: 'Ví', w: '170px' },
];

const todoColor = { warn: 'text-warn', bad: 'text-bad', good: 'text-good', info: 'text-info' } as const;

export default async function AdminOverviewPage() {
  const { svc } = await adminService();
  const v = await svc.getOverview();

  const sponsorRows: TableRow[] = v.sponsors.map((s) => ({
    key: s.id,
    cells: [
      { text: s.name, strong: true, href: s.href },
      s.runningText,
      s.usedText,
      s.feeText,
      { text: s.wallet.text, status: s.wallet.tone },
    ],
  }));

  return (
    <>
      <Topbar crumbs="Frego / Tổng quan" />
      <PageBody>
        <PageHeader title="Tổng quan hệ thống" description={v.description} />

        <StatGroup label="Số liệu tháng này">
          {v.kpis.map((k) => (
            <StatCard key={k.key} label={k.label} value={k.value} sub={k.sub} delta={k.delta ?? undefined} tone={k.deltaTone} />
          ))}
        </StatGroup>

        <Columns template="minmax(0,1.7fr) minmax(0,1fr)" align="stretch">
          <Panel title="Mã được dùng mỗi ngày" id="qt-ma">
            <BarChart bars={v.daily} height={130} summary={v.dailySummary} labelHeader="Ngày" valueHeader="Mã được dùng" />
            <div className="grid grid-cols-1 gap-[18px] @min-[520px]:grid-cols-3">
              {v.mix.map((m) => (
                <Meter key={m.key} label={m.label} value={m.valueText} percent={m.percent} tone={m.tone} />
              ))}
            </div>
          </Panel>
          <Panel title="Cần xử lý" id="qt-viec" gap={6}>
            <List divider="top" label="Việc cần xử lý">
              {v.todo.map((it) => (
                <ListRow
                  key={it.key}
                  leading={<WebIcon name={it.icon} size={18} strokeWidth={2} className={todoColor[it.tone]} />}
                  title={it.title}
                  sub={it.sub}
                  href={it.href ?? undefined}
                />
              ))}
            </List>
          </Panel>
        </Columns>

        <Columns template="minmax(0,1.7fr) minmax(0,1fr)">
          <Section
            title="Doanh nghiệp tài trợ"
            id="qt-dn"
            action={<span className="text-[13px] text-ink-2">theo mã được dùng tháng này</span>}
          >
            <Table
              cols={sponsorCols}
              rows={sponsorRows}
              caption="Doanh nghiệp tài trợ theo mã được dùng tháng này"
              emptyText="Chưa có mã tài trợ nào được dùng tháng này."
            />
          </Section>
          <Panel title="Độ khớp giá ước tính" id="qt-gia" action={<MoreLink href="/quan-tri/nguoi-dung?tab=bao-gia">Chi tiết</MoreLink>}>
            {v.accuracy.map((a) => (
              <Meter key={a.key} label={a.label} logo={a.providerId} value={a.valueText} percent={a.percent} tone={a.tone} />
            ))}
          </Panel>
        </Columns>
      </PageBody>
    </>
  );
}
