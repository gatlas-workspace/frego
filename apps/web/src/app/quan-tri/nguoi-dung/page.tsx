// QT 4 · Người dùng và báo giá (WebQtNguoiDung): tab Người dùng (tìm ?q=, chọn ?id=, khung chi tiết có nhật ký xem),
// tab Báo giá (?tab=bao-gia: độ khớp ước tính theo hãng, báo giá mới nhất).
import type { Metadata } from 'next';
import { POINTS_RULES, brand } from '@frego/core';
import {
  Avatar,
  Callout,
  Columns,
  DetailHeader,
  InfoTile,
  KeyValue,
  KeyValueList,
  PageBody,
  PageHeader,
  Panel,
  ProviderMark,
  SearchField,
  Section,
  Status,
  SubHeading,
  Table,
  Tabs,
  Topbar,
  cx,
  type TableColumn,
  type TableRow,
} from '@/components/web';
import { adminService } from '@/lib/server/data';
import { UserActions } from './_components/UserActions';

export const metadata: Metadata = { title: 'Người dùng và báo giá' };

type Search = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const userCols: TableColumn[] = [
  { label: 'Người dùng', w: 'minmax(0,1.3fr)' },
  { label: 'Lượt so giá', align: 'right', w: '96px' },
  { label: 'Mã đã dùng', align: 'right', w: '96px' },
  { label: 'Điểm', align: 'right', w: '76px' },
  { label: 'Trạng thái', w: '140px' },
];
const reportCols: TableColumn[] = [
  { label: 'Chuyến', w: 'minmax(0,1fr)' },
  { label: 'Ước tính', align: 'right', w: '140px' },
  { label: 'Giá thật', align: 'right', w: '90px' },
  { label: 'Kết quả', w: '124px' },
];

