// DN 1 · Tổng quan (thiết kế WebDnTongQuan.dc.html). Số liệu từ createBusinessService().getOverview().
import type { Metadata } from 'next';
import {
  BarChart,
  Button,
  Callout,
  Columns,
  Divider,
  Metric,
  MoreLink,
  PageBody,
  PageHeader,
  Panel,
  Section,
  StatCard,
  StatGroup,
  Table,
  Topbar,
} from '@/components/web';
import { bizService } from '@/lib/server/data';
import { CAMPAIGN_COLS, campaignRows } from './_components/campaign-table';

export const metadata: Metadata = { title: 'Tổng quan', robots: { index: false, follow: false } };

export default async function Page() {
  const { svc } = await bizService();
  const v = await svc.getOverview();
  return (
    <>
      <Topbar crumbs={`${v.businessName} / Tổng quan`} />
      <PageBody>
        <PageHeader
          title="Tổng quan"
          description={v.description}
          actions={
            v.canManage ? (
              <Button icon="plus" href="/doanh-nghiep/chien-dich/tao">
                Tạo chiến dịch
              </Button>
            ) : null
          }
        />
        <StatGroup label="Số liệu tháng này">
          {v.stats.map((s) => (
            <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
          ))}
        </StatGroup>
        <Columns template="minmax(0,2fr) minmax(0,1fr)" align="stretch">
          <Panel
            title="Chuyến đến quanh quán mỗi ngày"
            id="tq-chuyen"
            description="Mỗi chuyến là một mã đã dùng, điểm đến trong vùng áp dụng"
          >
            <BarChart bars={v.daily.bars} height={150} summary={v.daily.summary} labelHeader="Ngày" valueHeader="Chuyến" />
          </Panel>
          <Panel label="Ví và gợi ý">
            <Metric label="Số dư ví" value={v.wallet.balanceText} />
            <Callout text={v.wallet.noteText} tone={v.wallet.tone} />
            <div>
              <Button variant="secondary" icon="plus" href="/doanh-nghiep/vi">
                Nạp tiền
              </Button>
            </div>
            {v.peakText ? (
              <>
                <Divider />
                <Metric
                  label="Khách đến nhiều nhất"
                  value={<span className="text-[14px] font-medium">{v.peakText}</span>}
                  size="md"
                />
              </>
            ) : null}
          </Panel>
        </Columns>
        <Section title="Chiến dịch" id="tq-chien-dich" action={<MoreLink href="/doanh-nghiep/chien-dich" />}>
          <Table
            cols={CAMPAIGN_COLS}
            rows={campaignRows(v.campaigns)}
            caption={`Chiến dịch của ${v.businessName}`}
            emptyText="Chưa có chiến dịch đang chạy hoặc chờ duyệt."
          />
        </Section>
      </PageBody>
    </>
  );
}
