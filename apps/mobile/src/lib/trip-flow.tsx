/**
 * Trạng thái luồng chính dùng chung giữa các màn:
 * Chọn điểm đến (1b) → Gắn voucher (2) → So giá (2b) → Mở app hãng (3) → Báo giá (4).
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { OpenAppView, Selection, TripPlan, VehicleClass } from '@frego/core';
import { useApi } from './api';

interface TripFlowValue {
  plan: TripPlan | null;
  selection: Selection;
  vehicleClass: VehicleClass;
  openView: OpenAppView | null;
  /** Lập kế hoạch tới điểm đến (placeId hoặc "biz:<id>"). preferredCampaignId: bấm từ thẻ tài trợ ở trang chủ. */
  start(destId: string, opts?: { preferredCampaignId?: string | null }): Promise<TripPlan>;
  setSelection(sel: Selection): void;
  setVehicleClass(v: VehicleClass): void;
  setOpenView(v: OpenAppView | null): void;
  reset(): void;
}

const Ctx = createContext<TripFlowValue | null>(null);

export function TripFlowProvider({ children }: { children: ReactNode }) {
  const { svc } = useApi();
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [selection, setSelection] = useState<Selection>({});
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>('bike');
  const [openView, setOpenView] = useState<OpenAppView | null>(null);

  const start = useCallback<TripFlowValue['start']>(
    async (destId, opts) => {
      const p = await svc.planTrip(destId, opts);
      setPlan(p);
      setSelection(p.selection);
      setOpenView(null);
      // Bấm thẻ tài trợ: mở sẵn tab loại xe của mã đó.
      const pref = opts?.preferredCampaignId
        ? p.evaluation.eligible.find((e) => e.offer.refId === `cp:${opts.preferredCampaignId}` || e.offer.refId.startsWith('uv:'))
        : null;
      setVehicleClass(pref ? (pref.service.split('-')[1] as VehicleClass) : 'bike');
      return p;
    },
    [svc],
  );

  const reset = useCallback(() => {
    setPlan(null);
    setSelection({});
    setOpenView(null);
  }, []);

  return (
    <Ctx.Provider value={{ plan, selection, vehicleClass, openView, start, setSelection, setVehicleClass, setOpenView, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export function useTripFlow() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTripFlow phải nằm trong <TripFlowProvider>');
  return v;
}
