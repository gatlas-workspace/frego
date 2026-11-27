// Trang mẫu ghép khung + thành phần, dựng lại WebDnTongQuan (mặc định) và WebQtDuyet (?vai-tro=quan-tri)
// bằng dữ liệu tĩnh trong thiết kế. Dùng để so ảnh chụp với thiết kế và làm mẫu cho các trang thật.
import type { Metadata } from 'next';
import {
  BarChart,
  BizMark,
  Button,
  Callout,
  Check,
  Columns,
  DetailHeader,
  Divider,
  Input,
  KeyValue,
  KeyValueList,
  Metric,
  MoreLink,
  PageBody,
  PageHeader,
  Panel,
  PortalShell,
  PreviewBox,
  ProviderMark,
  QueueItem,
  QueueList,
  Section,
  StatCard,
  StatGroup,
  Status,
  SubHeading,
  Table,
  Tabs,
  Topbar,
  type Bar,
  type TableColumn,
  type TableRow,
} from '@/components/web';

export const metadata: Metadata = { title: 'Khung mẫu', robots: { index: false, follow: false } };

const daily: Bar[] = [26, 12, 11, 13, 11, 15, 35, 33, 11, 12, 13, 14, 16, 35, 33, 11, 13, 12, 11, 13, 19, 17].map((v, i) => ({
  label: [1, 5, 10, 15, 20, 22].includes(i + 1) ? String(i + 1) : '',
  srLabel: `${i + 1}/11`,
  value: v,
  highlight: i === 13,
}));

const cols: TableColumn[] = [
  { label: 'Chiến dịch', w: '1.6fr' },
  { label: 'Ưu đãi và vùng', w: '1.5fr' },
  { label: 'Mã dùng / tặng', align: 'right', w: '150px' },
  { label: 'Đã chi', align: 'right', w: '130px' },
  { label: 'Trạng thái', w: '170px' },
];
const rows: TableRow[] = [
  [
    { text: 'Khách chiều quanh Chợ Bến Thành', sub: '01/11 – 30/11/2026 · 13:00–19:00', strong: true },
    { text: 'Grab ô tô 4 chỗ · −20.000đ', logo: 'grab', sub: '500 m quanh quán' },
    { text: '312 / 980', sub: '32% được dùng' },
    { text: '7.176.000đ', strong: true },
    { text: 'Đang chạy', status: 'green' },
  ],
  [
    { text: 'Xe máy cuối tuần', sub: 'Thứ Bảy, Chủ nhật · dừng từ 16/11', strong: true },
    { text: 'Be xe máy · −10.000đ', logo: 'be', sub: '500 m quanh quán' },
    { text: '74 / 260', sub: '28% được dùng' },
    { text: '962.000đ', strong: true },
    { text: 'Tạm dừng', status: 'grey' },
  ],
  [
    { text: 'Khai trương món mới', sub: '01/12 – 31/12/2026', strong: true },
    { text: 'Green SM xe máy · −15.000đ', logo: 'gsm', sub: '800 m quanh quán' },
    { text: '—', sub: 'chưa chạy' },
    { text: '0đ', strong: true },
    { text: 'Chờ Frego duyệt', status: 'amber' },
  ],
];

function BizOverview() {
  return (
    <PortalShell role="biz" active="tongquan" account={{ displayName: 'Chủ Cà phê Mây', email: 'chu@caphemay.vn' }}>
      <Topbar crumbs="Cà phê Mây / Tổng quan" />
      <PageBody>
        <PageHeader
          title="Tổng quan"
          description="Tháng 11/2026, tính đến hết 22/11 · cập nhật 10 phút trước"
          actions={
            <Button icon="plus" href="/doanh-nghiep/chien-dich/tao">
              Tạo chiến dịch
            </Button>
          }
        />
        <StatGroup>
          <StatCard label="Mã đã tặng" value="1.240" sub="cho người hay đến gần quán" />
          <StatCard label="Mã đã dùng" value="386" sub="31% số mã đã tặng" />
          <StatCard label="Đã chi" value="8.138.000đ" sub="giá trị giảm cộng phí dịch vụ" />
          <StatCard label="Chi phí mỗi chuyến đến" value="21.083đ" sub="mỗi khách đặt xe tới vùng quán" />
        </StatGroup>
        <Columns template="minmax(0,2fr) minmax(0,1fr)" align="stretch">
          <Panel title="Chuyến đến quanh quán mỗi ngày" id="tq-chuyen" description="Mỗi chuyến là một mã đã dùng, điểm đến trong vùng áp dụng">
            <BarChart
              bars={daily}
              height={150}
              summary="Số chuyến đến vùng quán mỗi ngày từ 1/11 đến 22/11, cao nhất ngày 14/11 với 35 chuyến"
              labelHeader="Ngày"
              valueHeader="Chuyến"
            />
          </Panel>
          <Panel label="Ví và gợi ý">
            <Metric label="Số dư ví" value="1.180.000đ" />
            <Callout text="Đủ khoảng 51 mã Grab ô tô. Ví hết thì chiến dịch tự dừng." tone="amber" />
            <div>
              <Button variant="secondary" icon="plus" href="/doanh-nghiep/vi">
                Nạp tiền
              </Button>
            </div>
            <Divider />
            <Metric label="Khách đến nhiều nhất" value={<span className="text-[14px] font-medium">15:00–17:00, từ thứ Sáu đến Chủ nhật</span>} size="md" />
          </Panel>
        </Columns>
        <Section title="Chiến dịch" id="tq-chien-dich" action={<MoreLink href="/doanh-nghiep/chien-dich" />}>
          <Table cols={cols} rows={rows} caption="Chiến dịch của Cà phê Mây" />
        </Section>
      </PageBody>
    </PortalShell>
  );
}

