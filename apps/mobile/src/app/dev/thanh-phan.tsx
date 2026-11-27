/**
 * Bảng thành phần (dev): mọi thành phần UI ở mọi biến thể/trạng thái, theo trang "Bảng biến thể thành phần"
 * (UiBangThanhPhan) + các thành phần còn lại của trang "Thành phần UI". Dùng để chụp màn đối chiếu thiết kế.
 */
import { useState, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AttachItemView, DealView, NotificationView, PriceRow, PublicCodeCardView, WalletGiftView } from '@frego/core';
import {
  BackButton,
  Banner,
  BottomBar,
  BrandLogo,
  Button,
  Card,
  Chip,
  CodeCard,
  DealRow,
  Field,
  InfoNote,
  ListCard,
  ListRow,
  MapRoute,
  ModalSheet,
  MonoLogo,
  NavBar,
  NotifItem,
  Pill,
  PriceRowCard,
  PushNotif,
  ScreenHeader,
  SearchField,
  SectionTitle,
  Sheet,
  Shortcut,
  T,
  Tabs,
  Toggle,
  VehicleTile,
  VoucherTicket,
  Wordmark,
  type NavKey,
} from '@/components/ui';
import { usePush } from '@/lib/push';
import { colors } from '@/theme/tokens';

function Section({ title, children, bare }: { title: string; children: ReactNode; bare?: boolean }) {
  return (
    <View style={{ gap: 12 }}>
      <T
        weight={800}
        size={13}
        lineHeight={17}
        color={colors.muted}
        style={{ letterSpacing: 0.6, textTransform: 'uppercase' }}
        accessibilityRole="header"
      >
        {title}
      </T>
      {bare ? (
        children
      ) : (
        <Card padding={20} gap={12}>
          {children}
        </Card>
      )}
    </View>
  );
}

function Row({ children, gap = 10 }: { children: ReactNode; gap?: number }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap }}>{children}</View>;
}

function Caption({ children }: { children: string }) {
  return (
    <T weight={600} size={12} lineHeight={16} color={colors.muted}>
      {children}
    </T>
  );
}

const ROWS: PriceRow[] = [
  {
    service: 'be-bike',
    providerId: 'be',
    vehicleClass: 'bike',
    mono: 'Be',
    name: 'Be',
    serviceName: 'Xe máy',
    priced: true,
    final: null,
    base: null,
    finalText: '21.000–26.000đ',
    baseText: '31.000–36.000đ',
    voucherText: 'Đã gắn FREGO20, giảm 10.000đ',
    attached: null,
    autoNote: null,
  },
  {
    service: 'grab-car4',
    providerId: 'grab',
    vehicleClass: 'car4',
    mono: 'Gr',
    name: 'Grab',
    serviceName: 'Ô tô 4 chỗ',
    priced: true,
    final: null,
    base: null,
    finalText: '75.000–86.000đ',
    baseText: '',
    voucherText: '',
    attached: null,
    autoNote: null,
  },
  {
    service: 'gsm-car7',
    providerId: 'gsm',
    vehicleClass: 'car7',
    mono: 'GS',
    name: 'Green SM',
    serviceName: 'Ô tô 6–7 chỗ',
    priced: false,
    final: null,
    base: null,
    finalText: '',
    baseText: '',
    voucherText: '',
    attached: null,
    autoNote: 'Green SM đang tự giảm 25%, không cần mã',
  },
];

