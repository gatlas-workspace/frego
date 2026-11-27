/**
 * Trạng thái luồng chính dùng chung giữa các màn:
 * Chọn điểm đến (1b) → Gắn voucher (2) → So giá (2b) → [Quảng cáo nhà tài trợ (2c)] → Mở app hãng (3) → Báo giá (4).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { OfferPriority, OpenAppView, Selection, SponsorAdView, TripPlan, VehicleClass } from '@frego/core';
import { useApi } from './api';

/** Cách ưu tiên tự gắn mã người dùng chọn lần trước (nhớ trên máy). */
const PRIORITY_KEY = 'frego.offerPriority.v1';
const PRIORITIES: OfferPriority[] = ['discount', 'nearest', 'expiring'];

interface TripFlowValue {
  plan: TripPlan | null;
  selection: Selection;
  vehicleClass: VehicleClass;
  openView: OpenAppView | null;
  /** Popup quảng cáo cho hãng vừa chọn (null: không có mã của quán tài trợ) */
  sponsorAd: SponsorAdView | null;
  /** Cách ưu tiên tự gắn mã và xếp danh sách (Giảm nhiều nhất / Quán gần nhất / Sắp hết hạn) */
  priority: OfferPriority;
  /** Lập kế hoạch tới điểm đến (placeId hoặc "biz:<id>"). preferredCampaignId: bấm từ thẻ tài trợ ở trang chủ. */
  start(destId: string, opts?: { preferredCampaignId?: string | null }): Promise<TripPlan>;
  setSelection(sel: Selection): void;
  setVehicleClass(v: VehicleClass): void;
  setOpenView(v: OpenAppView | null): void;
  setSponsorAd(ad: SponsorAdView | null): void;
  /** Đổi cách ưu tiên: gắn lại mã của chuyến hiện tại theo cách mới và nhớ cho lần sau. */
  setPriority(p: OfferPriority): void;
  reset(): void;
}

const Ctx = createContext<TripFlowValue | null>(null);

export function TripFlowProvider({ children }: { children: ReactNode }) {
  const { svc } = useApi();
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [selection, setSelection] = useState<Selection>({});
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>('bike');
  const [openView, setOpenView] = useState<OpenAppView | null>(null);
  const [sponsorAd, setSponsorAd] = useState<SponsorAdView | null>(null);
  const [priority, setPriorityState] = useState<OfferPriority>('discount');

  useEffect(() => {
    AsyncStorage.getItem(PRIORITY_KEY)
      .then((v) => {
        if (v && (PRIORITIES as string[]).includes(v)) setPriorityState(v as OfferPriority);
      })
      .catch(() => {});
  }, []);

  /** Gắn mã theo cách ưu tiên; mã của thẻ tài trợ vừa bấm (nếu có) luôn được giữ. */
  const selectionFor = useCallback(
    (p: TripPlan, prio: OfferPriority, preferredCampaignId?: string | null): Selection => {
      const sel = prio === 'discount' ? { ...p.selection } : svc.autoSelection(p, prio);
      const pref = preferredCampaignId ? p.evaluation.eligible.find((e) => e.offer.campaignId === preferredCampaignId) : null;
      if (pref) sel[pref.service] = pref.offer.refId;
      return sel;
    },
    [svc],
  );

  const start = useCallback<TripFlowValue['start']>(
    async (destId, opts) => {
      const p = await svc.planTrip(destId, opts);
      setPlan(p);
      setSelection(selectionFor(p, priority, opts?.preferredCampaignId));
      setOpenView(null);
      setSponsorAd(null);
      // Bấm thẻ tài trợ: mở sẵn tab loại xe của mã đó.
      const pref = opts?.preferredCampaignId
        ? p.evaluation.eligible.find((e) => e.offer.campaignId === opts.preferredCampaignId)
        : null;
      setVehicleClass(pref ? (pref.service.split('-')[1] as VehicleClass) : 'bike');
      return p;
    },
    [svc, priority, selectionFor],
  );

  const setPriority = useCallback(
    (p: OfferPriority) => {
      setPriorityState(p);
      AsyncStorage.setItem(PRIORITY_KEY, p).catch(() => {});
      if (plan) setSelection(selectionFor(plan, p, plan.preferredCampaignId));
    },
    [plan, selectionFor],
  );

  const reset = useCallback(() => {
    setPlan(null);
    setSelection({});
    setOpenView(null);
    setSponsorAd(null);
  }, []);

  return (
    <Ctx.Provider
      value={{
        plan,
        selection,
        vehicleClass,
        openView,
        sponsorAd,
        priority,
        start,
        setSelection,
        setVehicleClass,
        setOpenView,
        setSponsorAd,
        setPriority,
        reset,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTripFlow() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTripFlow phải nằm trong <TripFlowProvider>');
  return v;
}
