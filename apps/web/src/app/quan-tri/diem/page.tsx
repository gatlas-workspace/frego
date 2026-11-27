// QT 8 · Điểm và mã Frego (WebQtDiemThuong): quy tắc cộng điểm, quà đổi điểm, mã do Frego tự tài trợ, "Tạo mã Frego",
// tab Giới thiệu (UI v3): số lượt tháng này, điểm đã phát, danh sách "giữ để kiểm tra" có Duyệt / Từ chối.
import type { Metadata } from 'next';
import { brand } from '@frego/core';
import {
  Button,
  Callout,
  Drawer,
  Hint,
  KeyValue,
  KeyValueList,
  PageBody,
  PageHeader,
  StatCard,
  StatGroup,
  Status,
  Table,
  Tabs,
  Topbar,
  type TableColumn,
  type TableRow,
} from '@/components/web';
import { adminOpsService } from '@/lib/server/data';
import { setFregoCodeActiveAction } from './actions';
import { CreateCodeDrawer } from './_components/CreateCodeDrawer';
import { ReferralDecision } from './_components/ReferralDecision';

export const metadata: Metadata = { title: 'Điểm và mã Frego' };

type Search = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const TABS = ['rules', 'gifts', 'codes', 'referrals'] as const;
type Tab = (typeof TABS)[number];

const ruleCols: TableColumn[] = [
  { label: 'Cách nhận điểm', w: 'minmax(0,1.2fr)' },
  { label: 'Điểm', align: 'right', w: '80px' },
  { label: 'Điều kiện', w: 'minmax(0,1.4fr)', type: 'text' },
  { label: 'Lượt tháng này', align: 'right', w: '150px' },
  { label: 'Trạng thái', w: '130px' },
];
const giftCols: TableColumn[] = [
  { label: 'Quà đổi điểm', w: 'minmax(0,1fr)' },
  { label: 'Giá điểm', align: 'right', w: '110px', type: 'number' },
  { label: 'Đã đổi tháng này', align: 'right', w: '150px' },
  { label: 'Chi phí', align: 'right', w: '130px', type: 'money' },
  { label: 'Trạng thái', w: '130px' },
];
const referralCols: TableColumn[] = [
  { label: 'Người giới thiệu', w: 'minmax(0,1fr)', type: 'text' },
  { label: 'Người mới', w: 'minmax(0,1fr)', type: 'text' },
  { label: 'Nhập mã', w: '150px', type: 'date' },
  { label: 'Trạng thái', w: '150px' },
];
const heldCols: TableColumn[] = [
  { label: 'Lượt giới thiệu', w: 'minmax(0,1fr)', type: 'text' },
  { label: 'Lý do giữ', w: 'minmax(0,0.8fr)', type: 'text' },
  { label: 'Quyết định', w: 'minmax(0,1.3fr)', type: 'none' },
];
const codeCols: TableColumn[] = [
  { label: 'Mã', w: '150px' },
  { label: 'Ưu đãi', w: 'minmax(0,1fr)', type: 'text' },
  { label: 'Hạn dùng', w: '170px', type: 'date' },
  { label: 'Đã dùng tháng này', align: 'right', w: '170px' },
  { label: 'Chi phí', align: 'right', w: '130px', type: 'money' },
  { label: 'Trạng thái', w: '130px' },
];