export default async function UsersPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const { svc } = await adminService();
  const v = await svc.getUsersPage({ tab: first(params.tab), q: first(params.q), id: first(params.id) });
  // Thiết kế: mỗi lần mở chi tiết người dùng đều ghi nhật ký (bỏ qua lần render lại ngay sau thao tác).
  if (v.selected) await svc.recordUserView(v.selected.id);

  const qs = (id: string) => `/quan-tri/nguoi-dung?${v.query ? `q=${encodeURIComponent(v.query)}&` : ''}id=${encodeURIComponent(id)}`;
  const userRows: TableRow[] = v.users.map((u) => ({
    key: u.id,
    highlight: v.selected?.id === u.id,
    cells: [
      { text: u.name, sub: u.phoneText, strong: true, href: qs(u.id) },
      u.comparesText,
      u.usedText,
      u.pointsText,
      { text: u.chip.text, status: u.chip.tone },
    ],
  }));
  const reportRows: TableRow[] = v.reports.map((r) => ({
    key: r.id,
    cells: [
      { text: r.title, sub: r.sub, strong: true },
      { text: r.estimateText, muted: r.estimateMuted },
      { text: r.actualText, strong: true },
      { text: r.chip.text, status: r.chip.tone },
    ],
  }));
  const u = v.selected;

  return (
    <>
      <Topbar crumbs="Frego / Người dùng, báo giá" />
      <PageBody>
        <PageHeader
          title="Người dùng và báo giá"
          description="Số điện thoại hiện một phần. Mỗi lần mở chi tiết người dùng đều được ghi lại."
        />
        <Tabs
          label="Mục"
          toolbar
          active={v.tab}
          items={v.tabs.map((t) => ({
            key: t.key,
            label: t.label,
            count: t.count,
            href: t.key === 'nguoi-dung' ? '/quan-tri/nguoi-dung' : `/quan-tri/nguoi-dung?tab=${t.key}`,
          }))}
        />

        {v.tab === 'nguoi-dung' ? (
          <Columns template="minmax(0,1fr) 380px" gap={24}>
            <Section label="Danh sách người dùng" gap={10}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SearchField
                  label="Tìm người dùng"
                  placeholder="Tìm theo tên, 4 số cuối điện thoại"
                  defaultValue={v.query}
                  action="/quan-tri/nguoi-dung"
                  width={320}
                />
                <span className="text-[13px] text-ink-2">Số liệu 30 ngày qua</span>
              </div>
              <Table
                cols={userCols}
                rows={userRows}
                caption="Người dùng"
                emptyText={v.query ? `Không tìm thấy người dùng khớp "${v.query}".` : 'Chưa có người dùng.'}
              />
              {v.lockedNote ? <Callout text={v.lockedNote} /> : null}
            </Section>

            {u ? (
              <Panel as="aside" padding="lg" gap={14} label={`Chi tiết người dùng ${u.name}`} sticky>
                <DetailHeader
                  leading={<Avatar name={u.name} size={40} />}
                  title={u.name}
                  sub={u.sub}
                  size={17}
                  divider={false}
                  trailing={<Status text={u.chip.text} tone={u.chip.tone} />}
                />
                <KeyValueList>
                  {u.facts.map((f) => (
                    <KeyValue key={f.label} label={f.label}>
                      {f.value}
                    </KeyValue>
                  ))}
                </KeyValueList>
                <div>
                  <SubHeading className="mb-0.5">Lịch sử điểm</SubHeading>
                  {u.ledger.length ? (
                    <ul className="m-0 list-none p-0">
                      {u.ledger.map((e) => (
                        <li key={e.id} className="flex items-center gap-2.5 border-b border-line-soft py-[7px]">
                          <span className={cx('w-10 flex-none text-[13px] font-semibold tabular-nums', e.positive ? 'text-good-ink' : 'text-bad')}>
                            {e.deltaText}
                          </span>
                          <span className="min-w-0 flex-1 text-[13px] leading-[1.4]">{e.reason}</span>
                          <span className="flex-none text-[12px] text-ink-2">{e.dateText}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="m-0 py-2 text-[13px] text-ink-2">Chưa có điểm nào.</p>
                  )}
                </div>
                <UserActions key={u.id} userId={u.id} name={u.name} locked={u.locked} />
              </Panel>
            ) : null}
          </Columns>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="grid flex-none grid-cols-1 gap-3 @min-[760px]:grid-cols-3">
              <InfoTile icon="check" title={`Một chạm · +${POINTS_RULES.tap} điểm`}>
                Rẻ hơn, đúng khoảng hay đắt hơn. Nhanh nhưng chỉ cho biết hướng lệch.
              </InfoTile>
              <InfoTile icon="receipt" title={`Nhập số tiền · +${POINTS_RULES.amount} điểm`}>
                Giá chính xác sau khi trừ mã, dùng để chỉnh công thức ước tính.
              </InfoTile>
              <InfoTile icon="mail" title={`Biên nhận email · +${POINTS_RULES.receipt} điểm`}>
                Tự đọc từ email hãng gửi, chính xác nhất, không cần người dùng thao tác.
              </InfoTile>
            </div>
            <Columns template="minmax(0,0.9fr) minmax(0,1.1fr)" gap={24}>
              <Panel
                title="Độ khớp ước tính theo hãng"
                id="bg-khop"
                gap={8}
                description={`Tỷ lệ giá thật nằm trong khoảng ước tính, 30 ngày qua. Chỉ bật ước tính khi đủ ${brand.minReportsToEnableEstimate} báo giá mỗi khu vực.`}
              >
                <ul className="m-0 list-none p-0">
                  {v.accuracy.map((a) => (
                    <li key={a.key} className="flex items-center gap-2.5 border-t border-line-soft py-[9px]">
                      <ProviderMark provider={a.providerId} size={24} />
                      <span className="flex min-w-0 flex-1 flex-col gap-px">
                        <span className="text-[14px] font-medium">{a.label}</span>
                        <span className="text-[12px] text-ink-2">{a.sub}</span>
                      </span>
                      <span className="w-11 flex-none text-right text-[15px] font-semibold tabular-nums">{a.valueText}</span>
                      <span className="flex w-[130px] flex-none justify-end max-[480px]:w-auto">
                        <Status text={a.chip.text} tone={a.chip.tone} />
                      </span>
                    </li>
                  ))}
                </ul>
              </Panel>
              <Section title="Báo giá mới nhất" id="bg-moi">
                <Table cols={reportCols} rows={reportRows} caption="Báo giá mới nhất" emptyText="Chưa có báo giá nào." />
              </Section>
            </Columns>
          </div>
        )}
      </PageBody>
    </>
  );
}
