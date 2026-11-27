// QT 9 · Thông báo (WebQtThongBao): loại tin khớp Cài đặt thông báo của app, soạn tin ưu đãi chung có xem trước, "Hẹn gửi".
import type { Metadata } from 'next';
import {
  Callout,
  Columns,
  Divider,
  List,
  ListRow,
  PageBody,
  PageHeader,
  Panel,
  Section,
  Status,
  SubHeading,
  Table,
  Topbar,
  type TableColumn,
  type TableRow,
} from '@/components/web';
import { PROMO_BROADCASTS_PER_WEEK } from '@frego/core';
import { adminOpsService } from '@/lib/server/data';
import { Composer } from './_components/Composer';

export const metadata: Metadata = { title: 'Thông báo' };

const cols: TableColumn[] = [
  { label: 'Loại tin', w: 'minmax(0,1fr)' },
  { label: 'Gửi khi', w: 'minmax(0,1.5fr)', type: 'text' },
  { label: 'Đã gửi', align: 'right', w: '84px' },
  { label: 'Mở', align: 'right', w: '64px' },
  { label: 'Tắt', align: 'right', w: '64px' },
  { label: 'Trạng thái', w: '112px' },
];

export default async function NotificationsPage() {
  const { svc } = await adminOpsService();
  const v = await svc.getNotificationsAdmin();
  const now = svc.db.now().toISOString();

  const rows: TableRow[] = v.types.map((t) => ({
    key: t.key,
    cells: [{ text: t.title, strong: true }, t.trigger, t.sentText, t.openText, t.offText, { text: t.label.text, status: t.label.tone }],
  }));

  return (
    <>
      <Topbar crumbs="Frego / Thông báo" />
      <PageBody>
        <PageHeader
          title="Thông báo"
          description={`Các loại tin khớp với mục Cài đặt thông báo trong app. Tin tự động gửi theo sự kiện, tin ưu đãi chung soạn tay và tối đa ${PROMO_BROADCASTS_PER_WEEK} tin mỗi tuần.`}
        />
        <Columns template="minmax(0,1fr) 340px" gap={24}>
          <Section title="Loại tin" id="tb-loai">
            <Table cols={cols} rows={rows} caption="Loại thông báo" />
            <Callout text={v.quietNote} tone="grey" icon="clock" className="mt-1.5" />
          </Section>
          <Panel
            as="aside"
            title="Soạn tin ưu đãi chung"
            id="tb-soan"
            action={<Status text={v.weekly.label.text} tone={v.weekly.label.tone} />}
          >
            <Composer draft={v.draft} audience={v.audience} now={now} />
            {v.scheduled.length ? (
              <>
                <Divider />
                <SubHeading>Tin đã hẹn</SubHeading>
                <List label="Tin đã hẹn">
                  {v.scheduled.map((b) => (
                    <ListRow key={b.id} icon="clock" title={b.title} sub={`${b.whenText} · ${b.recipientsText}`} padding={8} />
                  ))}
                </List>
              </>
            ) : null}
          </Panel>
        </Columns>
      </PageBody>
    </>
  );
}
