/** Danh mục cố định: hãng xe, loại xe, tên dịch vụ, nhãn hiển thị. */
import type { CategoryKey, Provider, ProviderId, Service, ServiceKey, VehicleClass } from './types';

export const PROVIDERS: Record<ProviderId, Provider> = {
  grab: {
    id: 'grab',
    name: 'Grab',
    mono: 'Gr',
    appUrl: 'grab://open',
    storeUrl: 'https://www.grab.com/vn/download/',
    prefillsDestination: true,
    autoPromo: null,
  },
  be: {
    id: 'be',
    name: 'Be',
    mono: 'Be',
    appUrl: 'be://',
    storeUrl: 'https://be.com.vn/',
    prefillsDestination: false,
    autoPromo: null,
  },
  gsm: {
    id: 'gsm',
    name: 'Green SM',
    mono: 'GS',
    appUrl: 'xanhsm://',
    storeUrl: 'https://www.xanhsm.com/',
    prefillsDestination: false,
    autoPromo: {
      percent: 0.25,
      until: '2027-02-28T16:59:59Z',
      note: 'Green SM đang tự giảm 25%, không cần mã',
      source: 'greensm.com',
    },
  },
};

export const PROVIDER_ORDER: ProviderId[] = ['grab', 'be', 'gsm'];
export const VEHICLE_ORDER: VehicleClass[] = ['bike', 'car4', 'car7'];

/** Nhãn tab loại xe ở màn So giá. */
export const VEHICLE_TABS: { key: VehicleClass; label: string; icon: 'bike' | 'car' | 'suv' }[] = [
  { key: 'bike', label: 'Xe máy', icon: 'bike' },
  { key: 'car4', label: 'Ô tô 4 chỗ', icon: 'car' },
  { key: 'car7', label: 'Ô tô 6–7 chỗ', icon: 'suv' },
];

/** Nhãn ngắn dùng chung "Grab ô tô", "Be xe máy" (vé voucher, thẻ tài trợ). */
export const VEHICLE_SHORT: Record<VehicleClass, string> = {
  bike: 'xe máy',
  car4: 'ô tô',
  car7: 'ô tô 7 chỗ',
};

export const SERVICES: Record<ServiceKey, Service> = {
  'grab-bike': { key: 'grab-bike', providerId: 'grab', vehicleClass: 'bike', name: 'Xe máy', productName: 'GrabBike' },
  'grab-car4': { key: 'grab-car4', providerId: 'grab', vehicleClass: 'car4', name: 'Ô tô 4 chỗ', productName: 'GrabCar' },
  'grab-car7': { key: 'grab-car7', providerId: 'grab', vehicleClass: 'car7', name: 'Ô tô 6 chỗ', productName: 'GrabCar 7 chỗ' },
  'be-bike': { key: 'be-bike', providerId: 'be', vehicleClass: 'bike', name: 'Xe máy', productName: 'beBike' },
  'be-car4': { key: 'be-car4', providerId: 'be', vehicleClass: 'car4', name: 'Ô tô 4 chỗ', productName: 'beCar' },
  'be-car7': { key: 'be-car7', providerId: 'be', vehicleClass: 'car7', name: 'Ô tô 7 chỗ', productName: 'beCar 7 chỗ' },
  'gsm-bike': { key: 'gsm-bike', providerId: 'gsm', vehicleClass: 'bike', name: 'Xe máy điện', productName: 'Xanh SM Bike' },
  'gsm-car4': { key: 'gsm-car4', providerId: 'gsm', vehicleClass: 'car4', name: 'Ô tô điện', productName: 'Xanh SM Taxi' },
  'gsm-car7': { key: 'gsm-car7', providerId: 'gsm', vehicleClass: 'car7', name: 'Ô tô 7 chỗ', productName: 'Xanh SM Luxury' },
};

export function serviceKey(providerId: ProviderId, vehicleClass: VehicleClass): ServiceKey {
  return `${providerId}-${vehicleClass}`;
}

export function parseServiceKey(key: ServiceKey): { providerId: ProviderId; vehicleClass: VehicleClass } {
  const [providerId, vehicleClass] = key.split('-') as [ProviderId, VehicleClass];
  return { providerId, vehicleClass };
}

/** "Grab ô tô", "Be xe máy", "Green SM xe máy" */
export function serviceShortLabel(providerId: ProviderId, vehicleClass: VehicleClass): string {
  return `${PROVIDERS[providerId].name} ${VEHICLE_SHORT[vehicleClass]}`;
}

/** "Grab · Ô tô 4 chỗ" */
export function serviceLongLabel(providerId: ProviderId, vehicleClass: VehicleClass): string {
  return `${PROVIDERS[providerId].name} · ${SERVICES[serviceKey(providerId, vehicleClass)].name}`;
}

/** "Grab ô tô 4 chỗ" (web, chi tiết voucher) */
export function serviceFullLabel(providerId: ProviderId, vehicleClass: VehicleClass): string {
  return `${PROVIDERS[providerId].name} ${SERVICES[serviceKey(providerId, vehicleClass)].name.toLowerCase()}`;
}

export const CATEGORY_LABEL: Record<CategoryKey, string> = {
  cafe: 'Cà phê',
  book: 'Nhà sách',
  gym: 'Phòng tập',
  cake: 'Tiệm bánh',
  bowl: 'Quán bún',
  tea: 'Tiệm trà',
};

export const INTERESTS: { key: string; label: string }[] = [
  { key: 'cafe', label: 'Cà phê' },
  { key: 'food', label: 'Ăn uống' },
  { key: 'shop', label: 'Mua sắm' },
  { key: 'travel', label: 'Du lịch' },
  { key: 'sport', label: 'Thể thao' },
  { key: 'book', label: 'Sách' },
  { key: 'movie', label: 'Phim ảnh' },
  { key: 'beauty', label: 'Làm đẹp' },
];

export const VEHICLE_PREFS: { key: VehicleClass; label: string }[] = [
  { key: 'bike', label: 'Xe máy' },
  { key: 'car4', label: 'Ô tô 4 chỗ' },
  { key: 'car7', label: 'Ô tô 7 chỗ' },
];

export const SAVED_PLACE_KINDS = [
  { key: 'school', label: 'Trường học' },
  { key: 'gym', label: 'Phòng tập' },
  { key: 'relative', label: 'Nhà người thân' },
  { key: 'other', label: 'Khác' },
] as const;

/** Điểm thưởng khi báo giá. */
export const POINTS_RULES = {
  tap: 10,
  amount: 50,
  receipt: 50,
  /** Nhân đôi khi báo giá ở nơi chưa có dữ liệu (VD Green SM). */
  noDataMultiplier: 2,
  /** Tối đa mỗi người mỗi ngày; vượt thì giữ lại để kiểm tra. */
  dailyCap: 300,
  /** Số tiền nhập lệch quá 30% so với khoảng ước tính thì không cộng điểm. */
  maxDeviation: 0.3,
} as const;
