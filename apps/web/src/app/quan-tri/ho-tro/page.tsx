// QT 12 · Hỗ trợ và nhật ký (WebQtHoTro): yêu cầu hỗ trợ, nhật ký truy cập dữ liệu hôm nay, quản trị viên và quyền.
import type { Metadata } from 'next';
import { DATA_DELETION_DAYS, type TicketFilter } from '@frego/core';
import {
  Button,
  Callout,
  Columns,
  Drawer,
  KeyValue,
  KeyValueList,
  List,
  ListRow,
  PageBody,
  PageHeader,
  Panel,
  Status,
  SubHeading,
  Table,
  Tabs,
  Timeline,
  Topbar,
  type TableColumn,
  type TableRow,
} from '@/components/web';
import { adminOpsService } from '@/lib/server/data';
import { setTicketStatusAction } from './actions';

export const metadata: Metadata = { title: 'Hỗ trợ và nhật ký' };

type Search = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const FILTERS: TicketFilter[] = ['all', 'open', 'done'];
const BASE = '/quan-tri/ho-tro';

const cols: TableColumn[] = [
  { label: 'Yêu cầu', w: 'minmax(0,1.6fr)' },
  { label: 'Từ', w: 'minmax(0,1fr)', type: 'person' },
  { label: 'Nhóm', w: '130px', type: 'status' },
  { label: 'Gửi lúc', w: '120px' },
  { label: 'Trạng thái', w: '140px' },
];

export default async function SupportPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const loc = first(params.loc);
  const filter: TicketFilter = FILTERS.includes(loc as TicketFilter) ? (loc as TicketFilter) : 'all';
  const chosen = first(params['yeu-cau']);

  const { svc } = await adminOpsService();
  const v = await svc.getSupport(filter, chosen);
  const listHref = filter === 'all' ? BASE : `${BASE}?loc=${filter}`;
  const ticketHref = (id: string) => `${BASE}?loc=${filter}&yeu-cau=${encodeURIComponent(id)}`;
  const sel = v.selected;

  const rows: TableRow[] = v.rows.map((t) => ({
    key: t.id,
    highlight: t.id === sel?.id,
    cells: [
      { text: t.subject, sub: t.sub, strong: true, href: ticketHref(t.id) },
      { text: t.requester, sub: t.requesterKindText },
      { text: t.topic.text, status: t.topic.tone },
      { text: t.timeText, muted: true },
      { text: t.label.text, status: t.label.tone },
    ],
  }));

  const statusButton = (status: 'open' | 'pending' | 'done', label: string, variant: 'primary' | 'secondary') =>
    sel ? (
      <form action={setTicketStatusAction} key={status}>
        <input type="hidden" name="id" value={sel.id} />
        <input type="hidden" name="status" value={status} />
        <Button type="submit" variant={variant} icon={status === 'done' ? 'check' : 'none'}>
          {label}
        </Button>
      </form>
    ) : null;

  return (
    <>
      <Topbar crumbs="Frego / Hỗ trợ và nhật ký" />
      <PageBody>
        <PageHeader
          title="Hỗ trợ và nhật ký"
          description="Yêu cầu từ người dùng và doanh nghiệp, nhật ký truy cập dữ liệu và quyền của từng quản trị viên."
        />
        <Columns template="minmax(0,1fr) 360px" gap={24}>
          <div className="flex min-w-0 flex-col gap-4">
            <section aria-label="Yêu cầu hỗ trợ" className="flex min-w-0 flex-col">
              <Tabs
                label="Yêu cầu hỗ trợ"
                param="loc"
                toolbar
                active={filter}
                pathname={BASE}
                items={[
                  { key: 'all', label: 'Tất cả', count: v.counts.all, icon: 'table' },
                  { key: 'open', label: 'Đang mở', count: v.counts.open },
                  { key: 'done', label: 'Đã xong', count: v.counts.done },
                ]}
              />
              <Table cols={cols} rows={rows} caption="Yêu cầu hỗ trợ" flush emptyText="Không có yêu cầu nào." />
            </section>
            <Callout
              tone="blue"
              icon="info"
              text={`Yêu cầu xóa dữ liệu phải xong trong ${DATA_DELETION_DAYS} ngày. Xóa tài khoản sẽ xóa lịch sử chuyến và điểm, giữ lại số liệu tổng đã gộp ẩn danh.`}
            />
          </div>
          <Panel as="aside" title="Nhật ký truy cập hôm nay" id="ht-nk" gap={10}>
            {v.log.length ? (
              <Timeline
                label="Nhật ký truy cập hôm nay"
                timeWidth={44}
                items={v.log.map((l) => ({
                  key: l.id,
                  time: l.time,
                  text: (
                    <>
                      <b className="font-medium">{l.actor}</b> · {l.action}
                    </>
                  ),
                }))}
              />
            ) : (
              <p className="m-0 text-[13px] text-ink-2">Hôm nay chưa có ai truy cập dữ liệu.</p>
            )}
            <SubHeading className="mt-1">Quản trị viên và quyền</SubHeading>
            <List label="Quản trị viên và quyền">
              {v.roles.map((r) => (
                <ListRow
                  key={r.role}
                  padding={8}
                  title={
                    <span className="flex flex-wrap items-center gap-x-2">
                      <span className="whitespace-nowrap">{r.label}</span>
                      <span className="whitespace-nowrap font-normal text-ink-2">· {r.countText}</span>
                    </span>
                  }
                  trailing={<Status text={r.scope} tone="grey" shape="tag" />}
                />
              ))}
            </List>
          </Panel>
        </Columns>
      </PageBody>
      {sel ? (
        <Drawer
          open
          title={`Yêu cầu ${sel.number}`}
          closeHref={listHref}
          footer={
            sel.status === 'done' ? (
              statusButton('open', 'Mở lại', 'secondary')
            ) : (
              <>
                {sel.status === 'open' ? statusButton('pending', 'Nhận xử lý', 'secondary') : null}
                {statusButton('done', 'Đánh dấu đã xong', 'primary')}
              </>
            )
          }
        >
          <div className="flex flex-col gap-1">
            <span className="text-[15px] font-semibold">{sel.subject}</span>
            <span>
              <Status text={sel.label.text} tone={sel.label.tone} />
            </span>
          </div>
          <KeyValueList>
            <KeyValue label="Từ">
              {sel.requester} <span className="font-normal text-ink-2">· {sel.requesterKindText}</span>
            </KeyValue>
            <KeyValue label="Nhóm">
              <Status text={sel.topic.text} tone={sel.topic.tone} />
            </KeyValue>
            <KeyValue label="Gửi lúc">
              {sel.createdText} <span className="font-normal text-ink-2">· {sel.timeText}</span>
            </KeyValue>
            {sel.dueText ? <KeyValue label="Hạn xử lý">{sel.dueText}</KeyValue> : null}
          </KeyValueList>
          {sel.dueText && sel.status !== 'done' ? (
            <Callout tone="amber" icon="clock" text={`Phải xong trước ${sel.dueText}.`} />
          ) : null}
        </Drawer>
      ) : null}
    </>
  );
}
