/**
 * Dịch vụ cho app người dùng (apps/mobile). Chạy trên Db bất kỳ (DEMO hoặc Supabase).
 * Mọi chuỗi hiển thị (giá, HSD, nhãn) được tính ở đây để app và web hiện giống nhau.
 */
import { brand } from '../brand';
import {
  CATEGORY_LABEL,
  PROVIDERS,
  SERVICES,
  VEHICLE_ORDER,
  VEHICLE_TABS,
  parseServiceKey,
  serviceFullLabel,
  serviceLongLabel,
  serviceShortLabel,
} from '../catalog';
import type { Db } from '../db/types';
import {
  formatDate,
  formatDayGroup,
  formatDayMonth,
  formatDiscount,
  formatDiscountShort,
  formatKm,
  formatMeters,
  formatNumber,
  formatRelative,
  formatTime,
  formatVnd,
  formatVndRange,
  initials,
  maskPhone,
} from '../format';
import { distanceM, estimateRoute, type LatLng } from '../geo';
import { isPeak } from '../pricing';
import type {
  AppNotification,
  AttachedCode,
  BusinessPublic,
  CampaignPublic,
  CategoryKey,
  Consents,
  NotificationPrefs,
  Partner,
  Place,
  PriceVerdict,
  Profile,
  ProviderId,
  PublicCode,
  SavedPlaceKind,
  ServiceKey,
  Trip,
  UserVoucher,
  VehicleClass,
} from '../types';
import {
  attachCtaText,
  comparePrices,
  evaluateOffers,
  selectedOffers,
  type CodeOffer,
  type EligibleOffer,
  type OfferEvaluation,
  type PriceRow,
  type Selection,
  type TripContext,
} from '../vouchers';

/* ───────────────────────── Kiểu dữ liệu màn hình ───────────────────────── */

export interface PlaceView {
  id: string;
  name: string;
  address: string;
  /** "5,8 km" từ điểm đón */
  distanceText: string;
  /** "3 voucher" hoặc "" */
  voucherChip: string;
  voucherCount: number;
}

export interface SavedPlaceView {
  id: string;
  kind: SavedPlaceKind;
  label: string;
  placeId: string;
  icon: 'home' | 'brief' | 'pin';
}

export interface DealView {
  campaignId: string;
  businessId: string;
  category: CategoryKey;
  /** "Gần Chợ Bến Thành" */
  area: string;
  brand: string;
  /** "Mã Grab ô tô" */
  serviceText: string;
  amountText: string;
  cta: string;
  /** Điểm đến khi bấm (địa điểm gần quán nhất) */
  destPlaceId: string;
}

export interface BannerView {
  chip: string;
  title: string;
  sub: string;
  ticketAmount: string;
  ticketService: string;
  /** Đường dẫn khi bấm */
  link: string;
}

export interface HomeView {
  banner: BannerView | null;
  originLabel: string;
  savedPlaces: SavedPlaceView[];
  recent: PlaceView[];
  deals: DealView[];
  unreadCount: number;
}

export interface TripPlan {
  origin: { label: string; placeId: string | null } & LatLng;
  dest: Place;
  km: number;
  minutes: number;
  at: string;
  peak: boolean;
  /** "Landmark 81 → Chợ Bến Thành" */
  title: string;
  /** "5,8 km · khoảng 20 phút" */
  subtitle: string;
  evaluation: OfferEvaluation;
  /** Lựa chọn tự gắn (mã giảm nhiều nhất mỗi nhóm) */
  selection: Selection;
  /** id chiến dịch được bấm từ trang chủ (ưu tiên gắn) */
  preferredCampaignId: string | null;
}

export interface AttachItemView {
  refId: string;
  service: ServiceKey;
  logo: CategoryKey | 'frego' | ProviderId;
  tag: 'sponsor' | 'frego' | 'public';
  name: string;
  amountText: string;
  serviceText: string;
  conditionLine: string;
  metaText: string;
  attached: boolean;
}

export interface ComparisonView {
  tabs: { key: VehicleClass; label: string; icon: 'bike' | 'car' | 'suv' }[];
  vehicleClass: VehicleClass;
  rows: PriceRow[];
  insight: string | null;
  /** "Đã gắn 3 voucher" */
  attachedTitle: string;
  /** "FREGO10 · Cà phê Mây · Quán bún Ngõ Nhỏ" */
  attachedLine: string;
  /** "17:40 là giờ cao điểm, khoảng giá đã nới rộng. Giá cuối cùng do app hãng hiển thị." */
  peakNote: string | null;
}

export interface OpenAppView {
  trip: Trip;
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  title: string;
  serviceLine: string;
  estimateText: string;
  code: string | null;
  codeLine: string | null;
  prefillsDestination: boolean;
  /** Địa chỉ để chép/dán khi app hãng không nhận điểm đến qua link */
  destAddress: string;
  /** Link mở app hãng (Grab: mở sẵn điểm đến) */
  deepLink: string;
  storeUrl: string;
  /** Bước 1 trên màn Mở app: [phần đậm, phần thường] */
  step1: [string, string];
}

export interface WalletGiftView {
  id: string;
  source: 'sponsor' | 'frego';
  logo: CategoryKey | 'frego';
  tag: 'sponsor' | 'frego';
  title: string;
  amountText: string;
  serviceText: string;
  line: string;
  metaText: string;
  action: string;
  /** Điều hướng khi bấm */
  link: string;
}

export interface PublicCodeCardView {
  id: string;
  logo: ProviderId;
  brandLine: string;
  code: string;
  title: string;
  okText: string;
  warnText: string;
  plainText: string;
  plainText2: string;
  metaText: string;
  /** Cần thẻ/ví người dùng chưa có */
  otherCard: boolean;
}

export interface AutoPromoView {
  providerId: ProviderId;
  brandLine: string;
  title: string;
  metaText: string;
}

export interface UsedVoucherView {
  id: string;
  title: string;
  amountText: string;
  serviceText: string;
  usedText: string;
}

