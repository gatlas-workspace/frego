// DN 5 · Ví và hóa đơn (thiết kế WebDnVi.dc.html): số dư, tự nạp, nạp chuyển khoản, giao dịch, hóa đơn điện tử.
import type { Metadata } from 'next';
import { brand, formatVnd } from '@frego/core';
import {
  Button,
  Columns,
  Divider,
  List,
  ListRow,
  Metric,
  PageBody,
  PageHeader,
  Panel,
  Section,
  Status,
  Table,
  Topbar,
  type TableColumn,
  type TableRow,
} from '@/components/web';
import { bizService } from '@/lib/server/data';
import { AutoTopupToggle } from './_components/AutoTopupToggle';
import { InvoiceEmailForm } from './_components/InvoiceEmailForm';
import { TopupPanel } from './_components/TopupPanel';

export const metadata: Metadata = { title: 'Ví và hóa đơn', robots: { index: false, follow: false } };

const TX_COLS: TableColumn[] = [
  { label: 'Ngày', w: '110px' },
  { label: 'Nội dung', w: 'minmax(0,1fr)' },
  { label: 'Số tiền', align: 'right', w: '130px' },
  { label: 'Số dư sau', align: 'right', w: '120px' },
];

export default async function Page() {
  const { session, svc } = await bizService();
  const v = await svc.getWallet();
  const bizName = session.businessName ?? 'Cửa hàng';
  const rows: TableRow[] = v.transactions.map((t) => ({
    key: t.id,
    cells: [
      t.dateText,
      { text: t.title, sub: t.sub, strong: true },
      { text: t.amountText, tone: t.tone, strong: true, muted: t.pending },
      t.pending ? { text: t.balanceAfterText, muted: true } : t.balanceAfterText,
    ],
  }));
  return (
    <>
      <Topbar crumbs={`${bizName} / Ví và hóa đơn`} />
      <PageBody>
        <PageHeader
          title="Ví và hóa đơn"
          description={`Nạp trước, mỗi mã được dùng trừ giá trị giảm cộng ${formatVnd(brand.serviceFeePerCode)} phí dịch vụ. Tiền trừ một lần mỗi ngày cho các mã dùng hôm trước.`}
        />
        <Columns template="minmax(0,1fr) minmax(0,1.3fr)">
          <Panel label="Số dư" gap={14}>
            <Metric label="Số dư ví" value={v.balanceText} sub={v.coverText} size="xl" />
            <Divider />
            <AutoTopupToggle
              enabled={v.autoTopup.enabled}
              title={v.autoTopup.title}
              sub={v.autoTopup.sub}
              disabled={!v.canManage}
            />
          </Panel>
          <TopupPanel options={v.topupOptions} defaultAmount={v.defaultTopup} transferCode={v.transferCode} />
        </Columns>
        <Columns template="minmax(0,1.7fr) minmax(0,1fr)" gap={32}>
          <Section title="Giao dịch gần đây" id="vi-gd">
            <Table cols={TX_COLS} rows={rows} caption="Giao dịch ví" emptyText="Chưa có giao dịch." />
          </Section>
          <Section title="Hóa đơn điện tử" id="vi-hd" description="Xuất theo tháng cho số tiền đã trừ ví">
            <List framed label="Hóa đơn theo tháng">
              {v.invoices.map((inv) => (
                <ListRow
                  key={inv.id}
                  padding={10}
                  icon="receipt"
                  title={inv.title}
                  sub={<span className="tabular-nums">{inv.sub}</span>}
                  trailing={
                    <>
                      <Status text={inv.statusText} tone={inv.statusTone} />
                      {inv.issued ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon="download"
                          disabled
                          title={`Bản PDF được gửi tới ${v.invoiceEmail || 'email nhận hóa đơn'}`}
                        >
                          Tải PDF
                        </Button>
                      ) : null}
                    </>
                  }
                />
              ))}
            </List>
            <InvoiceEmailForm email={v.invoiceEmail} disabled={!v.canManage} />
          </Section>
        </Columns>
      </PageBody>
    </>
  );
}
