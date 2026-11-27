import { useQuery } from '@tanstack/react-query';
import { useWindowDimensions } from 'react-native';
import { DEST_RING_M, type VehicleClass } from '@frego/core';
import { MapSurface } from '@/components/map/MapSurface';
import { MapRoute } from '@/components/ui';
import { useApi } from '@/lib/api';
import { useTripFlow } from '@/lib/trip-flow';

/** Tấm trượt che phần dưới màn: chừa ra khi canh khung để đường đi nằm ở phần còn thấy. */
const SHEET_SHARE = 0.62;

/**
 * Nền bản đồ thật phía sau tấm trượt (màn 2c Quảng cáo, 3 Mở app): cùng bản đồ như Gắn voucher / So giá — đường đi theo
 * loại xe đã chọn, vòng 1 km, ghim quán có voucher dùng được — nhưng chỉ để xem (không kéo, không chạm).
 * Dùng lại cache truy vấn của MapHeader nên không hỏi máy chủ tìm đường thêm lần nào.
 */
export function TripMapBackdrop({ vehicleClass }: { vehicleClass: VehicleClass }) {
  const { svc } = useApi();
  const { plan } = useTripFlow();
  const { height } = useWindowDimensions();

  const routeLine = useQuery({
    queryKey: ['route-line', plan?.origin.lat, plan?.origin.lng, plan?.dest.id, vehicleClass],
    queryFn: () => svc.routeLine(plan!, vehicleClass),
    enabled: !!plan,
    staleTime: Infinity,
  });
  const sponsors = useQuery({
    queryKey: ['usable-sponsors', plan?.dest.id, plan?.at],
    queryFn: () => svc.usableSponsors(plan!),
    enabled: !!plan,
  });

  if (!plan) return <MapRoute height="100%" labels={false} />;
  const originName = plan.title.split(' → ')[0] ?? plan.origin.label;
  return (
    <MapSurface
      origin={{
        lat: plan.origin.lat,
        lng: plan.origin.lng,
        label: plan.origin.label === 'Vị trí hiện tại' ? 'Vị trí của bạn' : originName,
      }}
      dest={{ lat: plan.dest.lat, lng: plan.dest.lng, label: plan.dest.name }}
      route={routeLine.data ?? plan.route}
      sponsors={sponsors.data ?? []}
      nearbyRadiusM={DEST_RING_M}
      selectedId={null}
      onSelect={() => {}}
      bottomInset={Math.round(height * SHEET_SHARE)}
      fitKey="nen"
      interactive={false}
      attributionBottom={Math.round(height * SHEET_SHARE) + 4}
    />
  );
}