export default async function PointsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const tabParam = first(params.tab);
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'rules';
  const created = first(params['da-tao']);
  const openCodeId = first(params.ma);

  const { svc } = await adminOpsService();
  const [v, ref] = await Promise.all([svc.getPointsAdmin(), svc.getReferralAdmin()]);
  const { awarded, redeemed, codesUsed, codesCost } = v.stats;

  const ruleRows: TableRow[] = v.rules.map((r) => ({
    key: r.key,
    cells: [{ text: r.title, strong: true }, r.pointsText, r.condition, r.usesText, { text: r.label.text, status: r.label.tone }],
  }));
  const giftRows: TableRow[] = v.rewards.map((g) => ({
    key: g.id,
    cells: [{ text: g.title, logo: g.providerId, strong: true }, g.costText, g.redeemedText, g.spendText, { text: g.label.text, status: g.label.tone }],
  }));
  const createdIndex = created ? v.codes.findIndex((c) => c.code === created) : -1;
  const createdRow = createdIndex >= 0 ? v.codes[createdIndex] : null;
  const openIndex = openCodeId ? v.codes.findIndex((c) => c.id === openCodeId) : -1;
  const openCode = openIndex >= 0 && tab === 'codes' ? v.codes[openIndex] : null;
  const codeHref = (id: string) => `/quan-tri/diem?tab=codes&ma=${encodeURIComponent(id)}`;
  const codeRows: TableRow[] = v.codes.map((c) => ({
    key: c.id,
    cells: [
      { text: c.code, code: true },
      { text: c.offerText, logo: c.providerId, sub: c.title, href: codeHref(c.id) },
      c.validityText,
      c.usedText,
      c.costText,
      { text: c.label.text, status: c.label.tone },
    ],
  }));

  const referralRows: TableRow[] = ref.recent.map((r) => ({
    key: r.id,
    cells: [r.referrerText, r.refereeText, r.createdText.replace('Nhập mã ', ''), { text: r.label.text, status: r.label.tone }],
  }));
  const heldRows: TableRow[] = ref.held.map((r) => ({
    key: r.id,
    cells: [
      { text: `${r.referrerText} → ${r.refereeText}`, sub: r.createdText },
      r.note ?? 'Giữ để kiểm tra',
      <ReferralDecision key={r.id} id={r.id} label={`Quyết định lượt ${r.referrerText} giới thiệu ${r.refereeText}`} />,
    ],
  }));

  return (
    <>
      <Topbar crumbs="Frego / Điểm và mã Frego" />
      <PageBody>
        <PageHeader
          title="Điểm và mã Frego"
          description={`Quy tắc cộng điểm, quà đổi điểm và mã do ${brand.name} tự tài trợ như ${brand.welcomeCode}. Chi phí phần này do ${brand.name} trả, không trừ ví doanh nghiệp.`}
          actions={<CreateCodeDrawer />}
        />
        <StatGroup label="Số liệu điểm và mã tháng này">
          <StatCard label={awarded.label} value={awarded.value} sub={awarded.sub} delta={awarded.delta} tone={awarded.deltaTone} />
          <StatCard label={redeemed.label} value={redeemed.value} sub={redeemed.sub} />
          <StatCard label={codesUsed.label} value={codesUsed.value} sub={codesUsed.sub} />
          <StatCard label={codesCost.label} value={codesCost.value} sub={codesCost.sub} />
        </StatGroup>

        <section aria-label="Cấu hình điểm" className="flex min-w-0 flex-col">
          <Tabs
            label="Cấu hình điểm"
            toolbar
            active={tab}
            pathname="/quan-tri/diem"
            items={[
              { key: 'rules', label: 'Quy tắc cộng điểm', count: v.rules.length, icon: 'table' },
              { key: 'gifts', label: 'Quà đổi điểm', count: v.rewards.length },
              { key: 'codes', label: 'Mã Frego', count: v.codes.length },
              { key: 'referrals', label: 'Giới thiệu', count: ref.held.length || undefined },
            ]}
          />
          {tab === 'rules' ? (
            <>
              <Table cols={ruleCols} rows={ruleRows} caption="Quy tắc cộng điểm" flush />
              <Hint>{v.multiplierNote}</Hint>
              <Callout text={v.fraudNote} tone="amber" icon="info" className="mt-3" />
            </>
          ) : null}
          {tab === 'referrals' ? (
            <div className="flex min-w-0 flex-col gap-4 pt-3">
              <StatGroup label="Giới thiệu bạn bè tháng này">
                <StatCard label={ref.stats.rewarded.label} value={ref.stats.rewarded.value} sub={ref.stats.rewarded.sub} />
                <StatCard label={ref.stats.points.label} value={ref.stats.points.value} sub={ref.stats.points.sub} />
                <StatCard label={ref.stats.pending.label} value={ref.stats.pending.value} sub={ref.stats.pending.sub} />
                <StatCard label={ref.stats.held.label} value={ref.stats.held.value} sub={ref.stats.held.sub} />
              </StatGroup>
              <Callout text={ref.rulesText} tone="grey" icon="info" />
              <section aria-labelledby="gt-giu" className="flex min-w-0 flex-col gap-1.5">
                <h2 id="gt-giu" className="m-0 text-[15px] font-semibold leading-[1.35]">
                  Giữ lại để kiểm tra
                </h2>
                <Table cols={heldCols} rows={heldRows} caption="Giữ lại để kiểm tra" emptyText="Không có lượt nào đang giữ." />
              </section>
              <section aria-labelledby="gt-moi" className="flex min-w-0 flex-col gap-1.5">
                <h2 id="gt-moi" className="m-0 text-[15px] font-semibold leading-[1.35]">
                  Lượt giới thiệu mới nhất
                </h2>
                <Table cols={referralCols} rows={referralRows} caption="Lượt giới thiệu mới nhất" emptyText="Chưa có lượt giới thiệu." />
              </section>
            </div>
          ) : null}
          {tab === 'gifts' ? <Table cols={giftCols} rows={giftRows} caption="Quà đổi điểm" flush emptyText="Chưa có quà đổi điểm." /> : null}
          {tab === 'codes' ? (
            <>
              {createdRow ? (
                <Callout
                  tone="green"
                  icon="check"
                  role="status"
                  className="mb-3"
                  text={`Đã tạo mã ${createdRow.code} (${createdRow.offerText}), trạng thái: ${createdRow.label.text.toLowerCase()}.`}
                />
              ) : null}
              <Table
                cols={codeCols}
                rows={codeRows}
                caption="Mã Frego"
                flush
                highlight={openIndex >= 0 ? openIndex : createdIndex >= 0 ? createdIndex : undefined}
                emptyText="Chưa có mã Frego."
              />
              <Hint>Mã dùng cho quà đổi điểm nằm ở tab Quà đổi điểm.</Hint>
            </>
          ) : null}
        </section>
      </PageBody>
      {openCode ? (
        <Drawer
          open
          title={`Mã ${openCode.code}`}
          closeHref="/quan-tri/diem?tab=codes"
          footer={
            <form action={setFregoCodeActiveAction}>
              <input type="hidden" name="id" value={openCode.id} />
              <input type="hidden" name="active" value={String(!openCode.active)} />
              <Button type="submit" variant={openCode.active ? 'danger' : 'primary'} icon={openCode.active ? 'none' : 'check'}>
                {openCode.active ? 'Tạm dừng mã' : 'Chạy mã'}
              </Button>
            </form>
          }
        >
          <KeyValueList>
            <KeyValue label="Ưu đãi">{openCode.offerText}</KeyValue>
            <KeyValue label="Mô tả">{openCode.title}</KeyValue>
            <KeyValue label="Hạn dùng">{openCode.validityText}</KeyValue>
            <KeyValue label="Đã dùng tháng này" numeric>
              {openCode.usedText}
            </KeyValue>
            <KeyValue label="Chi phí" numeric>
              {openCode.costText}
            </KeyValue>
            <KeyValue label="Trạng thái">
              <Status text={openCode.label.text} tone={openCode.label.tone} />
            </KeyValue>
          </KeyValueList>
          {openCode.kind === 'welcome' && openCode.active ? (
            <Callout tone="amber" text="Đây là quà chào mừng. Tạm dừng thì người dùng mới không nhận mã khi đăng nhập lần đầu." />
          ) : null}
        </Drawer>
      ) : null}
    </>
  );
}
