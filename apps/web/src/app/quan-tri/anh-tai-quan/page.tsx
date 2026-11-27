// Ảnh tại quán (UI v3 · GĐ 5b): hàng chờ duyệt ảnh người dùng chụp tại quán tài trợ sau chuyến dùng mã của quán.
// Duyệt thì cộng 50 điểm (sổ điểm) và báo người dùng; từ chối cần lý do. Ảnh nằm ở kho riêng, xem bằng URL ký 1 giờ.
import type { Metadata } from 'next';
import { POINTS_RULES, SHOP_PHOTO_RULES } from '@frego/core';
import { Callout, KeyValue, KeyValueList, PageBody, PageHeader, Panel, Status, Tabs, Topbar } from '@/components/web';
import { adminOpsService } from '@/lib/server/data';
import { PhotoDecision } from './_components/PhotoDecision';

export const metadata: Metadata = { title: 'Ảnh tại quán' };

type Search = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function ShopPhotoQueuePage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const filter = first(params.tab) === 'all' ? 'all' : 'pending';
  const { svc } = await adminOpsService();
  const v = await svc.listShopPhotos(filter);

  return (
    <>
      <Topbar crumbs="Frego / Ảnh tại quán" />
      <PageBody>
        <PageHeader
          title="Ảnh tại quán"
          description={`Người dùng chụp ảnh tại quán tài trợ trong ${SHOP_PHOTO_RULES.windowHours} giờ sau chuyến dùng mã của quán, cách quán tối đa ${SHOP_PHOTO_RULES.maxDistanceM} m. Duyệt thì cộng ${POINTS_RULES.shopPhoto} điểm. Quán không thấy ảnh hay người chụp.`}
        />
        <section aria-label="Ảnh tại quán" className="flex min-w-0 flex-col gap-3">
          <Tabs
            label="Lọc ảnh"
            toolbar
            active={filter}
            pathname="/quan-tri/anh-tai-quan"
            items={[
              { key: 'pending', label: 'Chờ duyệt', count: v.pendingCount },
              { key: 'all', label: 'Tất cả' },
            ]}
          />
          {v.rows.length === 0 ? (
            <Callout tone="grey" icon="check" text={filter === 'pending' ? 'Không có ảnh nào chờ duyệt.' : 'Chưa có ảnh tại quán.'} />
          ) : (
            <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4 p-0">
              {v.rows.map((p) => (
                <li key={p.id} className="min-w-0">
                  <Panel label={`Ảnh tại ${p.shopName}`} gap={12}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-col">
                        <span className="text-[15px] font-semibold">{p.shopName}</span>
                        <span className="text-[13px] text-ink-2">{p.shopAddress}</span>
                      </div>
                      <Status text={p.label.text} tone={p.label.tone} />
                    </div>
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-frame bg-grey shadow-frame">
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- URL ký có hạn của kho riêng (DEMO: data URL)
                        <img src={p.imageUrl} alt={`Ảnh người dùng chụp tại ${p.shopName}`} className="block size-full object-cover" />
                      ) : (
                        <div className="flex size-full items-center justify-center p-4 text-center text-[13px] text-ink-2">
                          Không tải được ảnh (ảnh mẫu hoặc tệp đã bị xóa khỏi kho).
                        </div>
                      )}
                    </div>
                    <KeyValueList>
                      <KeyValue label="Người chụp">{p.userText}</KeyValue>
                      <KeyValue label="Vị trí">{p.distanceText}</KeyValue>
                      <KeyValue label="Giờ chụp">{p.takenText}</KeyValue>
                      {p.tripText ? <KeyValue label="Chuyến">{p.tripText}</KeyValue> : null}
                      <KeyValue label="Gửi lúc">{p.submittedText.replace('Gửi ', '')}</KeyValue>
                      {p.reviewedText ? <KeyValue label="Người duyệt">{p.reviewedText}</KeyValue> : null}
                      {p.rejectReason ? <KeyValue label="Lý do từ chối">{p.rejectReason}</KeyValue> : null}
                    </KeyValueList>
                    {p.status === 'pending' ? <PhotoDecision id={p.id} label={`Duyệt ảnh tại ${p.shopName}`} /> : null}
                  </Panel>
                </li>
              ))}
            </ul>
          )}
        </section>
      </PageBody>
    </>
  );
}
