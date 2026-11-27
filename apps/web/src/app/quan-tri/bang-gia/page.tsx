// QT 10 · Bảng giá ước tính (WebQtBangGia): tab khu vực, bảng giá theo hãng và loại xe, form sửa có ước tính thử trực tiếp.
import type { Metadata } from 'next';
import type { RegionId } from '@frego/core';
import {
  Callout,
  Columns,
  DetailHeader,
  Drawer,
  Hint,
  List,
  ListRow,
  PageBody,
  PageHeader,
  Panel,
  ProviderMark,
  Table,
  Tabs,
  Topbar,
  type TableColumn,
  type TableRow,
} from '@/components/web';
import { adminOpsService } from '@/lib/server/data';
import { FareEditor } from './_components/FareEditor';

export const metadata: Metadata = { title: 'Bảng giá ước tính' };

type Search = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const cols: TableColumn[] = [
  { label: 'Hãng và loại xe', w: 'minmax(0,1fr)' },
  { label: 'Mở cửa', align: 'right', w: '96px', type: 'money' },
  { label: 'Mỗi km', align: 'right', w: '86px', type: 'money' },
  { label: 'Mỗi phút', align: 'right', w: '90px', type: 'money' },
  { label: 'Cao điểm', align: 'right', w: '92px' },
  { label: 'Khớp', align: 'right', w: '72px' },
  { label: 'Trạng thái', w: '146px' },
];

const BASE = '/quan-tri/bang-gia';

export default async function FarePage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const region: RegionId = first(params['khu-vuc']) === 'hn' ? 'hn' : 'hcm';
  const chosen = first(params.chon);
  const historyOpen = first(params['lich-su']) === '1';

  const { svc } = await adminOpsService();
  const v = await svc.getFareTables(region, chosen);
  const sel = v.selected;
  const regionLabel = v.regions.find((r) => r.key === region)?.label ?? '';
  const hrefFor = (id: string, extra = '') => `${BASE}?khu-vuc=${region}&chon=${encodeURIComponent(id)}${extra}`;
  const history = historyOpen && sel ? await svc.getFareHistory(sel.table.id) : null;

  const rows: TableRow[] = v.rows.map((r) => ({
    key: r.id,
    cells: [
      { text: r.label, logo: r.providerId, strong: true, href: hrefFor(r.id) },
      { text: r.openText, muted: r.muted },
      { text: r.perKmText, muted: r.muted },
      { text: r.perMinText, muted: r.muted },
      { text: r.peakText, muted: r.muted },
      r.accuracyText,
      { text: r.status.text, status: r.status.tone },
    ],
  }));

  return (
    <>
      <Topbar crumbs="Frego / Bảng giá ước tính" />
      <PageBody>
        <PageHeader
          title="Bảng giá ước tính"
          description="Công thức Frego dùng để ước tính giá trước khi trừ mã, theo hãng, loại xe và khu vực. Chỉnh từ báo giá thật của người dùng."
        />
        <Columns template="minmax(0,1fr) 330px" gap={24}>
          <section aria-label={`Bảng giá ${regionLabel}`} className="flex min-w-0 flex-col">
            <Tabs
              label="Khu vực"
              param="khu-vuc"
              active={region}
              pathname={BASE}
              items={v.regions.map((r, i) => ({ key: r.key, label: r.label, count: r.count, icon: i === 0 ? 'table' : undefined }))}
            />
            <Table
              cols={cols}
              rows={rows}
              caption="Bảng giá ước tính"
              flush
              highlight={v.selectedIndex >= 0 ? v.selectedIndex : undefined}
              emptyText={`Chưa có bảng giá ${regionLabel}. Ước tính bật khi đủ ${v.minReports} báo giá ở mỗi khu vực.`}
            />
            {v.note ? <Hint>{v.note}</Hint> : null}
          </section>
          {sel ? (
            <Panel as="aside" label={`Sửa bảng giá ${sel.title}`} padding="lg">
              <DetailHeader
                title={sel.title}
                sub={sel.sub}
                trailing={<ProviderMark provider={sel.table.providerId} size={24} />}
              />
              <FareEditor
                key={sel.table.id}
                table={sel.table}
                label={sel.label}
                test={v.test}
                currentText={sel.currentText}
                canEnable={sel.canEnable}
                enableHelp={sel.enableHelp}
                historyHref={hrefFor(sel.table.id, '&lich-su=1')}
              />
            </Panel>
          ) : (
            <Panel as="aside" label="Bảng giá khu vực mới" padding="lg">
              <Callout tone="grey" icon="info" text={`${regionLabel} chưa có bảng giá. App chỉ hiện giá ước tính ở khu vực đã đủ báo giá.`} />
            </Panel>
          )}
        </Columns>
      </PageBody>
      {history && sel ? (
        <Drawer open title={history.title} closeHref={hrefFor(sel.table.id)}>
          {history.items.length ? (
            <List label={history.title}>
              {history.items.map((it) => (
                <ListRow key={it.id} title={it.text} sub={it.time} strong={false} padding={8} />
              ))}
            </List>
          ) : (
            <p className="m-0 text-[14px] text-ink-2">Chưa có lần sửa nào được ghi lại.</p>
          )}
          <Hint className="mt-0">{sel.sub}.</Hint>
        </Drawer>
      ) : null}
    </>
  );
}