function AdminReview() {
  return (
    <PortalShell role="admin" active="duyet" badge={4} account={{ displayName: 'Vận hành Frego', email: 'vanhanh@frego.vn' }}>
      <Topbar crumbs="Frego / Duyệt" />
      <PageBody>
        <PageHeader
          title="Duyệt doanh nghiệp và chiến dịch"
          description="Kiểm tra trước khi mã hiện trên app. Mục tiêu: xử lý trong 1 ngày làm việc."
        />
        <Tabs
          label="Loại hồ sơ"
          toolbar
          active="camp"
          query={{ 'vai-tro': 'quan-tri' }}
          items={[
            { key: 'camp', label: 'Chiến dịch', count: 3 },
            { key: 'biz', label: 'Doanh nghiệp mới', count: 1 },
          ]}
        />
        <Columns template="340px minmax(0,1fr)" stackBelow="lg">
          <Panel padding="sm" gap={0} label="Hàng chờ duyệt">
            <QueueList label="Hàng chờ duyệt">
              <QueueItem
                selected
                href="?vai-tro=quan-tri&chon=i1"
                leading={<BizMark category="cafe" size={32} />}
                title="Khai trương món mới"
                subtitle="Cà phê Mây"
                meta={
                  <>
                    <ProviderMark provider="gsm" size={16} />
                    Green SM xe máy · −15.000đ
                  </>
                }
                time="2 giờ trước"
                status={<Status text="Chờ duyệt" tone="amber" />}
              />
              <QueueItem
                href="?vai-tro=quan-tri&chon=i2"
                leading={<BizMark category="tea" size={32} />}
                title="Trà chiều cuối tuần"
                subtitle="Tiệm trà Sen"
                meta={
                  <>
                    <ProviderMark provider="be" size={16} />
                    Be xe máy · −10.000đ
                  </>
                }
                time="4 giờ trước"
                status={<Status text="Chờ duyệt" tone="amber" />}
              />
              <QueueItem
                href="?vai-tro=quan-tri&chon=i3"
                leading={<BizMark category="gym" size={32} />}
                title="Tập sáng"
                subtitle="Phòng tập Nhịp"
                meta={
                  <>
                    <ProviderMark provider="grab" size={16} />
                    Grab xe máy · −15.000đ
                  </>
                }
                time="5 giờ trước"
                status={<Status text="Chờ duyệt" tone="amber" />}
              />
            </QueueList>
          </Panel>
          <Panel padding="xl" gap={16} label="Cà phê Mây · Khai trương món mới">
            <DetailHeader
              leading={<BizMark category="cafe" size={40} />}
              title="Cà phê Mây · Khai trương món mới"
              sub="Gửi 2 giờ trước"
              trailing={
                <>
                  <Button variant="danger">Từ chối</Button>
                  <Button icon="check">Duyệt</Button>
                </>
              }
              className="pb-3.5!"
            />
            <Columns template="minmax(0,1fr) minmax(0,1fr)" gap={32} stackBelow="sm">
              <div className="flex min-w-0 flex-col gap-3">
                <SubHeading>Người dùng sẽ thấy</SubHeading>
                <PreviewBox>
                  <div className="flex h-[104px] items-center justify-center rounded-[14px] bg-white text-[13px] text-ink-2">
                    Vé voucher (thành phần app)
                  </div>
                </PreviewBox>
                <KeyValueList>
                  <KeyValue label="Hãng và loại xe">Green SM xe máy</KeyValue>
                  <KeyValue label="Mức giảm">15.000đ mỗi chuyến</KeyValue>
                  <KeyValue label="Vùng áp dụng">800 m quanh quán</KeyValue>
                  <KeyValue label="Thời gian">01/12 – 31/12/2026</KeyValue>
                  <KeyValue label="Khung giờ">07:00 – 22:00 mỗi ngày</KeyValue>
                  <KeyValue label="Ngân sách">3.000.000đ</KeyValue>
                  <KeyValue label="Ví hiện có">1.180.000đ</KeyValue>
                </KeyValueList>
              </div>
              <div className="flex min-w-0 flex-col gap-3">
                <SubHeading>Kiểm tra tự động</SubHeading>
                <Check tone="green" title="Địa chỉ quán khớp vị trí trên bản đồ" />
                <Check tone="green" title="Ảnh vuông 1080 × 1080, không có số điện thoại hay mã QR" />
                <Check tone="amber" title="Ví chỉ đủ khoảng 65 mã" text="Chiến dịch vẫn chạy và tự dừng khi ví hết. Nên nhắc doanh nghiệp nạp thêm." />
                <Check
                  tone="amber"
                  title="Green SM chưa có ước tính giá ở Quận 1"
                  text="Mã vẫn dùng được, nhưng app chưa so giá Green SM chính xác ở khu này."
                />
                <div className="mt-1">
                  <Input label="Lý do gửi doanh nghiệp nếu từ chối" id="ly-do-i1" name="lyDo" placeholder="VD: Ảnh có số điện thoại" />
                </div>
              </div>
            </Columns>
          </Panel>
        </Columns>
      </PageBody>
    </PortalShell>
  );
}

export default async function ShellSample({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const role = (await searchParams)['vai-tro'];
  return role === 'quan-tri' ? <AdminReview /> : <BizOverview />;
}
