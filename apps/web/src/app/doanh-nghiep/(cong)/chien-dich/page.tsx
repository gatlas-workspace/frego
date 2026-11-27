// DN 2 · Chiến dịch (thiết kế WebDnChienDich.dc.html). Lọc theo trạng thái bằng ?tab=.
import type { Metadata } from 'next';
import { brand, formatVnd } from '@frego/core';
import {
  Button,
  Callout,
  Columns,
  InfoTile,
  PageBody,
  PageHeader,
  Section,
  Table,
  Tabs,
  Topbar,
  type SearchParamsLike,
} from '@/components/web';
import { bizService } from '@/lib/server/data';
import { CAMPAIGN_COLS, campaignRows } from '../_components/campaign-table';

export const metadata: Metadata = { title: 'Chiến dịch', robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<SearchParamsLike> }) {
  const sp = await searchParams;
  const { session, svc } = await bizService();
  const v = await svc.listCampaigns(typeof sp.tab === 'string' ? sp.tab : undefined);
  const bizName = session.businessName ?? 'Cửa hàng';
  return (
    <>
      <Topbar crumbs={`${bizName} / Chiến dịch`} />
      <PageBody>
        <PageHeader
          title="Chiến dịch"
          description="Mỗi chiến dịch tặng mã giảm giá cho người hay đi đến gần quán. Bạn chỉ trả tiền khi mã được dùng."
          actions={
            v.canManage ? (
              <Button icon="plus" href="/doanh-nghiep/chien-dich/tao">
                Tạo chiến dịch
              </Button>
            ) : null
          }
        />
        {v.running || v.rejected ? (
          <Columns template="minmax(0,1fr) minmax(0,1fr)" gap={12} stackBelow="lg">
            {v.running ? (
              <Callout tone="subtle" icon="ticket" iconColor="good" href={v.running.href} action="Xem chi tiết">
                <b className="font-medium">Đang chạy:</b> {v.running.name}, ngân sách còn {v.running.leftText}
              </Callout>
            ) : null}
            {v.rejected ? (
              <Callout tone="red" icon="x" href={v.rejected.href} action="Sửa và gửi lại">
                <b className="font-medium">Bị từ chối:</b> {v.rejected.name}. Lý do: {v.rejected.reason}
              </Callout>
            ) : null}
          </Columns>
        ) : null}
        <Section label="Danh sách chiến dịch" gap={0}>
          <Tabs
            label="Lọc chiến dịch"
            toolbar
            active={v.activeTab}
            query={sp}
            items={v.tabs.map((t) => ({ key: t.key, label: t.label, count: t.count, icon: t.key === 'tat-ca' ? 'table' : undefined }))}
          />
          <Table
            flush
            cols={CAMPAIGN_COLS}
            rows={campaignRows(v.rows)}
            caption="Danh sách chiến dịch"
            emptyText="Không có chiến dịch nào ở trạng thái này."
          />
        </Section>
        <Columns template="repeat(3,minmax(0,1fr))" gap={12} align="stretch">
          <InfoTile icon="pin" title="Frego chọn người nhận">
            Mã được tặng cho người hay đặt xe tới vùng quanh quán, đúng khung giờ bạn chọn. Bạn chỉ thấy số liệu tổng, không biết
            người nhận là ai.
          </InfoTile>
          <InfoTile icon="check" title="Mã được gắn khi có lợi nhất">
            Frego gắn mã theo số tiền người dùng được giảm, không theo tiền tài trợ. Mức giảm cao hơn mã công khai thì mã của bạn
            được gắn nhiều hơn.
          </InfoTile>
          <InfoTile icon="wallet" title="Trả khi mã được dùng">
            Mỗi mã được dùng trừ ví: giá trị giảm cộng {formatVnd(brand.serviceFeePerCode)} phí dịch vụ. Mã tặng mà không ai dùng
            thì không mất tiền.
          </InfoTile>
        </Columns>
      </PageBody>
    </>
  );
}
