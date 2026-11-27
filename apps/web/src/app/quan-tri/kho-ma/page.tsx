// QT 3 · Kho mã công khai (WebQtKhoMa): bảng mã lọc theo trạng thái (?tab=), khung "Thêm mã" (?them=1),
// mã vừa thêm được tô xám (?moi=<id>) ở trạng thái "Chờ kiểm tra".
import type { Metadata } from 'next';
import { brand } from '@frego/core';
import {
  Button,
  Callout,
  InfoTile,
  PageBody,
  PageHeader,
  Section,
  Table,
  Tabs,
  Topbar,
  type TableColumn,
  type TableRow,
} from '@/components/web';
import { adminService } from '@/lib/server/data';
import { AddCodeDrawer } from './_components/AddCodeDrawer';

export const metadata: Metadata = { title: 'Kho mã công khai' };

type Search = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const cols: TableColumn[] = [
  { label: 'Mã', w: '160px' },
  { label: 'Ưu đãi', w: 'minmax(0,1.6fr)' },
  { label: 'Điều kiện', w: 'minmax(0,1.1fr)' },
  { label: 'Kiểm tra', w: '112px' },
  { label: 'Lượt dùng', align: 'right', w: '110px' },
  { label: 'Báo lỗi 24h', align: 'right', w: '124px' },
  { label: 'Trạng thái', w: '146px' },
];

export default async function PublicCodesPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const { svc } = await adminService();
  const v = await svc.getPublicCodes({ tab: first(params.tab) });
  const fresh = first(params.moi);
  const base = v.tab === 'tat-ca' ? '/quan-tri/kho-ma' : `/quan-tri/kho-ma?tab=${v.tab}`;
  const addHref = `/quan-tri/kho-ma?${v.tab === 'tat-ca' ? '' : `tab=${v.tab}&`}them=1`;

  const rows: TableRow[] = v.rows.map((r) => ({
    key: r.id,
    highlight: r.id === fresh,
    cells: [
      { text: r.code, sub: r.sourceText, code: true },
      { text: r.offerText, logo: r.providerId },
      { text: r.conditionText, muted: r.conditionMuted },
      { text: r.checkedText, muted: true },
      r.usedText,
      { text: r.badText, tone: r.badHigh ? 'bad' : '', strong: r.badHigh },
      { text: r.chip.text, status: r.chip.tone },
    ],
  }));

  return (
    <>
      <Topbar crumbs="Frego / Kho mã công khai" />
      <PageBody>
        <PageHeader
          title="Kho mã công khai"
          description="Mã của hãng xe và ngân hàng mà ai cũng nhập được. Frego tự kiểm tra định kỳ, mã bị nhiều người báo lỗi sẽ tự ẩn khỏi app."
          actions={
            <Button icon="plus" href={addHref}>
              Thêm mã
            </Button>
          }
        />
        <Section label="Mã công khai" gap={0}>
          <Tabs
            label="Lọc mã"
            toolbar
            active={v.tab}
            items={v.tabs.map((t) => ({
              key: t.key,
              label: t.label,
              count: t.count,
              href: t.key === 'tat-ca' ? '/quan-tri/kho-ma' : `/quan-tri/kho-ma?tab=${t.key}`,
            }))}
          />
          <Table cols={cols} rows={rows} caption="Mã công khai" emptyText={v.emptyText} addLabel="Thêm mã" addHref={addHref} flush />
        </Section>
        {fresh && v.rows.some((r) => r.id === fresh) ? (
          <Callout tone="green" icon="check" role="status">
            Đã thêm mã <strong>{v.rows.find((r) => r.id === fresh)!.code}</strong>. Frego đang mở nguồn để kiểm tra, mã hiện trên app khi kiểm tra xong.
          </Callout>
        ) : null}
        <Callout
          tone="blue"
          text="Be chưa đăng mã công khai, ưu đãi của Be nằm trong mục Khuyến mãi của app Be. Green SM bán gói hội viên, không có mã nhập tay."
        />
        <div className="grid flex-none grid-cols-1 gap-3 @min-[760px]:grid-cols-3">
          <InfoTile icon="clock" title="Tự kiểm tra">
            Mỗi 2 giờ Frego đọc lại trang khuyến mãi của hãng. Mã biến mất khỏi nguồn sẽ chuyển sang Chờ kiểm tra.
          </InfoTile>
          <InfoTile icon="shield" title="Tự ẩn khi bị báo lỗi">
            Từ {brand.autoHideReportThreshold} lượt báo &quot;không dùng được&quot; trong 24 giờ, mã ẩn khỏi app cho tới khi có người kiểm tra
            lại.
          </InfoTile>
          <InfoTile icon="link" title="Luôn ghi nguồn">
            Mỗi mã trên app đều kèm nguồn và thời điểm kiểm tra, như người dùng thấy ở Ví voucher.
          </InfoTile>
        </div>
      </PageBody>
      <AddCodeDrawer key={first(params.them) === '1' ? 'mo' : 'dong'} open={first(params.them) === '1'} closeHref={base} banks={v.banks} />
    </>
  );
}
