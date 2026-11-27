// QT 11 · Đối tác và liên kết (WebQtDoiTac): hãng xe; ngân hàng, ví và email người dùng liên kết được trong app.
import type { Metadata } from 'next';
import { PageBody, PageHeader, Section, Table, Topbar, type TableColumn, type TableRow } from '@/components/web';
import { adminOpsService } from '@/lib/server/data';
import { AddPartner } from './_components/AddPartner';

export const metadata: Metadata = { title: 'Đối tác và liên kết' };

const rideCols: TableColumn[] = [
  { label: 'Hãng xe', w: 'minmax(0,0.9fr)' },
  { label: 'Mở app kèm điểm đến', w: 'minmax(0,1.2fr)', type: 'text' },
  { label: 'Mã tài trợ', w: '150px', type: 'status' },
  { label: 'Biết khi mã được dùng', w: 'minmax(0,1.2fr)', type: 'text' },
  { label: 'Hợp đồng', w: '160px', type: 'status' },
];
const payCols: TableColumn[] = [
  { label: 'Đối tác', w: 'minmax(0,1fr)' },
  { label: 'Loại', w: '130px', type: 'text' },
  { label: 'Dùng để', w: 'minmax(0,1.5fr)', type: 'text' },
  { label: 'Người đã liên kết', align: 'right', w: '150px' },
  { label: 'Trong app', w: '130px' },
];

export default async function PartnersPage() {
  const { svc } = await adminOpsService();
  const v = await svc.getPartnersAdmin();

  const rideRows: TableRow[] = v.providers.map((p) => ({
    key: p.id,
    cells: [
      { text: p.name, logo: p.id, strong: true },
      { text: p.prefill.text, sub: p.prefill.sub },
      { text: p.sponsor.text, status: p.sponsor.tone },
      { text: p.usage.text, sub: p.usage.sub },
      { text: p.contract.text, status: p.contract.tone },
    ],
  }));
  const payRows: TableRow[] = v.payments.map((p) => ({
    key: p.id,
    cells: [{ text: p.name, strong: true }, p.kindText, p.purpose, p.linkedText, { text: p.inApp.text, status: p.inApp.tone }],
  }));

  return (
    <>
      <Topbar crumbs="Frego / Đối tác, liên kết" />
      <PageBody>
        <PageHeader
          title="Đối tác và liên kết"
          description="Hãng xe, ngân hàng, ví và email mà app cho người dùng liên kết. Frego chỉ lưu tên ngân hàng, loại thẻ và tên ví, không lưu số thẻ hay mật khẩu."
        />
        <Section title="Hãng xe" id="dt-hang">
          <Table cols={rideCols} rows={rideRows} caption="Hãng xe" />
        </Section>
        <Section title="Ngân hàng, ví và email" id="dt-tt" action={<AddPartner />}>
          <Table cols={payCols} rows={payRows} caption="Ngân hàng, ví và email" emptyText="Chưa có đối tác nào." />
        </Section>
      </PageBody>
    </>
  );
}