/* Dữ liệu mẫu đúng kiểu view model của core: truyền thẳng bằng spread. */
const DEAL: DealView = {
  campaignId: 'c1',
  businessId: 'b1',
  category: 'tea',
  area: 'Gần chợ Tân Định',
  brand: 'Tiệm trà Sen',
  endsInText: 'Còn 5 ngày',
  serviceText: 'Mã Be xe máy',
  amountText: '−10.000đ',
  cta: 'Đặt xe ›',
  destPlaceId: 'p1',
};
const GIFT: WalletGiftView = {
  id: 'g1',
  source: 'sponsor',
  logo: 'gym',
  tag: 'sponsor',
  title: 'Phòng tập Nhịp',
  amountText: '−15.000đ',
  serviceText: 'Green SM ô tô',
  line: 'Tặng vì bạn hay đến khu Landmark 81',
  metaText: 'HSD 15/12/2026',
  action: 'Xem mã ›',
  link: '/voucher/g1',
};
const ATTACH: AttachItemView = {
  refId: 'uv:1',
  service: 'grab-car4',
  logo: 'cafe',
  tag: 'sponsor',
  name: 'Cà phê Mây',
  amountText: '−20.000đ',
  serviceText: 'Grab ô tô',
  conditionLine: 'Grab ô tô · đến khu Chợ Bến Thành',
  metaText: 'HSD 30/11/2026',
  attached: true,
};
const CODE: PublicCodeCardView = {
  id: 'pc1',
  logo: 'grab',
  brandLine: 'Grab · mã công khai',
  code: 'GRABNEW',
  title: 'Giảm 20.000đ cho chuyến GrabCar đầu tiên',
  okText: '',
  warnText: '',
  plainText: 'Người dùng mới',
  plainText2: '',
  metaText: 'Nguồn: grab.com · kiểm tra hôm nay',
  otherCard: false,
};
const NOTIF: NotificationView = {
  id: 'n1',
  userId: 'u1',
  category: 'trip',
  kind: 'points',
  icon: 'sparkplus',
  tone: 'tint',
  logo: 'gsm',
  title: 'Bạn được cộng 10 điểm',
  body: 'Cảm ơn bạn đã báo giá chuyến Green SM ô tô.',
  cta: 'Đổi voucher ›',
  link: '/diem-thuong',
  createdAt: '2026-11-26T01:00:00Z',
  readAt: null,
  unread: true,
  metaText: '08:00 · Chuyến đi',
  group: 'today',
};

