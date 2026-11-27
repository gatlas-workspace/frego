// Bảng thành phần web quản lý (theo WebBangThanhPhan.dc.html): mọi thành phần và biến thể, để chụp màn hình và tra cứu.
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Avatar,
  BarChart,
  BizMark,
  Button,
  Callout,
  Check,
  Columns,
  DetailHeader,
  Divider,
  FieldGrid,
  FileRow,
  FormSection,
  FregoMark,
  Hint,
  InfoTile,
  Input,
  KeyValue,
  KeyValueList,
  List,
  ListRow,
  Meter,
  Metric,
  MoreLink,
  PageHeader,
  Panel,
  ProviderMark,
  QueueItem,
  QueueList,
  SearchField,
  Section,
  Segmented,
  Sidebar,
  StatCard,
  StatGroup,
  Status,
  StepList,
  SubHeading,
  Table,
  Tabs,
  Textarea,
  Tile,
  Timeline,
  Toggle,
  ToggleRow,
  Topbar,
  WebIcon,
  webIcons,
  type Bar,
  type TableColumn,
  type TableRow,
} from '@/components/web';
import { ChoiceDemo, DrawerDemo, SegmentedDemo, TabsDemo, ToggleDemo } from './demos';

export const metadata: Metadata = { title: 'Thành phần web', robots: { index: false, follow: false } };

function Block({ title, description, children, align = 'center' }: { title: string; description: string; children: ReactNode; align?: 'center' | 'end' | 'stretch' }) {
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-0.5 pb-2 shadow-soft-b">
        <h2 className="m-0 text-[20px] font-semibold leading-[1.4]">{title}</h2>
        <p className="m-0 text-[14px] leading-normal text-ink-2">{description}</p>
      </div>
      <div
        className={
          'flex min-w-0 gap-3 rounded-frame p-5 shadow-frame max-[600px]:p-3 ' +
          (align === 'end' ? 'flex-wrap items-end' : align === 'stretch' ? 'flex-col items-stretch' : 'flex-wrap items-center')
        }
      >
        {children}
      </div>
    </section>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[12px] text-ink-2">{label}</span>
      {children}
    </div>
  );
}

const sampleCols: TableColumn[] = [
  { label: 'Chiến dịch' },
  { label: 'Ưu đãi' },
  { label: 'Mã dùng', align: 'right', w: '110px' },
  { label: 'Trạng thái', w: '140px' },
];
const sampleRows: TableRow[] = [
  [
    { text: 'Khách chiều quanh Chợ Bến Thành', sub: '01/11 – 30/11/2026', strong: true, href: '/doanh-nghiep/chien-dich/cd-1' },
    { text: 'Grab ô tô 4 chỗ · −20.000đ', logo: 'grab' },
    '312 / 980',
    { text: 'Đang chạy', status: 'green' },
  ],
  [
    { text: 'Xe máy cuối tuần', sub: 'Thứ Bảy, Chủ nhật', strong: true },
    { text: 'Be xe máy · −10.000đ', logo: 'be' },
    '74 / 260',
    { text: 'Tạm dừng', status: 'grey' },
  ],
];

const kindCols: TableColumn[] = [
  { label: 'Mã', w: 'minmax(0,1fr)' },
  { label: 'Người dùng', w: '170px' },
  { label: 'Ngày', w: '110px' },
  { label: 'Số tiền', align: 'right', w: '120px' },
  { label: 'Thay đổi', align: 'right', w: '100px' },
  { label: 'Kết quả', w: '150px' },
];
const kindRows: TableRow[] = [
  {
    key: 'a',
    cells: [
      { text: 'VPBTRANSPORT', sub: 'Nguồn: grab.com', code: true },
      { text: 'Minh Anh', avatar: true },
      { text: '22/11/2026', muted: true },
      { text: '1.180.000đ', strong: true },
      { text: '+9%', tone: 'good' },
      { text: 'Đúng khoảng', status: 'green' },
    ],
  },
  {
    key: 'b',
    highlight: true,
    cells: [
      { text: 'BENXE', sub: 'Tự ẩn · 14 lượt báo lỗi', code: true },
      { text: 'Thu Hà', avatar: true },
      { text: '21/11/2026', muted: true },
      { text: '962.000đ', strong: true },
      { text: '−4%', tone: 'bad' },
      <Status key="s" text="Đắt hơn" tone="red" shape="tag" />,
    ],
  },
  [
    { text: 'FREGO10', code: true },
    { text: 'Quốc Bảo', avatar: true },
    { text: '20/11/2026', muted: true },
    { text: '0đ', strong: true },
    { text: '0%' },
    <Button key="b" size="sm" variant="ghost" icon="external" href="/quan-tri/kho-ma">
      Mở
    </Button>,
  ],
];

