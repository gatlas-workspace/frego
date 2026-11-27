// QT 7 · Tiền và đối soát (WebQtThanhToan): nạp tiền chờ khớp, trừ ví hằng ngày, đối soát hãng xe, hóa đơn.
import type { Metadata } from 'next';
import {
  Callout,
  Hint,
  PageBody,
  PageHeader,
  StatCard,
  StatGroup,
  Table,
  Tabs,
  Topbar,
  type TableColumn,
  type TableRow,
} from '@/components/web';
import { adminOpsService } from '@/lib/server/data';
import { TopupMatch } from './_components/TopupMatch';

export const metadata: Metadata = { title: 'Tiền và đối soát' };

type Search = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const TABS = ['topup', 'deduct', 'recon', 'invoice'] as const;
type Tab = (typeof TABS)[number];

const topCols: TableColumn[] = [
  { label: 'Thời gian', w: '120px' },
  { label: 'Doanh nghiệp', w: 'minmax(0,1fr)' },
  { label: 'Nội dung chuyển khoản', w: '200px', type: 'text' },
  { label: 'Số tiền', align: 'right', w: '140px' },
  { label: 'Trạng thái', w: '170px' },
];
const recCols: TableColumn[] = [
  { label: 'Hãng xe', w: 'minmax(0,1fr)' },
  { label: 'Frego ghi nhận', align: 'right', w: '140px' },
  { label: 'Hãng xác nhận', align: 'right', w: '140px' },
  { label: 'Chênh lệch', align: 'right', w: '120px' },
  { label: 'Tiền giảm phải trả hãng', align: 'right', w: '210px', type: 'money' },
  { label: 'Trạng thái', w: '170px' },
];
const invCols: TableColumn[] = [
  { label: 'Doanh nghiệp', w: 'minmax(0,1fr)' },
  { label: 'Kỳ', w: '120px', type: 'date' },
  { label: 'Số tiền', align: 'right', w: '140px' },
  { label: 'Gửi tới', w: '220px', type: 'text' },
  { label: 'Trạng thái', w: '150px' },
];