export default function ThanhPhan() {
  const insets = useSafeAreaInsets();
  const push = usePush();
  const [notifTab, setNotifTab] = useState('all');
  const [vehicle, setVehicle] = useState<'bike' | 'car4' | 'car7'>('bike');
  const [histTab, setHistTab] = useState('all');
  const [toggleA, setToggleA] = useState(true);
  const [toggleB, setToggleB] = useState(false);
  const [pills, setPills] = useState<Record<string, boolean>>({ cafe: true });
  const [rowToggle, setRowToggle] = useState(true);
  const [picked, setPicked] = useState(0);
  const [attached, setAttached] = useState(true);
  const [phone, setPhone] = useState('');
  const [nav, setNav] = useState<NavKey>('home');
  const [query, setQuery] = useState('Chợ Bến');
  const [attach2, setAttach2] = useState(ATTACH.attached);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: 48, paddingHorizontal: 20, gap: 28 }}
    >
      <View style={{ gap: 6 }}>
        <T variant="display" accessibilityRole="header">
          Bảng biến thể thành phần
        </T>
        <T size={15} lineHeight={22} color={colors.ink2}>
          Mỗi khối dưới đây là bản dùng thật của thành phần, sửa thành phần gốc thì mọi màn cập nhật theo.
        </T>
      </View>

      <Section title="Nút · UiButton">
        <Button label="Tiếp tục" />
        <Button label="Báo giá thật" badge="+10 điểm" />
        <Button label="Mở app Be" icon="external" />
        <Button label="So giá trước khi đặt" variant="secondary" />
        <Button label="Thêm thẻ ngân hàng khác" variant="dashed" icon="plus" />
        <Row>
          <Button label="Chép mã" variant="outline" size="sm" icon="copy" block={false} />
          <Button label="Đổi" size="sm" block={false} />
          <Button label="Đổi ảnh" variant="ghost" size="md" block={false} />
          <Button label="Bỏ qua, điền sau" variant="text" size="md" block={false} />
        </Row>
        <Button label="Đăng xuất" variant="white" />
        <Button label="Báo giá thật" badge="+10 điểm" size="md" />
        <Button label="Lưu địa điểm" disabled />
        <Row>
          <Button label="Chọn trên bản đồ" variant="text" size="sm" icon="map" block={false} />
          <Button label="Đánh dấu đã đọc hết" variant="text" size="xs" icon="check" block={false} />
        </Row>
      </Section>

      <Section title="Ô nhập · UiField">
        <Field
          label="Số điện thoại"
          prefix="+84"
          placeholder="909 123 456"
          inputMode="numeric"
          autoComplete="tel-national"
          value={phone}
          onChangeText={setPhone}
        />
        <Field
          label="Ngày sinh"
          placeholder="dd/mm/yyyy"
          state="focus"
          inputMode="numeric"
          help="Frego gửi quà vào tuần sinh nhật của bạn."
        />
        <Field
          label="Nhập số tiền bạn đã trả"
          placeholder="VD: 24.000"
          suffix="đ"
          inputMode="numeric"
          action="Gửi"
          actionBadge="+50 điểm"
          onAction={() => {}}
          help="Số tiền sau khi trừ mã, xem trong lịch sử chuyến của app Be."
          helpPosition="top"
        />
        <Field label="Tên gọi" defaultValue="Minh Anh" autoComplete="given-name" />
        <Field
          accessibilityLabel="Có mã khác? Nhập để tính vào giá"
          placeholder="Mã Grab, Be, Green SM"
          autoCapitalize="characters"
          action="Thêm"
          onAction={() => {}}
        />
      </Section>

      <Section title="Ô tìm kiếm · SearchField">
        <SearchField
          accessibilityLabel="Điểm đến"
          placeholder="Bạn muốn đi đâu?"
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery('')}
          clearLabel="Xóa điểm đến"
        />
        <SearchField accessibilityLabel="Tìm địa chỉ" placeholder="Tìm địa chỉ, tên đường, toà nhà" tone="surface" />
      </Section>

      <Section title="Ghi chú · UiInfoNote">
        <InfoNote icon="pinok" title="Điểm đến vẫn là Chợ Bến Thành" text="Voucher chỉ giảm giá, không đổi địa chỉ đến." />
        <InfoNote tone="neutral" icon="clock" text="Hạn dùng: chưa rõ ngày kết thúc. Frego kiểm tra lại mỗi ngày và tự ẩn khi mã hết." />
        <InfoNote tone="deal" icon="ticket" title="Đã gắn 3 voucher" text="FREGO20 · Cà phê Mây · Quán bún Ngõ Nhỏ" />
        <InfoNote tone="white" icon="spark" text="Be rẻ nhất cho chuyến này sau khi trừ voucher." />
        <InfoNote icon="check" text="Đã thêm. Frego kiểm tra điều kiện của mã rồi mới tính vào giá." live />
      </Section>

      <Section title="Nhãn · UiChip">
        <Row>
          <Chip text="3 voucher" />
          <Chip text="Đã liên kết" tone="tint" icon="check" />
          <Chip text="1 lần mỗi tháng" tone="neutral" />
          <Chip text="Tài trợ" tone="outline" size="sm" square />
          <Chip text="Chưa đọc" tone="solid" />
          <Chip text="−20.000đ" tone="deal" />
          <Chip text="Chưa báo giá" tone="deal" size="sm" />
          <Chip text="Mã công khai" tone="neutral" size="sm" />
          <Chip text="Gợi ý" tone="dark" icon="spark" />
        </Row>
      </Section>

      <Section title="Nút chọn dạng viên · UiPill">
        <Row>
          <Pill label="Nhà" icon="home" onPress={() => {}} />
          <Pill label="Công ty" icon="brief" onPress={() => {}} />
          <Pill label="Cà phê" state={pills.cafe ? 'selected' : 'default'} onPress={() => setPills((p) => ({ ...p, cafe: !p.cafe }))} />
          <Pill label="Thêm" state="dashed" icon="plus" onPress={() => {}} />
          <Pill
            label="Hợp thẻ, ví của tôi"
            state={pills.fit ? 'selected' : 'default'}
            onPress={() => setPills((p) => ({ ...p, fit: !p.fit }))}
          />
        </Row>
      </Section>

      <Section title="Tab phân đoạn · UiTabs">
        <Tabs
          accessibilityLabel="Lọc thông báo"
          value={notifTab}
          onChange={setNotifTab}
          items={[
            { key: 'all', label: 'Tất cả' },
            { key: 'voucher', label: 'Voucher' },
            { key: 'trip', label: 'Chuyến đi' },
          ]}
        />
        <Tabs
          accessibilityLabel="Lọc chuyến"
          value={histTab}
          onChange={setHistTab}
          items={[
            { key: 'all', label: 'Tất cả' },
            { key: 'pending', label: 'Chưa báo giá', count: 1 },
          ]}
        />
        <Tabs
          accessibilityLabel="Loại xe"
          value={vehicle}
          onChange={setVehicle}
          items={[
            { key: 'bike', label: 'Xe máy', icon: 'bike' },
            { key: 'car4', label: 'Ô tô 4 chỗ', icon: 'car' },
            { key: 'car7', label: 'Ô tô 6–7 chỗ', icon: 'suv' },
          ]}
        />
      </Section>

      <Section title="Công tắc · UiToggle">
        <Row gap={12}>
          <Toggle checked={toggleA} onChange={setToggleA} accessibilityLabel="Công tắc mẫu bật" />
          <Caption>Bật</Caption>
          <Toggle checked={toggleB} onChange={setToggleB} accessibilityLabel="Công tắc mẫu tắt" />
          <Caption>Tắt</Caption>
        </Row>
      </Section>

      <Section title="Lối tắt · UiShortcut">
        <Row>
          <Shortcut label="Nhà" icon="home" onPress={() => {}} />
          <Shortcut label="Công ty" icon="brief" onPress={() => {}} />
          <Shortcut label="Thêm" icon="plus" variant="add" onPress={() => {}} accessibilityLabel="Thêm địa điểm đã lưu" />
        </Row>
      </Section>

      <Section title="Nút quay lại · UiBackButton">
        <Row gap={12}>
          <BackButton onPress={() => {}} />
          <BackButton variant="float" onPress={() => {}} />
          <BackButton variant="soft" icon="close" onPress={() => {}} />
          <Caption>Thường · Nổi trên bản đồ · Đóng hộp thoại</Caption>
        </Row>
      </Section>

      <Section title="Tiêu đề mục · UiSectionTitle">
        <SectionTitle text="Đi đến đây được tặng voucher" tag="Tài trợ" />
        <SectionTitle text="Điều kiện" note="Chép từ bài gốc của Grab" />
        <SectionTitle text="Thẻ ngân hàng" size="sm" />
      </Section>

      <Section title="Hàng danh sách · UiListRow" bare>
        <ListCard divider="sides">
          <ListRow icon="clock" title="Chợ Bến Thành" sub="Đường Lê Lợi, phường Bến Thành" chip="3 voucher" onPress={() => {}} />
          <ListRow
            icon="pin"
            leadTone="neutral"
            hl="Chợ Bến"
            title="Thành"
            sub="Đường Lê Lợi, phường Bến Thành"
            meta="5,8 km"
            chip="3 voucher"
          />
          <ListRow icon="clock" title="Lịch sử so giá" sub="1 chuyến chưa báo giá" subTone="deal" trail="chev" onPress={() => {}} />
          <ListRow
            lead="mono"
            mono="KL"
            title="KienLongBank"
            sub="Liên kết để mở mã KLBIKE cho GrabBike"
            subWrap
            trail="action"
            onAction={() => {}}
          />
          <ListRow lead="mono" mono="VP" title="VPBank" sub="Thẻ tín dụng · hợp mã VPBTRANSPORT" subWrap trail="done" />
          <ListRow
            lead="none"
            title="Voucher tặng riêng"
            sub="Khi quán gần nơi bạn hay đến tặng mã cho bạn."
            subWrap
            trail="toggle"
            checked={rowToggle}
            onPress={() => setRowToggle((v) => !v)}
          />
        </ListCard>
        <ListCard divider="lead">
          <ListRow lead="logo" logo="be" title="Be" sub="Biết khi mã được dùng để nhắc báo giá" subWrap trail="done" />
          <ListRow
            lead="logo"
            logo="grab"
            title="Grab"
            sub="Biết khi mã được dùng để nhắc báo giá"
            subWrap
            trail="action"
            onAction={() => {}}
          />
          <ListRow
            lead="logo"
            logo="gsm"
            title="Green SM"
            sub="Biết khi mã được dùng để nhắc báo giá"
            subWrap
            trail="action"
            onAction={() => {}}
          />
          <ListRow icon="sparkplus" title="Báo giá chuyến Be" sub="Hôm nay, 18:12" chip="+50" chipTone="tint" />
        </ListCard>
        <ListCard>
          {['Chợ Bến Thành', 'Landmark 81'].map((t, i) =>
            picked === i ? (
              <ListRow
                key={t}
                icon="pin"
                title={t}
                sub="Gợi ý từ chuyến gần đây"
                trail="done"
                doneLabel="Đã chọn"
                selected
                onPress={() => setPicked(i)}
              />
            ) : (
              <ListRow key={t} icon="clock" title={t} sub="Gợi ý từ chuyến gần đây" selected={false} onPress={() => setPicked(i)} />
            ),
          )}
        </ListCard>
      </Section>

      <Section title="Banner · UiBanner" bare>
        <Banner
          chip="Quà chào mừng"
          title="Giảm 10.000đ chuyến Be xe máy"
          sub="Frego tự gắn mã khi bạn đặt xe"
          ticketAmount="−10K"
          ticketService="Be xe máy"
          onPress={() => {}}
        />
      </Section>

      <Section title="Ưu đãi điểm đến · UiDealRow" bare>
        <DealRow
          category="cafe"
          area="Gần Chợ Bến Thành"
          brand="Cà phê Mây"
          serviceText="Mã Grab ô tô"
          amountText="−20.000đ"
          cta="Đặt xe ›"
          onPress={() => {}}
        />
        <DealRow
          category="book"
          area="Gần Hồ Con Rùa"
          brand="Nhà sách Gió"
          serviceText="Mã Be xe máy"
          amountText="−15.000đ"
          cta="Đặt xe ›"
          onPress={() => {}}
        />
        <DealRow
          category="gym"
          area="Gần Landmark 81"
          brand="Phòng tập Nhịp"
          serviceText="Mã Green SM ô tô"
          amountText="−15.000đ"
          cta="Đặt xe ›"
        />
        <DealRow
          category="cake"
          area="Gần chợ Tân Định"
          brand="Tiệm bánh Mộc"
          serviceText="Mã Be xe máy"
          amountText="−10.000đ"
          cta="Đặt xe ›"
        />
        <DealRow
          category="bowl"
          area="Gần phố đi bộ Nguyễn Huệ"
          brand="Quán bún Ngõ Nhỏ"
          serviceText="Mã Grab xe máy"
          amountText="−10.000đ"
          cta="Đặt xe ›"
        />
      </Section>

      <Section title="Vé voucher · UiVoucherTicket" bare>
        <VoucherTicket
          logo="cup"
          amountText="−20.000đ"
          serviceText="Grab ô tô"
          tag="sponsor"
          title="Cà phê Mây"
          line="Tặng vì bạn hay đến khu Chợ Bến Thành"
          lineIcon="spark"
          metaText="HSD 30/11/2026"
          action="Xem mã ›"
          onPress={() => {}}
        />
        <VoucherTicket
          logo="f"
          amountText="−10.000đ"
          serviceText="Be xe máy"
          tag="frego"
          title="Mã FREGO20"
          line="Quà chào mừng khi bạn tham gia Frego"
          lineIcon="spark"
          metaText="HSD 30/11/2026"
          action="Dùng ›"
          onPress={() => {}}
        />
        <VoucherTicket
          mode="attach"
          logo="bowl"
          amountText="−10.000đ"
          serviceText="Grab xe máy"
          tag="sponsor"
          name="Quán bún Ngõ Nhỏ"
          conditionLine="Grab xe máy · đến khu phố đi bộ Nguyễn Huệ"
          metaText="HSD 05/12/2026"
          attached={attached}
          onToggle={() => setAttached((v) => !v)}
        />
        <VoucherTicket
          mode="attach"
          logo="grab"
          amountText="−15.000đ"
          serviceText="Grab ô tô"
          tag="public"
          name="VPBTRANSPORT"
          conditionLine="Thanh toán bằng thẻ VPBank đã liên kết"
          metaText="Nguồn: grab.com"
          attached={!attached}
          onToggle={() => setAttached((v) => !v)}
        />
        <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 16 }}>
          <VoucherTicket
            mode="static"
            logo="f"
            amountText="−10.000đ"
            tag="frego"
            tagText="Quà chào mừng"
            title="Mã FREGO20 cho chuyến Be xe máy"
            line="Đã có trong Ví voucher, Frego tự gắn khi bạn đặt xe."
            notchColor={colors.surface}
          />
        </View>
        <Row>
          {(['cup', 'book', 'gym', 'cake', 'bowl', 'lotus'] as const).map((k) => (
            <BrandLogo key={k} kind={k} size={52} radius={14} />
          ))}
        </Row>
      </Section>

      <Section title="Thẻ mã · UiCodeCard" bare>
        <CodeCard
          logo="grab"
          brandLine="Grab · mã công khai"
          code="VPBTRANSPORT"
          title="Giảm 15.000đ cho chuyến GrabBike, GrabCar từ 50.000đ"
          okText="Hợp thẻ VPBank của bạn"
          plainText="1 lần mỗi tháng"
          metaText="Nguồn: grab.com · kiểm tra 2 giờ trước"
          cta="Chi tiết ›"
          onPress={() => {}}
        />
        <CodeCard
          logo="be"
          brandLine="Be · mã ngân hàng"
          code="KLBIKE"
          title="Giảm 12.000đ cho chuyến Be xe máy"
          warnText="Cần thẻ KienLongBank"
          plainText="Xe máy"
          plainText2="Đến 31/12"
          metaText="Nguồn: kienlongbank.com · kiểm tra hôm nay"
          cta="Chi tiết ›"
          onPress={() => {}}
        />
        <CodeCard
          logo="gsm"
          brandLine="Green SM · tự áp, không cần mã"
          title="Giảm 25% mọi chuyến đến hết 28/02/2027"
          metaText="Nguồn: greensm.com · kiểm tra hôm nay"
        />
      </Section>

      <Section title="Giá sau voucher · UiPriceRow" bare>
        {ROWS.map((r) => (
          <PriceRowCard key={r.service} row={r} onPress={() => {}} />
        ))}
      </Section>

      <Section title="Ô xe · UiVehicleTile">
        <Row gap={12}>
          <VehicleTile brand="grab" kind="bike" />
          <VehicleTile brand="be" kind="car" />
          <VehicleTile brand="gsm" kind="suv" />
          <VehicleTile brand="other" kind="car4" />
        </Row>
      </Section>

      <Section title="Thông báo · UiNotifItem" bare>
        <NotifItem
          icon="receipt"
          logo="be"
          title="Mã FREGO20 đã được dùng cho chuyến Be"
          body="Giá thật tiết kiệm được bao nhiêu? Báo giá để được cộng điểm."
          metaText="18:05 · Chuyến đi"
          cta="Báo giá ›"
          unread
          onPress={() => {}}
        />
        <NotifItem
          icon="gift"
          tone="deal"
          logo="cafe"
          title="Cà phê Mây tặng bạn voucher −20.000đ"
          body="Dùng cho chuyến Grab ô tô đến khu Chợ Bến Thành, hạn 30/11."
          metaText="15:20 · Voucher"
          cta="Xem mã ›"
          unread
          onPress={() => {}}
        />
        <NotifItem
          icon="card2"
          tone="deal"
          logo="grab"
          title="Mã mới hợp thẻ VPBank của bạn"
          body="VPBTRANSPORT giảm 15.000đ cho chuyến GrabBike, GrabCar từ 50.000đ."
          metaText="09:12 · Voucher"
          cta="Chi tiết ›"
          onPress={() => {}}
        />
        <NotifItem
          icon="sparkplus"
          logo="frego"
          title="Bạn được cộng 50 điểm"
          body="Cảm ơn bạn đã báo giá chuyến Grab ô tô Nhà → Công ty. Bạn đang có 1.250 điểm."
          metaText="Hôm qua, 08:52 · Chuyến đi"
          cta="Đổi voucher ›"
          onPress={() => {}}
        />
        <NotifItem
          icon="tag"
          tone="deal"
          title="Green SM giảm 25% mọi chuyến"
          body="Tự áp đến hết 28/02/2027, không cần nhập mã."
          metaText="8/11 · Voucher"
          cta="Xem trong Ví ›"
          onPress={() => {}}
        />
      </Section>

      <Section title="Thông báo đẩy · UiPushNotif" bare>
        <View style={{ backgroundColor: colors.pushBg, borderRadius: 24, padding: 16 }}>
          <PushNotif
            title="Mã FREGO20 vừa được dùng cho chuyến Be"
            body="Giá thật tiết kiệm được bao nhiêu? Bấm đánh giá để được cộng điểm."
          />
        </View>
        <Button
          label="Thử thông báo đẩy (PushHost)"
          variant="secondary"
          size="md"
          onPress={() =>
            push.show({
              title: 'Cà phê Mây tặng bạn voucher −20.000đ',
              body: 'Dùng cho chuyến Grab ô tô đến khu Chợ Bến Thành, hạn 30/11. Bấm để xem mã.',
              time: 'vừa xong',
              link: '/dev/thanh-phan',
            })
          }
        />
      </Section>

      <Section title="Bản đồ · UiMapRoute" bare>
        <View style={{ borderRadius: 24, overflow: 'hidden' }}>
          <MapRoute height={250} from="Landmark 81" to="Chợ Bến Thành" />
        </View>
      </Section>

      <Section title="Thanh điều hướng · UiNavBar" bare>
        {(['home', 'voucher', 'notif', 'account'] as const).map((k) => (
          <View key={k} style={{ marginHorizontal: -20 }}>
            <NavBar active={k === 'home' ? nav : k} badge={k === 'account' ? '' : '3'} onNavigate={k === 'home' ? setNav : () => {}} />
          </View>
        ))}
      </Section>

      <Section title="Logo · BrandLogo">
        <Row gap={12}>
          <BrandLogo kind="grab" size={40} radius={12} />
          <BrandLogo kind="be" size={40} radius={12} />
          <BrandLogo kind="gsm" size={40} radius={12} />
          <BrandLogo kind="frego" size={40} radius={12} />
          <BrandLogo kind="cafe" size={40} radius={12} />
          <MonoLogo text="VP" />
          <MonoLogo text="Mo" />
          <BrandLogo kind="grab" size={44} radius={14} />
          <BrandLogo kind="be" size={30} radius={9} frame="badge" />
        </Row>
        <Wordmark />
      </Section>

      <Section title="Dữ liệu từ core (spread view model)" bare>
        <DealRow {...DEAL} onPress={() => {}} />
        <VoucherTicket {...GIFT} onPress={() => {}} />
        <VoucherTicket {...ATTACH} mode="attach" attached={attach2} onToggle={() => setAttach2((v) => !v)} />
        <CodeCard {...CODE} cta="Chi tiết ›" onPress={() => {}} />
        <NotifItem {...NOTIF} onPress={() => {}} />
      </Section>

      <Section title="Bố cục · Card, ListCard" bare>
        <Card gap={8}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <T weight={700} size={13} lineHeight={17} color={colors.muted} style={{ fontVariant: ['tabular-nums'] }}>
              17:40
            </T>
            <Chip text="Chưa báo giá" tone="deal" size="sm" />
          </View>
          <T weight={800} size={16} lineHeight={22}>
            Landmark 81 → Chợ Bến Thành
          </T>
          <T size={13} lineHeight={20} color={colors.ink2}>
            Be xe máy · mã FREGO20 · ước tính sau mã 21.000–26.000đ
          </T>
          <View style={{ paddingTop: 4 }}>
            <Button label="Báo giá thật" badge="+10 điểm" size="md" />
          </View>
        </Card>
        <Card tone="primary" onPress={() => {}} accessibilityLabel="Điểm thưởng 1.250, đổi voucher" gap={4}>
          <T weight={600} size={13} lineHeight={17} color={colors.onPrimarySoft}>
            Điểm thưởng
          </T>
          <T weight={800} size={26} lineHeight={30} color={colors.white}>
            1.250
          </T>
          <T weight={700} size={13} lineHeight={17} color={colors.white}>
            Đổi voucher ›
          </T>
        </Card>
        <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 16 }}>
          <ListCard tone="bg">
            <ListRow
              lead="none"
              title="Vị trí khi đang dùng app"
              sub="Để điền điểm đón và tính quãng đường."
              subWrap
              trail="toggle"
              checked
              onPress={() => {}}
            />
            <ListRow
              lead="none"
              title="Góp dữ liệu tìm kiếm ẩn danh"
              sub="Gộp theo khu vực và khung giờ để giá ước tính sát hơn."
              subWrap
              trail="toggle"
              checked={false}
              onPress={() => {}}
            />
          </ListCard>
        </View>
      </Section>

      <Section title="Bố cục · ScreenHeader" bare>
        <View style={{ marginHorizontal: -20, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line }}>
          <ScreenHeader title="Lịch sử so giá" backLabel="Quay lại Tài khoản" onBack={() => {}} />
        </View>
      </Section>

      <Section title="Bố cục · Sheet trên bản đồ" bare>
        <View style={{ marginHorizontal: -20, height: 520, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
          <View style={{ height: 250 }}>
            <MapRoute height={250} from="Landmark 81" to="Chợ Bến Thành" />
            <BackButton
              variant="float"
              onPress={() => {}}
              accessibilityLabel="Quay lại chọn điểm đến"
              style={{ position: 'absolute', top: 52, left: 16 }}
            />
          </View>
          <Sheet title="Landmark 81 → Chợ Bến Thành" subtitle="5,8 km · khoảng 20 phút">
            <InfoNote icon="pinok" title="Điểm đến vẫn là Chợ Bến Thành" text="Voucher chỉ giảm giá, không đổi địa chỉ đến." />
            <SectionTitle text="Gắn voucher trước khi so giá" />
          </Sheet>
        </View>
      </Section>

      <Section title="Bố cục · BottomBar" bare>
        <View style={{ marginHorizontal: -20 }}>
          <BottomBar gap={4}>
            <Button label="Bắt đầu" />
            <Button label="Xem voucher trước, đăng nhập sau" variant="text" size="sm" />
          </BottomBar>
        </View>
      </Section>

      <Section title="Bố cục · ModalSheet" bare>
        <View style={{ marginHorizontal: -20, height: 600, overflow: 'hidden' }}>
          <ModalSheet backdrop={<MapRoute height="100%" labels={false} />} onDismiss={() => {}}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <T weight={800} size={22} lineHeight={28} style={{ flex: 1, letterSpacing: -0.3 }} accessibilityRole="header">
                Mở app Be để đặt xe
              </T>
              <BackButton variant="soft" icon="close" onPress={() => {}} accessibilityLabel="Đóng, quay lại chọn hãng xe" />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <VehicleTile brand="be" kind="bike" />
              <View style={{ flex: 1, gap: 2 }}>
                <T weight={700} size={15} lineHeight={20}>
                  Be · Xe máy
                </T>
                <T size={14} lineHeight={20} color={colors.ink2}>
                  ước tính sau mã{' '}
                  <T weight={700} size={14} lineHeight={20}>
                    21.000–26.000đ
                  </T>
                </T>
              </View>
            </View>
            <Button label="Mở app Be" icon="external" />
          </ModalSheet>
        </View>
      </Section>
    </ScrollView>
  );
}