const sampleBars: Bar[] = [3, 5, 8, 12, 9, 14, 18, 11, 7, 6].map((v, i) => ({ label: `${7 + i}h`, value: v, highlight: v === 18 }));
const dailyBars: Bar[] = [26, 12, 11, 13, 11, 15, 35, 33, 11, 12, 13, 14, 16, 35, 33, 11, 13, 12, 11, 13, 19, 17].map((v, i) => ({
  label: [1, 5, 10, 15, 20, 22].includes(i + 1) ? String(i + 1) : '',
  srLabel: `${i + 1}/11`,
  value: v,
  highlight: i === 13,
}));

export default function ComponentGallery() {
  return (
    <div className="min-h-screen bg-white text-ink">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-9 px-[72px] pb-[72px] pt-14 max-[900px]:px-4 max-[900px]:pt-8">
        <header className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[36px] font-bold leading-[1.2] tracking-[-0.6px]">Thành phần web</h1>
          <p className="m-0 max-w-[760px] text-[16px] leading-[1.6] text-ink-2">
            Bộ thành phần cho cổng doanh nghiệp và trang quản trị Frego, theo phong cách Notion: nền trắng, chữ Inter 14px,
            viền mảnh, màu trung tính và một màu xanh cho hành động chính.
          </p>
        </header>

        <Block title="Nút · WebButton" description="Cao 32px hoặc 28px, bo 4px. Nút xanh chỉ dùng cho hành động chính của trang, mỗi trang một nút." align="end">
          <div className="flex flex-wrap items-end gap-6">
            <Labeled label="Chính">
              <Button icon="plus">Tạo chiến dịch</Button>
            </Labeled>
            <Labeled label="Phụ">
              <Button variant="secondary">Hủy</Button>
            </Labeled>
            <Labeled label="Chìm">
              <Button variant="ghost">Xem tất cả</Button>
            </Labeled>
            <Labeled label="Nguy hiểm">
              <Button variant="danger">Từ chối</Button>
            </Labeled>
            <Labeled label="Nhỏ, có icon">
              <Button size="sm" icon="check">
                Duyệt
              </Button>
            </Labeled>
            <Labeled label="Nhỏ, phụ">
              <Button variant="secondary" size="sm" icon="download">
                Tải CSV
              </Button>
            </Labeled>
            <Labeled label="Có menu">
              <Button caret>Mới</Button>
            </Labeled>
            <Labeled label="Liên kết (href)">
              <Button variant="secondary" href="/dang-nhap" iconRight="chev">
                Đăng nhập
              </Button>
            </Labeled>
            <Labeled label="Đang tắt">
              <Button disabled>Gửi Frego duyệt</Button>
            </Labeled>
          </div>
        </Block>

        <Block title="Ô nhập · WebInput" description="Nền xám nhạt, viền mảnh. Khi đang nhập có vòng xanh, khi lỗi viền đỏ kèm dòng giải thích." align="stretch">
          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Tên chiến dịch" id="bt-1" placeholder="VD: Khách chiều quanh quán" />
            <Input label="Ngân sách tối đa" id="bt-2" defaultValue="5.000.000" suffix="đ" inputMode="numeric" />
            <Input label="Đang nhập" id="bt-3" defaultValue="GRABXMAS" state="focus" />
            <Input label="Có lỗi" id="bt-4" defaultValue="BENXE" error="Mã này đã có trong kho" />
          </div>
          <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Địa chỉ"
              id="bt-5"
              defaultValue="Đường Lê Thánh Tôn, gần Chợ Bến Thành, Quận 1, TP.HCM"
              help="Ghim trên bản đồ đã khớp địa chỉ. Vùng áp dụng của chiến dịch tính từ ghim này."
            />
            <Textarea label="Nội dung (nhiều dòng)" id="bt-6" defaultValue="Mã GRABCUOITUAN cho GrabCar từ 100.000đ, đến hết Chủ nhật." rows={2} />
          </div>
        </Block>

        <Block title="Tab chế độ xem · WebTabs" description="Dùng để lọc bảng như các view của Notion. Thanh công cụ bên phải: lọc, sắp xếp, tìm." align="stretch">
          <TabsDemo />
          <Labeled label="Dạng liên kết ?tab= (Server Component), không thanh công cụ">
            <Tabs
              label="Khu vực"
              active="hcm"
              param="khu-vuc"
              items={[
                { key: 'hcm', label: 'TP.HCM' },
                { key: 'hn', label: 'Hà Nội' },
              ]}
            />
          </Labeled>
        </Block>

        <Block title="Phân đoạn và công tắc · WebSegmented, WebToggle" description="Phân đoạn cho lựa chọn ngắn như bán kính, mức giảm. Công tắc cho bật tắt một tính năng." align="end">
          <div className="flex flex-wrap items-end gap-8">
            <Labeled label="Phân đoạn">
              <SegmentedDemo />
            </Labeled>
            <Labeled label="Phân đoạn trong form (không điều khiển)">
              <div className="w-[min(380px,calc(100vw-64px))]">
                <Segmented
                  name="so-tien"
                  label="Số tiền nạp"
                  defaultValue="2000000"
                  items={[
                    { value: '1000000', label: '1.000.000đ' },
                    { value: '2000000', label: '2.000.000đ' },
                    { value: '5000000', label: '5.000.000đ' },
                  ]}
                />
              </div>
            </Labeled>
            <Labeled label="Công tắc bật">
              <Toggle label="Công tắc bật" defaultChecked />
            </Labeled>
            <Labeled label="Công tắc tắt">
              <Toggle label="Công tắc tắt" />
            </Labeled>
            <Labeled label="Có điều khiển">
              <ToggleDemo />
            </Labeled>
          </div>
          <div className="w-full max-w-[420px]">
            <ToggleRow title="Tự nạp 2.000.000đ" description="khi số dư dưới 500.000đ, từ thẻ đã lưu" name="tu-nap" defaultChecked />
          </div>
        </Block>

        <Block title="Nhãn · WebStatus" description="Màu nhãn theo bảng màu của Notion. Trạng thái dùng dạng tròn có chấm, thuộc tính chọn dùng dạng bo 3px." align="stretch">
          <Labeled label="Trạng thái (bo tròn, có chấm)">
            <div className="flex flex-wrap gap-2">
              <Status text="Đang chạy" tone="green" />
              <Status text="Chờ duyệt" tone="amber" />
              <Status text="Tạm dừng" tone="grey" />
              <Status text="Từ chối" tone="red" />
              <Status text="Thêm dữ liệu" tone="blue" />
              <Status text="Mã tài trợ" tone="orange" />
            </div>
          </Labeled>
          <Labeled label="Nhãn chọn (bo 3px)">
            <div className="flex flex-wrap gap-2">
              <Status text="Đang chạy" tone="green" shape="tag" />
              <Status text="Chờ duyệt" tone="amber" shape="tag" />
              <Status text="Tạm dừng" tone="grey" shape="tag" />
              <Status text="Từ chối" tone="red" shape="tag" />
              <Status text="Thêm dữ liệu" tone="blue" shape="tag" />
              <Status text="Mã tài trợ" tone="orange" shape="tag" />
            </div>
          </Labeled>
        </Block>

        <Block title="Khối ghi chú · WebCallout" description="Thông tin cần chú ý trong trang. Xám cho giải thích, vàng cho cảnh báo, xanh lá khi xong, đỏ khi có lỗi." align="stretch">
          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
            <Callout text="Mã tặng mà không ai dùng thì không mất tiền." tone="grey" />
            <Callout text="Đủ khoảng 51 mã Grab ô tô. Ví hết thì chiến dịch tự dừng." tone="amber" />
            <Callout text="Đã gửi. Frego sẽ duyệt trong 1 ngày làm việc." tone="green" icon="check" role="status" />
            <Callout text="Ngân sách 5.000.000đ đủ cho khoảng 217 mã được dùng." tone="blue" />
            <Callout text="Ảnh có số điện thoại và mã QR, cần ảnh khác." tone="red" icon="x" />
            <Callout tone="green" icon="check">
              Đã gửi. Frego sẽ duyệt trong 1 ngày làm việc và báo cho bạn qua email. <Link href="/doanh-nghiep/chien-dich">Về danh sách chiến dịch</Link>
            </Callout>
            <Callout tone="subtle" icon="ticket" iconColor="good" href="/doanh-nghiep/chien-dich" action="Xem chi tiết">
              <b className="font-medium">Đang chạy:</b> Khách chiều quanh Chợ Bến Thành, ngân sách còn 2.824.000đ
            </Callout>
            <Callout tone="red" icon="x" href="/doanh-nghiep/chien-dich/tao" action="Sửa và gửi lại">
              <b className="font-medium">Bị từ chối:</b> Ưu đãi Giáng sinh. Lý do: ảnh có số điện thoại và mã QR.
            </Callout>
          </div>
        </Block>

        <Block title="Dòng kiểm tra · WebCheck" description="Kết quả kiểm tra tự động khi duyệt chiến dịch hoặc doanh nghiệp." align="stretch">
          <div className="grid w-full grid-cols-1 gap-x-8 gap-y-3.5 md:grid-cols-2">
            <Check tone="green" title="Địa chỉ quán khớp vị trí trên bản đồ" />
            <Check tone="amber" title="Ví chỉ đủ khoảng 65 mã" text="Chiến dịch tự dừng khi ví hết." />
            <Check tone="red" title="Ảnh có số điện thoại và mã QR" text="Nên từ chối và xin ảnh khác." />
            <Check tone="blue" title="Bằng mức giảm của FREGO10" text="Gợi ý tăng lên 15.000đ." />
          </div>
        </Block>

        <Block title="Ô số liệu · WebStatCard" description="Ghép thành dải số liệu đầu trang. Thay đổi so với kỳ trước tô xanh khi tốt, đỏ khi xấu." align="stretch">
          <div className="@container w-full">
            <StatGroup>
              <StatCard label="Mã đã tặng" value="1.240" sub="cho người hay đến gần quán" />
              <StatCard label="Người dùng hoạt động" value="12.480" sub="so với tháng 10" delta="+9%" tone="good" />
              <StatCard label="Chi phí mỗi chuyến" value="21.083đ" sub="so với tuần trước" delta="+4%" tone="bad" />
            </StatGroup>
          </div>
        </Block>

        <Block
          title="Bảng dữ liệu · WebTable"
          description='Kiểu bảng database của Notion: đường kẻ cột, icon loại thuộc tính ở tiêu đề, dòng "Mới" ở cuối khi được thêm.'
          align="stretch"
        >
          <Table caption="Bảng mẫu" cols={sampleCols} rows={sampleRows} addLabel="Mới" addHref="/doanh-nghiep/chien-dich/tao" />
          <Labeled label="Loại ô: mã, người, ngày, tiền, tốt/xấu, nhãn, nút; dòng tô xám (highlight); đặt sát dưới tab (flush)">
            <div className="flex flex-col">
              <Tabs
                label="Lọc mẫu"
                toolbar
                active="all"
                items={[
                  { key: 'all', label: 'Tất cả', count: 3 },
                  { key: 'hide', label: 'Tự ẩn', count: 1 },
                ]}
              />
              <Table caption="Bảng loại ô" cols={kindCols} rows={kindRows} flush />
              <Hint>Hiển thị 3 trong 24 mã.</Hint>
            </div>
          </Labeled>
          <Labeled label="Bảng trống">
            <Table caption="Bảng trống" cols={sampleCols} rows={[]} emptyText="Không có chiến dịch nào ở trạng thái này." flush />
          </Labeled>
        </Block>

        <Block title="Biểu đồ cột · WebBarChart" description="Cột xanh đậm là giá trị nổi bật, các cột còn lại xanh nhạt." align="stretch">
          <div className="w-full max-w-[640px]">
            <BarChart summary="Biểu đồ mẫu theo giờ, cao nhất lúc 13 giờ với 18 chuyến" bars={sampleBars} />
          </div>
          <div className="w-full">
            <BarChart
              summary="Số chuyến đến vùng quán mỗi ngày từ 1/11 đến 22/11, cao nhất ngày 14/11 với 35 chuyến"
              bars={dailyBars}
              height={130}
              labelHeader="Ngày"
              valueHeader="Chuyến"
            />
          </div>
        </Block>

        <Block title="Thanh trên cùng · WebTopbar" description="Đường dẫn trang, thời điểm cập nhật và các thao tác chung." align="stretch">
          <div className="w-full overflow-hidden rounded-frame shadow-frame">
            <Topbar crumbs="Cà phê Mây / Chiến dịch / Tạo chiến dịch" note="Cập nhật 10 phút trước" />
          </div>
          <div className="w-full overflow-hidden rounded-frame shadow-frame">
            <Topbar crumbs="Frego / Duyệt" />
          </div>
        </Block>

        <Block title="Thanh bên · WebSidebar" description="Nền xám như Notion. Mục đang mở tô xám đậm hơn, số chờ xử lý hiện bằng chấm đỏ.">
          <div className="flex flex-wrap gap-8">
            <Labeled label="Doanh nghiệp">
              <div className="h-[360px] overflow-hidden rounded-frame shadow-[0_0_0_1px_var(--color-line)]">
                <Sidebar role="biz" active="chiendich" preview account={{ displayName: 'Chủ Cà phê Mây', email: 'chu@caphemay.vn' }} />
              </div>
            </Labeled>
            <Labeled label="Quản trị">
              <div className="h-[360px] overflow-hidden rounded-frame shadow-[0_0_0_1px_var(--color-line)]">
                <Sidebar role="admin" active="duyet" badge={4} preview />
              </div>
            </Labeled>
          </div>
        </Block>

        <Block title="Đầu trang, khung, mục" description="PageHeader, Panel, Section, SectionHeader, MoreLink, Columns — bố cục lặp lại ở các trang DN và QT." align="stretch">
          <PageHeader
            title="Tổng quan"
            description="Tháng 11/2026, tính đến hết 22/11 · cập nhật 10 phút trước"
            actions={
              <Button href="/doanh-nghiep/chien-dich/tao" icon="plus">
                Tạo chiến dịch
              </Button>
            }
          />
          <PageHeader
            title="Khách chiều quanh Chợ Bến Thành"
            titleAddon={<Status text="Đang chạy" tone="green" />}
            description="01/11 – 30/11/2026 · 13:00–19:00 · Grab ô tô 4 chỗ · 500 m quanh quán"
            actions={<Button variant="secondary">Tạm dừng</Button>}
          />
          <div className="@container w-full">
            <Columns template="minmax(0,2fr) minmax(0,1fr)">
              <Panel title="Chuyến đến quanh quán mỗi ngày" id="g-chuyen" description="Mỗi chuyến là một mã đã dùng, điểm đến trong vùng áp dụng">
                <BarChart summary="Số chuyến mỗi ngày, cao nhất ngày 14/11 với 35 chuyến" bars={dailyBars} />
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
          </div>
          <Section title="Chiến dịch" id="g-cd" action={<MoreLink href="/doanh-nghiep/chien-dich" />}>
            <Table caption="Chiến dịch của Cà phê Mây" cols={sampleCols} rows={sampleRows} />
          </Section>
        </Block>

        <Block title="Khung chi tiết, nhãn – giá trị, lịch sử" description="Khung bên phải (aside) với DetailHeader, KeyValue, Timeline, SubHeading, List." align="stretch">
          <div className="@container w-full">
            <Columns template="minmax(0,1fr) 380px" gap={24}>
              <div className="flex min-w-0 flex-col gap-5">
                <Panel title="Lịch sử" id="g-ls" gap={6}>
                  <Timeline
                    items={[
                      { time: '22/11', text: 'Ví còn dưới 1.500.000đ, Frego đã gửi email nhắc nạp' },
                      { time: '14/11', text: 'Ngày nhiều mã được dùng nhất: 21 mã' },
                      { time: '06/11', text: 'Tăng ngân sách từ 8.000.000đ lên 10.000.000đ' },
                    ]}
                  />
                </Panel>
                <Panel title="Nhật ký truy cập hôm nay" id="g-nk" gap={10}>
                  <Timeline
                    timeWidth={44}
                    items={[
                      { time: '10:02', text: <><b className="font-medium">Vận hành Frego</b> · Xem chi tiết người dùng Minh Anh</> },
                      { time: '09:40', text: <><b className="font-medium">Kế toán Frego</b> · Khớp nạp tiền Cà phê Mây</> },
                    ]}
                  />
                </Panel>
                <Panel title="Cài đặt" id="g-cd2" gap={10}>
                  <KeyValueList>
                    <KeyValue label="Hãng và loại xe">Grab ô tô 4 chỗ</KeyValue>
                    <KeyValue label="Mức giảm">20.000đ mỗi chuyến</KeyValue>
                    <KeyValue label="Vùng áp dụng">500 m quanh quán</KeyValue>
                  </KeyValueList>
                </Panel>
              </div>
              <Panel as="aside" padding="lg" label="Chi tiết Cà phê Mây" sticky>
                <DetailHeader title="Cà phê Mây" sub="Tham gia 09/2026 · hộ kinh doanh" trailing={<Status text="Hoạt động" tone="green" />} />
                <KeyValueList>
                  <KeyValue label="Địa chỉ">Lê Thánh Tôn, Quận 1</KeyValue>
                  <KeyValue label="Số dư ví">1.180.000đ</KeyValue>
                </KeyValueList>
                <SubHeading className="mt-1">Chiến dịch</SubHeading>
                <List>
                  <ListRow padding={8} strong={false} leading={<ProviderMark provider="grab" size={20} />} title="Khách chiều quanh Chợ Bến Thành" trailing={<Status text="Đang chạy" tone="green" />} />
                  <ListRow padding={8} strong={false} leading={<ProviderMark provider="be" size={20} />} title="Xe máy cuối tuần" trailing={<Status text="Tạm dừng" tone="grey" />} />
                </List>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    Nhắc nạp ví
                  </Button>
                  <Button variant="danger" size="sm">
                    Tạm khóa
                  </Button>
                </div>
              </Panel>
            </Columns>
          </div>
          <Panel title="Ước tính chi phí" id="g-cp" gap={10} className="max-w-[340px]">
            <KeyValueList>
              <KeyValue layout="between" label="Giá trị giảm mỗi mã" strong numeric>
                20.000đ
              </KeyValue>
              <KeyValue layout="between" label="Phí dịch vụ Frego" strong numeric>
                3.000đ
              </KeyValue>
              <KeyValue layout="between" label="Mỗi mã được dùng" total numeric>
                23.000đ
              </KeyValue>
            </KeyValueList>
          </Panel>
        </Block>

        <Block title="Danh sách, hàng chờ, thanh đo, ô giới thiệu" description="ListRow (Cần xử lý, hóa đơn, thành viên), QueueItem (Duyệt), Meter, InfoTile, Tile, FileRow." align="stretch">
          <div className="@container w-full">
            <Columns template="340px minmax(0,1fr)">
              <Panel padding="sm" gap={0} label="Hàng chờ duyệt">
                <QueueList label="Hàng chờ duyệt">
                  <QueueItem
                    selected
                    href="?chon=i1"
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
                    href="?chon=i2"
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
                </QueueList>
              </Panel>
              <div className="flex min-w-0 flex-col gap-5">
                <Panel title="Cần xử lý" id="g-xl" gap={6}>
                  <List divider="top">
                    <ListRow icon="shield" iconTone="warn" title="4 mục chờ duyệt" sub="3 chiến dịch, 1 doanh nghiệp mới" href="/quan-tri/duyet" />
                    <ListRow icon="wallet" iconTone="warn" title="Cà phê Mây sắp hết tiền ví" sub="Còn 1.180.000đ, khoảng 3 ngày, đã nhắc nạp" />
                  </List>
                </Panel>
                <Panel title="Độ khớp giá ước tính" id="g-dk" action={<MoreLink href="/quan-tri/nguoi-dung">Chi tiết</MoreLink>}>
                  <Meter logo="grab" label="Grab ô tô 4 chỗ" value="84%" percent={84} tone="green" />
                  <Meter logo="be" label="Be xe máy" value="74 · 19%" percent={19} tone="amber" />
                  <Meter label="Mã tài trợ" value="4.120" percent={45} tone="orange" />
                  <Meter logo="gsm" label="Green SM xe máy" value="Chưa bật" percent={0} tone="grey" />
                </Panel>
              </div>
            </Columns>
          </div>
          <Section title="Hóa đơn điện tử" id="g-hd" description="Xuất theo tháng cho số tiền đã trừ ví">
            <List framed>
              <ListRow padding={10} icon="receipt" title="Hóa đơn tháng 11/2026" sub="Tạm tính 8.138.000đ" trailing={<Status text="Xuất ngày 01/12" tone="amber" />} />
              <ListRow
                padding={10}
                icon="receipt"
                title="Hóa đơn tháng 10/2026"
                sub="1.677.000đ"
                trailing={
                  <>
                    <Status text="Đã xuất" tone="green" />
                    <Button variant="ghost" size="sm" icon="download">
                      Tải PDF
                    </Button>
                  </>
                }
              />
            </List>
          </Section>
          <Panel title="Thành viên" id="g-tv" gap={8} action={<Button variant="secondary" size="sm" icon="plus">Mời</Button>} className="max-w-[520px]">
            <List>
              <ListRow padding={8} strong={false} leading={<Avatar initials="CM" />} title="chu@caphemay.vn" sub="Tạo chiến dịch, nạp ví, xem báo cáo" trailing={<Status text="Chủ cửa hàng" tone="grey" shape="tag" />} />
              <ListRow padding={8} strong={false} leading={<Avatar initials="KT" />} title="ketoan@caphemay.vn" sub="Ví, hóa đơn" trailing={<Status text="Kế toán" tone="grey" shape="tag" />} />
            </List>
          </Panel>
          <div className="@container w-full">
            <Columns template="repeat(3,minmax(0,1fr))" gap={12}>
              <InfoTile icon="clock" title="Tự kiểm tra">
                Mỗi 2 giờ Frego đọc lại trang khuyến mãi của hãng. Mã biến mất khỏi nguồn sẽ chuyển sang Chờ kiểm tra.
              </InfoTile>
              <InfoTile icon="x" title="Tự ẩn khi bị báo lỗi">
                Từ 10 lượt báo &quot;không dùng được&quot; trong 24 giờ, mã ẩn khỏi app cho tới khi có người kiểm tra lại.
              </InfoTile>
              <InfoTile icon="link" title="Luôn ghi nguồn">
                Mỗi mã trên app đều kèm nguồn và thời điểm kiểm tra, như người dùng thấy ở Ví voucher.
              </InfoTile>
            </Columns>
          </div>
          <div className="flex flex-wrap gap-5">
            <Tile padding="sm" className="w-[320px]">
              <span className="text-[13px] text-ink-2">Thử với chuyến Landmark 81 → Chợ Bến Thành, 5,8 km, 20 phút</span>
              <span className="text-[20px] font-semibold tabular-nums">31.000 – 36.000đ</span>
              <span className="text-[13px] text-ink-2">khớp giá app đang hiện cho Be xe máy trước khi trừ mã</span>
            </Tile>
            <div className="flex w-[420px] max-w-full flex-col gap-3">
              <FileRow icon="receipt" name="Giấy phép kinh doanh.pdf" meta="Đã tải lên · 1,2 MB" trailing={<Status text="Đã tải" tone="green" />} />
              <FileRow icon="camera" name="Ảnh mặt tiền cửa hàng" meta="Thấy rõ biển hiệu, dùng để xác nhận vị trí" trailing={<Button variant="secondary" size="sm">Tải ảnh</Button>} />
            </div>
          </div>
        </Block>

        <Block title="Form nhiều bước, tìm kiếm, chọn hãng, khung trượt" description="FormSection, FieldGrid, SearchField, ChoiceGroup, Drawer." align="stretch">
          <div className="@container w-full">
            <FormSection step={2} title="Hãng và loại xe" description="Mỗi chiến dịch dùng cho một hãng, một loại xe." id="g-fs-hang">
              <ChoiceDemo />
              <Segmented
                name="loai-xe"
                label="Loại xe"
                defaultValue="car"
                items={[
                  { value: 'bike', label: 'Xe máy' },
                  { value: 'car', label: 'Ô tô 4 chỗ' },
                  { value: 'suv', label: 'Ô tô 7 chỗ' },
                ]}
              />
            </FormSection>
            <FormSection step={3} title="Mức giảm, ngân sách, thời gian" description="Mức giảm cao hơn mã công khai thì mã được gắn nhiều hơn." id="g-fs-tien">
              <FieldGrid cols={4}>
                <Input label="Ngân sách tối đa" id="tc-ngan-sach" defaultValue="5.000.000" inputMode="numeric" suffix="đ" />
                <Input label="Tối đa mỗi ngày" id="tc-moi-ngay" defaultValue="30" inputMode="numeric" suffix="mã" />
                <Input label="Bắt đầu" id="tc-bat-dau" defaultValue="01/12/2026" />
                <Input label="Kết thúc" id="tc-ket-thuc" defaultValue="31/12/2026" />
              </FieldGrid>
              <ToggleRow title="Chỉ tặng mã trong giờ mở cửa" description="07:00 – 22:00, mỗi ngày" name="gio-mo-cua" defaultChecked />
            </FormSection>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SearchField label="Tìm người dùng" placeholder="Tìm theo tên, 4 số cuối điện thoại" action="/dev/thanh-phan" />
            <span className="text-[13px] text-ink-2">Số liệu 30 ngày qua</span>
          </div>
          <div>
            <DrawerDemo />
          </div>
        </Block>

        <Block title="Biểu tượng" description="FregoMark, BizMark theo ngành, ProviderMark (ô chữ viết tắt, chưa có file logo hãng), Avatar, StepList; icon riêng của web (icons-web.ts).">
          <div className="flex flex-wrap items-center gap-3">
            <FregoMark size={20} />
            <FregoMark size={24} />
            <FregoMark size={40} />
            <BizMark category="cafe" size={20} />
            <BizMark category="tea" size={32} />
            <BizMark category="gym" size={40} />
            <BizMark category="book" size={44} />
            <BizMark category="cake" size={48} />
            <BizMark category="bowl" size={32} />
            <ProviderMark provider="grab" size={24} />
            <ProviderMark provider="be" size={24} />
            <ProviderMark provider="gsm" size={24} />
            <Avatar name="Minh Anh" size={40} />
            <Avatar initials="CM" />
          </div>
          <div className="grid w-full grid-cols-4 gap-2 sm:grid-cols-8">
            {Object.keys(webIcons).map((n) => (
              <div key={n} className="flex flex-col items-center gap-1.5 rounded-ctl bg-sidebar px-1 py-3">
                <WebIcon name={n as keyof typeof webIcons} size={20} className="text-ink-2" />
                <span className="text-[12px] text-ink-2">{n}</span>
              </div>
            ))}
          </div>
          <div className="w-[280px] rounded-frame bg-sidebar p-3">
            <StepList steps={['Doanh nghiệp', 'Cửa hàng', 'Giấy tờ', 'Liên hệ']} current={2} />
          </div>
        </Block>
      </div>
    </div>
  );
}