export default async function MoneyPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const tabParam = first(params.tab);
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'topup';
  const chosenId = first(params.chon);

  const { svc } = await adminOpsService();
  const v = await svc.getMoney();
  const { walletHeld, deducted, serviceFee, pendingTopups } = v.stats;

  // Giao dịch nút "Khớp" áp dụng: dòng chờ khớp đang chọn, không thì dòng chờ đầu tiên trong bảng.
  const target = v.pendingTopups.find((p) => p.id === chosenId) ?? v.pendingTopups[0] ?? null;
  const chosenIndex = chosenId ? v.topups.findIndex((t) => t.id === chosenId && t.status === 'pending') : -1;

  const topRows: TableRow[] = v.topups.map((t) => ({
    key: t.id,
    cells: [
      t.timeText,
      {
        text: t.businessName,
        strong: true,
        href: t.status === 'pending' ? `/quan-tri/tien?tab=topup&chon=${encodeURIComponent(t.id)}` : undefined,
      },
      // Nội dung chuyển khoản ("FREGO CPM1024") hiện như mã; nguồn khác ("Thẻ đã lưu") là chữ thường.
      { text: t.reference, code: /^[A-Z0-9 ]+$/.test(t.reference) },
      { text: t.amountText, strong: true },
      { text: t.label.text, status: t.label.tone },
    ],
  }));

  const dedCols: TableColumn[] = [
    { label: 'Doanh nghiệp', w: 'minmax(0,1fr)' },
    { label: `Mã dùng ${v.deductions.usedDayText}`, align: 'right', w: '140px' },
    { label: 'Giá trị giảm', align: 'right', w: '130px', type: 'money' },
    { label: 'Phí dịch vụ', align: 'right', w: '120px' },
    { label: 'Tổng trừ', align: 'right', w: '120px', type: 'money' },
    { label: 'Trạng thái', w: '200px' },
  ];
  const dedRows: TableRow[] = v.deductions.rows.map((d) => ({
    key: d.id,
    cells: [
      { text: d.businessName, strong: true },
      d.codesText,
      d.discountText,
      d.feeText,
      { text: d.totalText, strong: true },
      { text: d.label.text, status: d.label.tone },
    ],
  }));

  const recRows: TableRow[] = v.recon.rows.map((r) => ({
    key: r.providerId,
    cells: [
      { text: r.name, logo: r.providerId, strong: true },
      r.recordedText,
      r.confirmedText,
      { text: r.diffText, tone: r.diffBad ? 'bad' : '', strong: r.diffBad },
      r.payableText,
      { text: r.label.text, status: r.label.tone },
    ],
  }));

  const invRows: TableRow[] = v.invoices.map((i) => ({
    key: i.id,
    cells: [
      { text: i.businessName, strong: true },
      i.periodText,
      i.amountText,
      i.sendTo,
      { text: i.label.text, status: i.label.tone },
    ],
  }));

  return (
    <>
      <Topbar crumbs="Frego / Tiền và đối soát" />
      <PageBody>
        <PageHeader
          title="Tiền và đối soát"
          description="Tiền doanh nghiệp nạp vào ví, tiền trừ cho mã đã dùng, số tiền giảm phải trả hãng xe và hóa đơn hằng tháng."
        />
        <StatGroup label="Số liệu tiền tháng này">
          <StatCard label={walletHeld.label} value={walletHeld.value} sub={walletHeld.sub} />
          <StatCard label={deducted.label} value={deducted.value} sub={deducted.sub} />
          <StatCard label={serviceFee.label} value={serviceFee.value} sub={serviceFee.sub} delta={serviceFee.delta} tone={serviceFee.deltaTone} />
          <StatCard label={pendingTopups.label} value={pendingTopups.value} sub={pendingTopups.sub} />
        </StatGroup>

        <section aria-label="Sổ tiền" className="flex min-w-0 flex-col">
          <Tabs
            label="Sổ tiền"
            toolbar
            active={tab}
            pathname="/quan-tri/tien"
            items={[
              { key: 'topup', label: 'Nạp tiền', icon: 'table' },
              { key: 'deduct', label: `Trừ ví ngày ${v.deductions.runDayText}` },
              { key: 'recon', label: 'Đối soát hãng xe' },
              { key: 'invoice', label: 'Hóa đơn' },
            ]}
          />
          {tab === 'topup' ? (
            <>
              <Table cols={topCols} rows={topRows} caption="Nạp tiền" flush highlight={chosenIndex >= 0 ? chosenIndex : undefined} emptyText="Chưa có lần nạp tiền nào." />
              <TopupMatch
                target={target}
                note="Khớp theo nội dung chuyển khoản. Doanh nghiệp được báo ngay khi tiền vào ví."
              />
            </>
          ) : null}
          {tab === 'deduct' ? (
            <>
              <Table cols={dedCols} rows={dedRows} caption="Trừ ví" flush emptyText="Chưa có lần trừ ví nào." />
              <Hint>
                Trừ lúc 00:05 mỗi ngày cho mã dùng hôm trước. Mã chưa được hãng xác nhận vẫn trừ, sẽ hoàn lại nếu hãng báo không có chuyến.
              </Hint>
            </>
          ) : null}
          {tab === 'recon' ? (
            <>
              <Table cols={recCols} rows={recRows} caption="Đối soát hãng xe" flush emptyText="Chưa có số đối soát tháng này." />
              <Callout text={v.recon.note} tone="grey" icon="info" className="mt-3" />
            </>
          ) : null}
          {tab === 'invoice' ? <Table cols={invCols} rows={invRows} caption="Hóa đơn" flush emptyText="Chưa có hóa đơn." /> : null}
        </section>
      </PageBody>
    </>
  );
}