export interface WalletView {
  gifts: WalletGiftView[];
  publicCodes: PublicCodeCardView[];
  autoPromos: AutoPromoView[];
  used: UsedVoucherView[];
}

export interface VoucherDetailView {
  voucher: UserVoucher;
  businessName: string;
  businessAddress: string;
  /** Địa danh gần quán ("Chợ Bến Thành") để vẽ trên bản đồ vùng áp dụng */
  landmark: string | null;
  category: CategoryKey | 'frego';
  amountText: string;
  serviceText: string;
  expiresText: string;
  reasons: string[];
  radiusText: string;
  area: (LatLng & { radiusM: number }) | null;
  conditions: string[];
}

export interface PublicCodeDetailView {
  code: PublicCode;
  providerName: string;
  fits: boolean;
  fitText: string | null;
  missingText: string | null;
  conditions: string[];
  expiryNote: string;
  sourceHost: string;
  sourceTitle: string;
  checkedText: string;
  reportsText: string;
  reportsSub: string;
  myVote: boolean | null;
}

export interface RewardView {
  id: string;
  providerId: ProviderId;
  kind: 'bike' | 'car' | 'suv';
  amountText: string;
  serviceText: string;
  cost: number;
  costText: string;
  canRedeem: boolean;
  shortText: string;
}

export interface PointsView {
  points: number;
  pointsText: string;
  progressText: string;
  progress: number;
  rewards: RewardView[];
  history: { id: string; deltaText: string; reason: string; dateText: string }[];
}

export interface TripHistoryItem {
  id: string;
  group: string;
  time: string;
  status: 'pending' | 'viewed' | 'reported' | 'opened';
  chip: string;
  title: string;
  line: string;
  paidText: string | null;
  pointsText: string | null;
}

export interface MeView {
  profile: Profile;
  initials: string;
  maskedPhone: string;
  pointsText: string;
  savedText: string;
  savedSub: string;
  pendingReports: number;
  usableVouchers: number;
  linkedSummary: string;
  notifOnCount: number;
  locationOn: boolean;
}

export interface LinkRowView {
  partnerId: string;
  kind: Partner['kind'];
  name: string;
  mono: string;
  desc: string;
  linked: boolean;
  isRideApp: boolean;
}

export interface NotificationView extends AppNotification {
  unread: boolean;
  metaText: string;
  group: 'today' | 'earlier';
}

/* ───────────────────────── Dịch vụ ───────────────────────── */

const VEHICLE_KIND: Record<VehicleClass, 'bike' | 'car' | 'suv'> = { bike: 'bike', car4: 'car', car7: 'suv' };

