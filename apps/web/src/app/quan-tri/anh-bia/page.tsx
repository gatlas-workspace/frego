// QT 13 · Ảnh bìa Trang chủ app (WebQtAnhBia): danh sách ảnh đã tải, sửa ảnh (khung giờ, lớp phủ, tương phản),
// xem trước trên khung điện thoại. Hết hạn hoặc không có ảnh đang hẹn → app tự dùng ảnh mặc định "Sài Gòn tím".
import type { Metadata } from 'next';
import { formatDateTime, formatNumber, type HomeCoverRowView } from '@frego/core';
import { Button, PageBody, PageHeader, Table, Topbar, type TableColumn, type TableRow } from '@/components/web';
import { adminOpsService } from '@/lib/server/data';
import { CoverEditor } from './_components/CoverEditor';

export const metadata: Metadata = { title: 'Ảnh bìa app' };

type Search = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

const cols: TableColumn[] = [
  { label: 'Ảnh', w: 'minmax(0,1.2fr)' },
  { label: 'Thời gian hiện', w: 'minmax(0,1.3fr)', type: 'text' },
  { label: 'Người sửa', w: 'minmax(0,1fr)', type: 'text' },
  { label: 'Trạng thái', w: '120px' },
];

/** "28/11/2026 00:00" theo giờ VN (ô nhập của form). */
const vnInput = (iso: string) => formatDateTime(iso);

export default async function HomeCoverPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const { svc } = await adminOpsService();
  const rows = await svc.listHomeCovers();
  const pickedId = first(params.anh);
  const isNew = first(params.moi) === '1';
  const cover: HomeCoverRowView | null = isNew ? null : (rows.find((r) => r.id === pickedId) ?? rows[0] ?? null);
  const anyLive = rows.some((r) => r.live);
  const now = svc.db.now();
  const tomorrow = new Date(now.getTime() + 86_400_000);
  const weekLater = new Date(now.getTime() + 8 * 86_400_000);

  const tableRows: TableRow[] = [
    {
      key: 'mac-dinh',
      cells: [
        { text: 'Sài Gòn tím (mặc định)', strong: true },
        'Luôn hiện khi không có ảnh khác',
        'Frego · có sẵn trong app',
        { text: anyLive ? 'Dự phòng' : 'Đang hiện', status: anyLive ? 'grey' : 'green' },
      ],
    },
    ...rows.map((r) => ({
      key: r.id,
      highlight: cover?.id === r.id,
      cells: [
        { text: r.title, strong: true, href: `/quan-tri/anh-bia?anh=${encodeURIComponent(r.id)}`, sub: `Lớp phủ ${formatNumber(r.overlay * 100)}%` },
        r.windowText,
        r.editorText,
        { text: r.label.text, status: r.label.tone },
      ],
    })),
  ];

  return (
    <>
      <Topbar crumbs="Frego / Ảnh bìa app" />
      <PageBody>
        <PageHeader
          title="Ảnh bìa Trang chủ app"
          description='Ảnh nằm sau lời chào "Hôm nay đi đâu?" ở Trang chủ. Mỗi lúc chỉ hiện một ảnh; hết hạn thì app tự quay về ảnh mặc định.'
          actions={
            <Button href="/quan-tri/anh-bia?moi=1" icon="plus">
              Tải ảnh mới
            </Button>
          }
        />
        <section aria-labelledby="ab-ds" className="flex min-w-0 flex-col gap-1.5">
          <h2 id="ab-ds" className="m-0 text-[15px] font-semibold leading-[1.35]">
            Ảnh đã tải
          </h2>
          <Table cols={cols} rows={tableRows} caption="Ảnh bìa Trang chủ" />
        </section>
        <CoverEditor
          key={cover?.id ?? 'moi'}
          cover={cover}
          defaults={{ title: '', startsAt: `${vnInput(tomorrow.toISOString()).slice(0, 10)} 00:00`, endsAt: `${vnInput(weekLater.toISOString()).slice(0, 10)} 23:59` }}
          startsText={cover ? vnInput(cover.startsAt) : ''}
          endsText={cover ? vnInput(cover.endsAt) : ''}
          greeting="Chào Minh Anh"
          walletChip="3 mã · 1.250 điểm"
        />
      </PageBody>
    </>
  );
}
