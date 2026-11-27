import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { parseServiceKey, type DealView } from '@frego/core';
import { useTripFlow } from '@/lib/trip-flow';

const START_ERROR = 'Chưa mở được chuyến tới điểm này. Thử lại sau giây lát.';

/**
 * Bắt đầu luồng chính từ một điểm đến:
 * - `go(placeId)`: lập kế hoạch rồi sang bước Gắn voucher.
 * - `goDeal(deal)`: thẻ tài trợ ở Trang chủ → gắn sẵn mã đó, đi thẳng tới So giá đúng tab loại xe.
 * Chặn bấm hai lần khi đang lập kế hoạch.
 */
export function useStartTrip() {
  const { start, setVehicleClass } = useTripFlow();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lock = useRef(false);

  const run = useCallback(async (id: string, task: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusyId(id);
    setError(null);
    try {
      await task();
    } catch {
      setError(START_ERROR);
    } finally {
      lock.current = false;
      setBusyId(null);
    }
  }, []);

  const go = useCallback(
    (placeId: string) =>
      run(placeId, async () => {
        await start(placeId);
        router.push('/chuyen/gan-voucher');
      }),
    [run, start],
  );

  const goDeal = useCallback(
    (deal: DealView) =>
      run(deal.campaignId, async () => {
        const plan = await start(deal.destPlaceId, { preferredCampaignId: deal.campaignId });
        // Mở đúng tab loại xe của mã tài trợ (ưu đãi chưa nhận, hoặc mã cùng quán đã có trong ví).
        const match =
          plan.evaluation.eligible.find((e) => e.offer.refId === `cp:${deal.campaignId}`) ??
          plan.evaluation.eligible.find((e) => e.offer.source === 'sponsor' && e.offer.label === deal.brand);
        if (match) setVehicleClass(parseServiceKey(match.service).vehicleClass);
        router.push('/chuyen/so-gia');
      }),
    [run, start, setVehicleClass],
  );

  return { go, goDeal, busyId, error };
}