export function createUserService(db: Db) {
  const me = () => {
    const id = db.currentUserId();
    if (!id) throw new Error('Cần đăng nhập');
    return id;
  };
  const nowIso = () => db.now().toISOString();

  async function placesById() {
    const all = await db.list('places');
    return new Map(all.map((p) => [p.id, p]));
  }

  async function activeCampaigns(): Promise<(CampaignPublic & { business: BusinessPublic })[]> {
    const [camps, bizs] = await Promise.all([
      db.list('campaigns_public', { where: { offering: true } }),
      db.list('businesses_public', { where: { status: 'active' } }),
    ]);
    const byId = new Map(bizs.map((b) => [b.id, b]));
    return camps.filter((c) => byId.has(c.businessId)).map((c) => ({ ...c, business: byId.get(c.businessId)! }));
  }

  /** Vị trí hiện tại. DEMO: gần Landmark 81 (khớp thiết kế). */
  async function currentOrigin(): Promise<{ label: string; placeId: string | null } & LatLng> {
    const lm = await db.get('places', 'landmark81');
    return { label: 'Vị trí hiện tại', placeId: 'landmark81', lat: lm?.lat ?? 10.7949, lng: lm?.lng ?? 106.7219 };
  }

  function countVouchersFor(place: Place, camps: (CampaignPublic & { business: BusinessPublic })[]) {
    return camps.filter((c) => distanceM(place, c.business) <= c.radiusM).length;
  }

  async function toPlaceViews(list: Place[], origin: LatLng & { placeId: string | null }) {
    const camps = await activeCampaigns();
    return list.map((p) => {
      const n = countVouchersFor(p, camps);
      const route = estimateRoute({ ...origin, id: origin.placeId ?? undefined }, p);
      return {
        id: p.id,
        name: p.name,
        address: p.address,
        distanceText: formatKm(route.km),
        voucherChip: n > 0 ? `${n} voucher` : '',
        voucherCount: n,
      } satisfies PlaceView;
    });
  }

  async function myVouchers(): Promise<UserVoucher[]> {
    const uid = me();
    const list = await db.list('user_vouchers', { where: { userId: uid } });
    const t = db.now().getTime();
    return list.map((v) =>
      v.status === 'active' && new Date(v.expiresAt).getTime() < t ? { ...v, status: 'expired' as const } : v,
    );
  }

  async function linkedPartnerIds(): Promise<string[]> {
    const rows = await db.list('linked_accounts', { where: { userId: me() } });
    return rows.map((r) => r.partnerId);
  }

  async function buildOffers(): Promise<CodeOffer[]> {
    const [vouchers, camps, publicCodes, partners] = await Promise.all([
      myVouchers(),
      activeCampaigns(),
      db.list('public_codes', { where: { status: 'live' } }),
      db.list('partners'),
    ]);
    const partnerName = new Map(partners.map((p) => [p.id, p.name]));
    const campById = new Map(camps.map((c) => [c.id, c]));
    const offers: CodeOffer[] = [];
    const heldCampaigns = new Set<string>();

    for (const v of vouchers.filter((x) => x.status === 'active')) {
      if (v.source === 'sponsor' && v.campaignId) {
        const c = campById.get(v.campaignId);
        if (!c) continue;
        heldCampaigns.add(c.id);
        offers.push({
          refId: `uv:${v.id}`,
          source: 'sponsor',
          inWallet: true,
          code: v.code,
          label: c.business.name,
          logo: c.business.category,
          providerId: v.providerId,
          vehicleClasses: [v.vehicleClass],
          amount: v.amount,
          percent: null,
          maxAmount: null,
          minFare: null,
          requiresPartner: null,
          airportOnly: false,
          area: { lat: c.business.lat, lng: c.business.lng, radiusM: c.radiusM },
          hours: null,
          expiresAt: v.expiresAt,
          sourceName: null,
          description: null,
        });
      } else if (v.source === 'frego') {
        const vehicle = SERVICES[`${v.providerId}-${v.vehicleClass}`];
        offers.push({
          refId: `uv:${v.id}`,
          source: 'frego',
          inWallet: true,
          code: v.code,
          label: v.code,
          logo: 'frego',
          providerId: v.providerId,
          vehicleClasses: [v.vehicleClass],
          amount: v.amount,
          percent: null,
          maxAmount: null,
          minFare: null,
          requiresPartner: null,
          airportOnly: false,
          area: null,
          hours: null,
          expiresAt: v.expiresAt,
          sourceName: null,
          description: `Mã riêng Frego, mọi chuyến ${vehicle.name.toLowerCase()} trên app ${PROVIDERS[v.providerId].name}.`,
        });
      }
    }
    // Ưu đãi chiến dịch: đi đến vùng quanh quán là được tặng.
    for (const c of camps) {
      if (heldCampaigns.has(c.id)) continue;
      offers.push({
        refId: `cp:${c.id}`,
        source: 'sponsor',
        inWallet: false,
        code: '',
        label: c.business.name,
        logo: c.business.category,
        providerId: c.providerId,
        vehicleClasses: [c.vehicleClass],
        amount: c.amount,
        percent: null,
        maxAmount: null,
        minFare: null,
        requiresPartner: null,
        airportOnly: false,
        area: { lat: c.business.lat, lng: c.business.lng, radiusM: c.radiusM },
        hours: { from: c.hoursFrom, to: c.hoursTo },
        expiresAt: c.endsAt,
        sourceName: null,
        description: null,
      });
    }
    for (const p of publicCodes) {
      offers.push({
        refId: `pc:${p.id}`,
        source: 'public',
        inWallet: false,
        code: p.code,
        label: p.code,
        logo: p.providerId,
        providerId: p.providerId,
        vehicleClasses: p.vehicleClasses,
        amount: p.amount,
        percent: p.percent,
        maxAmount: p.maxAmount,
        minFare: p.minFare,
        requiresPartner: p.requiresPartnerId
          ? { id: p.requiresPartnerId, name: partnerName.get(p.requiresPartnerId) ?? p.requiresPartnerId }
          : null,
        airportOnly: p.airportOnly,
        area: null,
        hours: null,
        expiresAt: p.expiresAt,
        sourceName: p.sourceName,
        description: null,
      });
    }
    return offers;
  }

  async function tripContext(plan: Pick<TripPlan, 'origin' | 'dest' | 'km' | 'minutes' | 'at'>): Promise<TripContext> {
    const [fareTables, partners, originPlace] = await Promise.all([
      db.list('fare_tables', { where: { region: 'hcm' } }),
      linkedPartnerIds(),
      plan.origin.placeId ? db.get('places', plan.origin.placeId) : Promise.resolve(null),
    ]);
    return {
      origin: { lat: plan.origin.lat, lng: plan.origin.lng, isAirport: originPlace?.isAirport },
      dest: plan.dest,
      km: plan.km,
      minutes: plan.minutes,
      at: plan.at,
      linkedPartnerIds: partners,
      fareTables,
    };
  }

  const service = {
    db,

    /* ───── Đăng nhập, hồ sơ ───── */

    async getMe(): Promise<MeView> {
      const uid = me();
      const [profile, vouchers, trips, links, partners, prefs, consents] = await Promise.all([
        db.get('profiles', uid),
        myVouchers(),
        db.list('trips', { where: { userId: uid } }),
        db.list('linked_accounts', { where: { userId: uid } }),
        db.list('partners'),
        db.get('notification_prefs', uid),
        db.get('consents', uid),
      ]);
      if (!profile) throw new Error('Không tìm thấy hồ sơ');
      const pName = new Map(partners.map((p) => [p.id, p.name]));
      const linkedNames = links.map((l) => pName.get(l.partnerId) ?? l.partnerId);
      const prefKeys: (keyof Omit<NotificationPrefs, 'userId' | 'quiet'>)[] = ['gift', 'card', 'expire', 'report', 'points', 'promo'];
      const pending = trips.filter((t) => t.status === 'code_used').length;
      return {
        profile,
        initials: initials(profile.displayName || 'Bạn'),
        maskedPhone: maskPhone(profile.phone),
        pointsText: formatNumber(profile.points),
        savedText: formatVnd(profile.savedAmount),
        savedSub: `nhờ ${profile.savedCount} voucher`,
        pendingReports: pending,
        usableVouchers: vouchers.filter((v) => v.status === 'active').length,
        linkedSummary: linkedNames.length ? `${linkedNames.join(', ')} đã liên kết` : 'Chưa liên kết',
        notifOnCount: prefs ? prefKeys.filter((k) => prefs[k]).length : 0,
        locationOn: consents?.location ?? false,
      };
    },

    async updateProfile(patch: Partial<Pick<Profile, 'displayName' | 'birthday' | 'interests' | 'vehiclePrefs' | 'avatarUrl'>>) {
      return db.update('profiles', me(), { ...patch, onboardedAt: nowIso() });
    },

    async getConsents(): Promise<Consents> {
      const uid = me();
      return (
        (await db.get('consents', uid)) ?? { userId: uid, location: true, shareData: false, personalized: false, updatedAt: nowIso() }
      );
    },

    async updateConsents(patch: Partial<Omit<Consents, 'userId' | 'updatedAt'>>) {
      const uid = me();
      const existing = await db.get('consents', uid);
      if (!existing) return db.insert('consents', { userId: uid, location: true, shareData: false, personalized: false, ...patch, updatedAt: nowIso() });
      return db.update('consents', uid, { ...patch, updatedAt: nowIso() });
    },

    async getNotificationPrefs(): Promise<NotificationPrefs> {
      const uid = me();
      return (
        (await db.get('notification_prefs', uid)) ?? {
          userId: uid,
          gift: true,
          card: true,
          expire: true,
          report: true,
          points: true,
          promo: false,
          quiet: true,
        }
      );
    },

    async updateNotificationPrefs(patch: Partial<Omit<NotificationPrefs, 'userId'>>) {
      const uid = me();
      const existing = await db.get('notification_prefs', uid);
      if (!existing) {
        const base = await service.getNotificationPrefs();
        return db.insert('notification_prefs', { ...base, ...patch });
      }
      return db.update('notification_prefs', uid, patch);
    },

    async ensureWelcomeVoucher() {
      return db.rpc('ensure_welcome_voucher', {});
    },

    /* ───── Trang chủ, tìm kiếm ───── */

    async getHome(): Promise<HomeView> {
      const uid = me();
      const origin = await currentOrigin();
      const [saved, recent, byId, vouchers, camps, unread] = await Promise.all([
        db.list('saved_places', { where: { userId: uid }, order: { column: 'createdAt' } }),
        db.list('recent_searches', { where: { userId: uid }, order: { column: 'searchedAt', ascending: false }, limit: 2 }),
        placesById(),
        myVouchers(),
        activeCampaigns(),
        service.unreadCount(),
      ]);
      const welcome = vouchers.find((v) => v.source === 'frego' && v.status === 'active');
      const banner: BannerView | null = welcome
        ? {
            chip: welcome.note.startsWith('Quà chào mừng') ? 'Quà chào mừng' : 'Voucher của bạn',
            title: `Giảm ${formatVnd(welcome.amount)} chuyến ${serviceShortLabel(welcome.providerId, welcome.vehicleClass)}`,
            sub: 'Frego tự gắn mã khi bạn đặt xe',
            ticketAmount: formatDiscountShort(welcome.amount),
            ticketService: serviceShortLabel(welcome.providerId, welcome.vehicleClass),
            link: '/vi',
          }
        : null;
      const places = [...byId.values()];
      const deals: DealView[] = camps
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
        .map((c) => {
          const nearest = places
            .filter((p) => !['nha-minh-anh', 'cty-minh-anh'].includes(p.id))
            .map((p) => ({ p, d: distanceM(p, c.business) }))
            .sort((a, b) => a.d - b.d)[0];
          return {
            campaignId: c.id,
            businessId: c.businessId,
            category: c.business.category,
            area: `Gần ${c.business.landmark}`,
            brand: c.business.name,
            serviceText: `Mã ${serviceShortLabel(c.providerId, c.vehicleClass)}`,
            amountText: formatDiscount(c.amount),
            cta: 'Đặt xe ›',
            destPlaceId: nearest && nearest.d <= c.radiusM ? nearest.p.id : `biz:${c.businessId}`,
          };
        });
      const recentPlaces = recent.map((r) => byId.get(r.placeId)).filter((p): p is Place => !!p);
      return {
        banner,
        originLabel: origin.label,
        savedPlaces: saved.map((s) => ({
          id: s.id,
          kind: s.kind,
          label: s.label,
          placeId: s.placeId,
          icon: s.kind === 'home' ? 'home' : s.kind === 'work' ? 'brief' : 'pin',
        })),
        recent: await toPlaceViews(recentPlaces, origin),
        deals,
        unreadCount: unread,
      };
    },

    async recentSearches(limit = 3): Promise<PlaceView[]> {
      const uid = me();
      const [recent, byId, origin] = await Promise.all([
        db.list('recent_searches', { where: { userId: uid }, order: { column: 'searchedAt', ascending: false }, limit }),
        placesById(),
        currentOrigin(),
      ]);
      return toPlaceViews(recent.map((r) => byId.get(r.placeId)).filter((p): p is Place => !!p), origin);
    },

    async searchPlaces(query: string): Promise<PlaceView[]> {
      const q = normalize(query);
      if (!q) return [];
      const [all, origin] = await Promise.all([db.list('places'), currentOrigin()]);
      const hits = all
        .filter((p) => !['nha-minh-anh', 'cty-minh-anh'].includes(p.id))
        .filter((p) => normalize(p.name).includes(q) || normalize(p.address).includes(q));
      return toPlaceViews(hits.slice(0, 8), origin);
    },

    async currentOriginLabel(): Promise<string> {
      return 'Vị trí hiện tại · gần Landmark 81';
    },

    async addSavedPlace(input: { kind: SavedPlaceKind; label: string; placeId: string }) {
      return db.insert('saved_places', { userId: me(), ...input, createdAt: nowIso() });
    },

    /** Gợi ý từ chuyến gần đây (màn Thêm địa điểm). */
    async savedPlaceSuggestions(): Promise<Place[]> {
      const byId = await placesById();
      return ['ben-thanh', 'landmark81', 'tan-son-nhat'].map((id) => byId.get(id)).filter((p): p is Place => !!p);
    },

    /* ───── Luồng chính: gắn voucher → so giá → mở app hãng ───── */

    /** Lập kế hoạch chuyến tới điểm đến (placeId, hoặc "biz:<id>" để đi tới quán). */
    async planTrip(destId: string, opts: { preferredCampaignId?: string | null } = {}): Promise<TripPlan> {
      const origin = await currentOrigin();
      let dest: Place | null;
      if (destId.startsWith('biz:')) {
        const b = await db.get('businesses_public', destId.slice(4));
        dest = b ? { id: destId, name: b.name, address: b.address, district: b.district, lat: b.lat, lng: b.lng } : null;
      } else {
        dest = await db.get('places', destId);
      }
      if (!dest) throw new Error('Không tìm thấy điểm đến');
      const route = estimateRoute({ ...origin, id: origin.placeId ?? undefined }, dest);
      const at = nowIso();
      const base = { origin, dest, km: route.km, minutes: route.minutes, at };
      const ctx = await tripContext(base);
      const evaluation = evaluateOffers(await buildOffers(), ctx);
      const selection: Selection = { ...evaluation.autoSelection };
      if (opts.preferredCampaignId) {
        const pref = evaluation.eligible.find(
          (e) => e.offer.refId === `cp:${opts.preferredCampaignId}` || e.offer.label === opts.preferredCampaignId,
        );
        if (pref) selection[pref.service] = pref.offer.refId;
      }
      const originName = origin.placeId ? (await db.get('places', origin.placeId))?.name ?? origin.label : origin.label;
      return {
        ...base,
        peak: isPeak(at),
        title: `${originName} → ${dest.name}`,
        subtitle: `${formatKm(route.km)} · khoảng ${route.minutes} phút`,
        evaluation,
        selection,
        preferredCampaignId: opts.preferredCampaignId ?? null,
      };
    },

    attachItems(plan: TripPlan, selection: Selection): AttachItemView[] {
      return plan.evaluation.eligible.map((e) => {
        const attached = selection[e.service] === e.offer.refId;
        const busy = !attached && !!selection[e.service];
        return {
          refId: e.offer.refId,
          service: e.service,
          logo: e.offer.logo,
          tag: e.tag,
          name: e.offer.label,
          amountText: e.amountText,
          serviceText: e.serviceText,
          conditionLine: e.conditionLine,
          metaText: busy ? 'Đang dùng mã khác' : e.metaText,
          attached,
        };
      });
    },

    attachCta(selection: Selection) {
      return attachCtaText(Object.values(selection).filter(Boolean).length);
    },

    /** Người dùng nhập mã khác. Trả về refId nếu khớp mã đã biết và hợp chuyến. */
    async addCustomCode(plan: TripPlan, input: string): Promise<{ matched: EligibleOffer | null; message: string }> {
      const code = input.trim().toUpperCase();
      const hit = plan.evaluation.eligible.find((e) => e.offer.code.toUpperCase() === code);
      if (hit) return { matched: hit, message: `Đã gắn ${hit.offer.code} cho ${hit.serviceText}.` };
      const bad = plan.evaluation.ineligible.find((e) => e.offer.code.toUpperCase() === code);
      if (bad) return { matched: null, message: `${bad.offer.code} không hợp chuyến này: ${bad.line.split(' · ')[1]}.` };
      return { matched: null, message: 'Đã thêm. Frego kiểm tra điều kiện của mã rồi mới tính vào giá.' };
    },

    async compare(plan: TripPlan, selection: Selection, vehicleClass: VehicleClass): Promise<ComparisonView> {
      const ctx = await tripContext(plan);
      const { rows, insight } = comparePrices(ctx, vehicleClass, plan.evaluation, selection);
      const chosen = selectedOffers(selection, plan.evaluation);
      return {
        tabs: VEHICLE_TABS,
        vehicleClass,
        rows,
        insight,
        attachedTitle: chosen.length ? `Đã gắn ${chosen.length} voucher` : 'Chưa gắn voucher',
        attachedLine: chosen.length ? chosen.map((c) => c.offer.label).join(' · ') : 'Bấm để gắn mã trước khi so giá',
        peakNote: plan.peak
          ? `${formatTime(plan.at)} là giờ cao điểm, khoảng giá đã nới rộng. Giá cuối cùng do app hãng hiển thị.`
          : 'Giá cuối cùng do app hãng hiển thị.',
      };
    },

    /** Bấm một hãng ở màn So giá: ghi chuyến, phát mã (nếu là ưu đãi chiến dịch), trả dữ liệu màn Mở app. */
    async openProvider(plan: TripPlan, selection: Selection, row: PriceRow): Promise<OpenAppView> {
      const chosen = selectedOffers(selection, plan.evaluation);
      const attached: AttachedCode[] = chosen.map((c) => ({
        service: c.service,
        source: c.offer.source,
        refId: c.offer.refId,
        code: c.offer.code,
        label: c.offer.label,
        amount: c.discount,
      }));
      const trip = await db.rpc('record_trip', {
        originLabel: plan.title.split(' → ')[0],
        originPlaceId: plan.origin.placeId,
        destPlaceId: plan.dest.id,
        destLabel: plan.dest.name,
        distanceKm: plan.km,
        durationMin: plan.minutes,
        attached,
        chosenService: row.service,
        estimateLow: row.final?.low ?? null,
        estimateHigh: row.final?.high ?? null,
        comparedCount: 3,
      });
      return service.openAppView(trip, plan.dest);
    },

    openAppView(trip: Trip, dest: Pick<Place, 'name' | 'address' | 'lat' | 'lng'>): OpenAppView {
      const { providerId, vehicleClass } = parseServiceKey(trip.chosenService!);
      const provider = PROVIDERS[providerId];
      const code = trip.attached.find((c) => c.service === trip.chosenService) ?? null;
      return {
        trip,
        providerId,
        vehicleClass,
        title: `Mở app ${provider.name} để đặt xe`,
        serviceLine: serviceLongLabel(providerId, vehicleClass),
        estimateText:
          trip.estimateLow !== null && trip.estimateHigh !== null ? formatVndRange(trip.estimateLow, trip.estimateHigh) : 'Chưa có giá',
        code: code?.code ?? null,
        codeLine: code ? `Giảm ${formatVnd(code.amount)} cho chuyến ${SERVICES[code.service].name.toLowerCase()}` : null,
        prefillsDestination: provider.prefillsDestination,
        destAddress: `${dest.name}, ${dest.address}`,
        deepLink: providerDeepLink(providerId, dest),
        storeUrl: provider.storeUrl,
        step1: provider.prefillsDestination
          ? [`${provider.name} mở sẵn điểm đến`, ', bạn chỉ cần nhập mã.']
          : [`${provider.name} chưa tự điền điểm đến,`, ' địa chỉ đã được chép sẵn để bạn dán.'],
      };
    },

    /** Ghi lần so giá mà không mở app hãng nào ("Chỉ xem giá"). */
    async recordViewOnly(plan: TripPlan) {
      return db.rpc('record_trip', {
        originLabel: plan.title.split(' → ')[0],
        originPlaceId: plan.origin.placeId,
        destPlaceId: plan.dest.id,
        destLabel: plan.dest.name,
        distanceKm: plan.km,
        durationMin: plan.minutes,
        attached: [],
        chosenService: null,
        estimateLow: null,
        estimateHigh: null,
        comparedCount: 3,
      });
    },

    /** DEMO: giả lập hãng báo mã đã dùng (thật: webhook đối tác / biên nhận email). */
    async simulateCodeUsed(tripId: string) {
      return db.rpc('mark_code_used', { tripId });
    },

    async getTrip(tripId: string) {
      const t = await db.get('trips', tripId);
      if (!t || t.userId !== me()) return null;
      const { providerId, vehicleClass } = t.chosenService ? parseServiceKey(t.chosenService) : { providerId: null, vehicleClass: null };
      const code = t.attached.find((c) => c.service === t.chosenService) ?? null;
      return {
        trip: t,
        providerId,
        vehicleClass,
        kind: vehicleClass ? VEHICLE_KIND[vehicleClass] : null,
        serviceLine: providerId && vehicleClass ? serviceLongLabel(providerId, vehicleClass) : '',
        providerName: providerId ? PROVIDERS[providerId].name : '',
        estimateText: t.estimateLow !== null && t.estimateHigh !== null ? formatVndRange(t.estimateLow, t.estimateHigh) : '',
        codeUsedChip: code ? `Mã ${code.code} vừa được dùng` : 'Chuyến vừa hoàn tất',
      };
    },

    async reportPrice(tripId: string, input: { verdict?: PriceVerdict; paidAmount?: number }) {
      return db.rpc('report_price', { tripId, ...input });
    },

    /* ───── Ví voucher ───── */

    async getWallet(): Promise<WalletView> {
      const [vouchers, camps, bizs, codes, partners, linked] = await Promise.all([
        myVouchers(),
        db.list('campaigns_public'),
        db.list('businesses_public'),
        db.list('public_codes', { where: { status: 'live' } }),
        db.list('partners'),
        linkedPartnerIds(),
      ]);
      const campById = new Map(camps.map((c) => [c.id, c]));
      const bizById = new Map(bizs.map((b) => [b.id, b]));
      const pName = new Map(partners.map((p) => [p.id, p]));
      const gifts: WalletGiftView[] = vouchers
        .filter((v) => v.status === 'active')
        .sort((a, b) => (a.source === b.source ? 0 : a.source === 'sponsor' ? -1 : 1))
        .map((v) => {
          const c = v.campaignId ? campById.get(v.campaignId) : null;
          const b = c ? bizById.get(c.businessId) : null;
          const isSponsor = v.source === 'sponsor' && !!b;
          return {
            id: v.id,
            source: v.source,
            logo: isSponsor ? b!.category : 'frego',
            tag: isSponsor ? 'sponsor' : 'frego',
            title: isSponsor ? b!.name : `Mã ${v.code}`,
            amountText: formatDiscount(v.amount),
            serviceText: serviceShortLabel(v.providerId, v.vehicleClass),
            line: v.note,
            metaText: `HSD ${formatDate(v.expiresAt)}`,
            action: isSponsor ? 'Xem mã ›' : 'Dùng ›',
            link: isSponsor ? `/voucher/${v.id}` : '/tim-kiem',
          };
        });
      const nowT = db.now().getTime();
      const publicCodes: PublicCodeCardView[] = codes.map((c) => {
        const partner = c.requiresPartnerId ? pName.get(c.requiresPartnerId) : null;
        const has = !!partner && linked.includes(partner.id);
        return {
          id: c.id,
          logo: c.providerId,
          brandLine: `${PROVIDERS[c.providerId].name} · mã công khai`,
          code: c.code,
          title: c.title,
          okText: partner && has ? `Thẻ ${partner.name} của bạn` : '',
          warnText: partner && !has ? `Cần thẻ ${partner.name}` : '',
          plainText: c.notes[0] ?? '',
          plainText2: c.notes[1] ?? '',
          metaText: `Nguồn: ${c.sourceName} · kiểm tra ${checkedAgo(c.lastCheckedAt, nowT)}`,
          otherCard: !!partner && !has,
        };
      });
      const autoPromos: AutoPromoView[] = Object.values(PROVIDERS)
        .filter((p) => p.autoPromo && new Date(p.autoPromo.until).getTime() > nowT)
        .map((p) => ({
          providerId: p.id,
          brandLine: `${p.name} · tự áp, không cần mã`,
          title: `Giảm ${Math.round(p.autoPromo!.percent * 100)}% mọi chuyến đến hết ${formatDate(p.autoPromo!.until)}`,
          metaText: `Nguồn: ${p.autoPromo!.source} · kiểm tra hôm nay`,
        }));
      const used: UsedVoucherView[] = vouchers
        .filter((v) => v.status === 'used')
        .map((v) => {
          const c = v.campaignId ? campById.get(v.campaignId) : null;
          const b = c ? bizById.get(c.businessId) : null;
          return {
            id: v.id,
            title: b ? b.name : `Mã ${v.code}`,
            amountText: formatDiscount(v.amount),
            serviceText: serviceShortLabel(v.providerId, v.vehicleClass),
            usedText: v.usedAt ? `Đã dùng ${formatDate(v.usedAt)}` : 'Đã dùng',
          };
        });
      return { gifts, publicCodes, autoPromos, used };
    },

    async getVoucher(id: string): Promise<VoucherDetailView | null> {
      const v = await db.get('user_vouchers', id);
      if (!v || v.userId !== me()) return null;
      const c = v.campaignId ? await db.get('campaigns_public', v.campaignId) : null;
      const b = c ? await db.get('businesses_public', c.businessId) : null;
      const svc = serviceFullLabel(v.providerId, v.vehicleClass);
      const radius = c ? formatMeters(c.radiusM) : '';
      return {
        voucher: v,
        businessName: b?.name ?? brand.name,
        businessAddress: b?.address.split(',').slice(0, 2).join(',') ?? '',
        landmark: b?.landmark || null,
        category: b?.category ?? 'frego',
        amountText: formatDiscount(v.amount),
        serviceText: `${PROVIDERS[v.providerId].name} ${SERVICES[`${v.providerId}-${v.vehicleClass}`].name.toLowerCase()}`,
        expiresText: `HSD ${formatDate(v.expiresAt)}`,
        reasons: v.reasons,
        radiusText: radius,
        area: c && b ? { lat: b.lat, lng: b.lng, radiusM: c.radiusM } : null,
        conditions: [
          `Dùng 1 lần cho chuyến ${svc.charAt(0).toUpperCase() + svc.slice(1)}.`,
          ...(c ? [`Điểm đến nằm trong vòng ${radius} quanh quán.`] : []),
          `Nhập mã trong app ${PROVIDERS[v.providerId].name} trước khi đặt xe.`,
          `Hạn dùng đến hết ngày ${formatDate(v.expiresAt)}.`,
        ],
      };
    },

    async getPublicCode(id: string): Promise<PublicCodeDetailView | null> {
      const c = await db.get('public_codes', id);
      if (!c) return null;
      const [partners, linked, votes] = await Promise.all([
        db.list('partners'),
        linkedPartnerIds(),
        db.list('code_votes', { where: { userId: me(), publicCodeId: id } }),
      ]);
      const partner = c.requiresPartnerId ? partners.find((p) => p.id === c.requiresPartnerId) : null;
      const has = !!partner && linked.includes(partner.id);
      const nowT = db.now().getTime();
      let host = c.sourceName;
      try {
        const u = new URL(c.sourceUrl);
        host = u.host.replace(/^www\./, '') + (u.pathname.startsWith('/vn') ? '/vn' : '');
      } catch {
        /* giữ sourceName */
      }
      return {
        code: c,
        providerName: PROVIDERS[c.providerId].name,
        fits: !partner || has,
        fitText: partner && has ? `Hợp với bạn: bạn đã liên kết thẻ ${partner.name} trong Tài khoản.` : null,
        missingText: partner && !has ? `Cần thẻ ${partner.name}. Liên kết trong Tài khoản để Frego tự gắn mã này.` : null,
        conditions: c.conditions,
        expiryNote: c.expiresAt
          ? `Hạn dùng: đến hết ${formatDate(c.expiresAt)}. Frego kiểm tra lại mỗi ngày và tự ẩn khi mã hết.`
          : 'Hạn dùng: chưa rõ ngày kết thúc. Frego kiểm tra lại mỗi ngày và tự ẩn khi mã hết.',
        sourceHost: host,
        sourceTitle: `Bài: ${c.sourceTitle}`,
        checkedText: `Frego kiểm tra lần cuối ${checkedAgo(c.lastCheckedAt, nowT)}`,
        reportsText: `${c.okReports24h} dùng được`,
        reportsSub: ` · ${c.badReports24h} không dùng được, trong 24 giờ qua`,
        myVote: votes[0]?.works ?? null,
      };
    },

    async votePublicCode(id: string, works: boolean) {
      return db.rpc('vote_public_code', { publicCodeId: id, works });
    },

    /* ───── Điểm thưởng ───── */

    async getPoints(): Promise<PointsView> {
      const uid = me();
      const [profile, rewards, ledger] = await Promise.all([
        db.get('profiles', uid),
        db.list('rewards', { where: { active: true }, order: { column: 'cost' } }),
        db.list('points_ledger', { where: { userId: uid }, order: { column: 'createdAt', ascending: false }, limit: 20 }),
      ]);
      const points = profile?.points ?? 0;
      const target = rewards[rewards.length - 1];
      const targetLabel = target ? `${serviceShortLabel(target.providerId, target.vehicleClass)} ${formatDiscount(target.amount)}` : '';
      return {
        points,
        pointsText: formatNumber(points),
        progressText: !target
          ? ''
          : points >= target.cost
            ? `Đủ điểm đổi ${targetLabel}`
            : `Còn ${formatNumber(target.cost - points)} điểm nữa để đổi ${targetLabel}`,
        progress: target ? Math.min(1, points / target.cost) : 0,
        rewards: rewards.map((r) => ({
          id: r.id,
          providerId: r.providerId,
          kind: VEHICLE_KIND[r.vehicleClass],
          amountText: formatDiscount(r.amount),
          serviceText: r.providerId === 'gsm' ? PROVIDERS.gsm.name : serviceShortLabel(r.providerId, r.vehicleClass),
          cost: r.cost,
          costText: `${formatNumber(r.cost)} điểm`,
          canRedeem: points >= r.cost,
          shortText: points >= r.cost ? '' : `Thiếu ${formatNumber(r.cost - points)} điểm`,
        })),
        history: ledger.map((e) => ({
          id: e.id,
          deltaText: (e.delta > 0 ? '+' : '') + formatNumber(e.delta),
          reason: e.reason,
          dateText: formatDayMonth(e.createdAt),
        })),
      };
    },

    async redeemReward(rewardId: string) {
      return db.rpc('redeem_reward', { rewardId });
    },

    /* ───── Lịch sử so giá ───── */

    async listTrips(): Promise<TripHistoryItem[]> {
      const uid = me();
      const trips = await db.list('trips', { where: { userId: uid }, order: { column: 'createdAt', ascending: false } });
      const now = db.now();
      return trips.map((t) => {
        const svc = t.chosenService ? SERVICES[t.chosenService] : null;
        const svcLabel = svc ? serviceShortLabel(svc.providerId, svc.vehicleClass) : '';
        const code = t.attached.find((c) => c.service === t.chosenService);
        const codeText = code ? (code.source === 'sponsor' ? `voucher ${code.label} ${formatDiscount(code.amount)}` : `mã ${code.code}`) : '';
        const est = t.estimateLow !== null && t.estimateHigh !== null ? formatVndRange(t.estimateLow, t.estimateHigh) : '';
        let status: TripHistoryItem['status'];
        let chip: string;
        let line: string;
        if (t.status === 'reported') {
          status = 'reported';
          chip = 'Đã báo giá';
          line = code ? `${svcLabel} · ${codeText}` : `${serviceLongLabelLower(t.chosenService!)} · ước tính ${est}`;
        } else if (t.status === 'code_used') {
          status = 'pending';
          chip = 'Chưa báo giá';
          line = `${svcLabel} · ${codeText ? codeText + ' · ' : ''}ước tính sau mã ${est}`;
        } else if (t.status === 'opened') {
          status = 'opened';
          chip = 'Đã mở app hãng';
          line = `${svcLabel}${codeText ? ' · ' + codeText : ''} · ước tính ${est}`;
        } else {
          status = 'viewed';
          chip = 'Chỉ xem giá';
          line = `Đã so ${t.comparedCount} hãng, chưa mở app hãng nào.`;
        }
        return {
          id: t.id,
          group: formatDayGroup(t.createdAt, now),
          time: formatTime(t.createdAt),
          status,
          chip,
          title: `${t.originLabel} → ${t.destLabel}`,
          line,
          paidText: t.paidAmount ? `Bạn trả ${formatVnd(t.paidAmount)}` : null,
          pointsText: t.pointsAwarded ? `+${t.pointsAwarded} điểm` : null,
        };
      });
    },

    /* ───── Liên kết ───── */

    async getLinks(): Promise<{ cards: LinkRowView[]; wallets: LinkRowView[]; apps: LinkRowView[]; count: number }> {
      const [partners, linked] = await Promise.all([db.list('partners', { order: { column: 'sortOrder' } }), linkedPartnerIds()]);
      const row = (p: Partner): LinkRowView => ({
        partnerId: p.id,
        kind: p.kind,
        name: p.name,
        mono: p.mono,
        desc: linked.includes(p.id) ? (p.linkedDescription ?? p.description) : p.description,
        linked: linked.includes(p.id),
        isRideApp: ['grab', 'be', 'gsm'].includes(p.id),
      });
      return {
        cards: partners.filter((p) => p.kind === 'bank').map(row),
        wallets: partners.filter((p) => p.kind === 'wallet').map(row),
        apps: partners.filter((p) => p.kind === 'app' || p.kind === 'email').map(row),
        count: linked.length,
      };
    },

    async link(partnerId: string, cardType: 'credit' | 'debit' | null = null) {
      const uid = me();
      const existing = await db.list('linked_accounts', { where: { userId: uid, partnerId } });
      if (existing.length) return existing[0];
      return db.insert('linked_accounts', { userId: uid, partnerId, cardType, linkedAt: nowIso() });
    },

    async unlink(partnerId: string) {
      const uid = me();
      const existing = await db.list('linked_accounts', { where: { userId: uid, partnerId } });
      for (const e of existing) await db.remove('linked_accounts', e.id);
    },

    /* ───── Thông báo ───── */

    async listNotifications(): Promise<NotificationView[]> {
      const uid = me();
      const list = await db.list('notifications', { where: { userId: uid }, order: { column: 'createdAt', ascending: false } });
      const now = db.now();
      return list.map((n) => {
        const today = formatDayGroup(n.createdAt, now) === 'Hôm nay';
        const when = today
          ? formatTime(n.createdAt)
          : formatDayGroup(n.createdAt, now) === 'Hôm qua'
            ? `Hôm qua, ${formatTime(n.createdAt)}`
            : `${Number(formatDayMonth(n.createdAt).split('/')[0])}/${Number(formatDayMonth(n.createdAt).split('/')[1])}`;
        return {
          ...n,
          unread: !n.readAt,
          metaText: `${when} · ${n.category === 'trip' ? 'Chuyến đi' : 'Voucher'}`,
          group: today ? 'today' : 'earlier',
        };
      });
    },

    async unreadCount(): Promise<number> {
      const uid = db.currentUserId();
      if (!uid) return 0;
      const list = await db.list('notifications', { where: { userId: uid } });
      return list.filter((n) => !n.readAt).length;
    },

    async markAllNotificationsRead() {
      return db.rpc('mark_all_notifications_read', {});
    },

    async markNotificationRead(id: string) {
      return db.update('notifications', id, { readAt: nowIso() });
    },

    /* ───── Tiện ích ───── */
    formatRelative: (iso: string) => formatRelative(iso, db.now()),
    categoryLabel: (c: CategoryKey) => CATEGORY_LABEL[c],
  };

  return service;
}

export type UserService = ReturnType<typeof createUserService>;

/** Link mở app hãng. Grab nhận điểm đến qua tham số; Be, Green SM chỉ mở app. */
export function providerDeepLink(providerId: ProviderId, dest: Pick<Place, 'name' | 'lat' | 'lng'>): string {
  const p = PROVIDERS[providerId];
  if (providerId === 'grab') {
    const q = `screenType=BOOKING&dropOffLatitude=${dest.lat}&dropOffLongitude=${dest.lng}&dropOffAddress=${encodeURIComponent(dest.name)}`;
    return `${p.appUrl}?${q}`;
  }
  return p.appUrl;
}

function normalize(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function serviceLongLabelLower(key: ServiceKey) {
  const { providerId, vehicleClass } = parseServiceKey(key);
  return serviceFullLabel(providerId, vehicleClass);
}

/** "2 giờ trước", "hôm qua" */
function checkedAgo(iso: string, nowT: number): string {
  return formatRelative(iso, nowT);
}
