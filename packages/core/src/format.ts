/**
 * Định dạng hiển thị chuẩn Việt Nam: VND, dd/mm/yyyy, giờ Asia/Ho_Chi_Minh (UTC+7, không đổi giờ).
 * Viết tay thay vì Intl để chạy giống nhau trên Hermes (React Native), Node và trình duyệt.
 */

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
/** Dấu trừ dùng trong thiết kế (U+2212), không phải gạch nối. */
export const MINUS = '−';
/** Gạch nối khoảng (en dash) dùng cho khoảng giá, khoảng giờ. */
export const EN_DASH = '–';

/** 1250 → "1.250" */
export function formatNumber(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.round(Math.abs(n));
  return sign + String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 21000 → "21.000đ" */
export function formatVnd(n: number): string {
  return formatNumber(n) + 'đ';
}

/** (21000, 26000) → "21.000–26.000đ" */
export function formatVndRange(low: number, high: number): string {
  if (low === high) return formatVnd(low);
  return formatNumber(low) + EN_DASH + formatNumber(high) + 'đ';
}

/** 20000 → "−20.000đ" */
export function formatDiscount(n: number): string {
  return MINUS + formatVnd(Math.abs(n));
}

/** 20000 → "−20K"; 0.25 (phần trăm) → "−25%" */
export function formatDiscountShort(amount: number, percent?: number | null): string {
  if (percent) return MINUS + Math.round(percent * 100) + '%';
  if (amount % 1000 === 0) return MINUS + amount / 1000 + 'K';
  return formatDiscount(amount);
}

/** 0.31 → "31%" */
export function formatPercent(ratio: number, digits = 0): string {
  const v = ratio * 100;
  return (digits ? v.toFixed(digits).replace('.', ',') : String(Math.round(v))) + '%';
}

/** 5.8 → "5,8 km" */
export function formatKm(km: number): string {
  const rounded = Math.round(km * 10) / 10;
  return String(rounded).replace('.', ',') + ' km';
}

/** 210 → "210 m"; 1000 → "1 km" */
export function formatMeters(m: number): string {
  if (m >= 1000) return formatKm(m / 1000);
  return `${Math.round(m)} m`;
}

/** Thành phần ngày giờ theo giờ Việt Nam. */
export function vnParts(input: Date | string | number) {
  const d = new Date(new Date(input).getTime() + VN_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    weekday: d.getUTCDay(), // 0 = Chủ nhật
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** → "30/11/2026" */
export function formatDate(input: Date | string | number): string {
  const p = vnParts(input);
  return `${pad(p.day)}/${pad(p.month)}/${p.year}`;
}

/** → "30/11" */
export function formatDayMonth(input: Date | string | number): string {
  const p = vnParts(input);
  return `${pad(p.day)}/${pad(p.month)}`;
}

/** → "17:40" */
export function formatTime(input: Date | string | number): string {
  const p = vnParts(input);
  return `${pad(p.hour)}:${pad(p.minute)}`;
}

/** → "30/11/2026 17:40" */
export function formatDateTime(input: Date | string | number): string {
  return `${formatDate(input)} ${formatTime(input)}`;
}

const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

export function weekdayName(input: Date | string | number): string {
  return WEEKDAYS[vnParts(input).weekday];
}

/** Ngày bắt đầu (00:00 giờ VN) dưới dạng số để so sánh. */
function vnDayIndex(input: Date | string | number): number {
  return Math.floor((new Date(input).getTime() + VN_OFFSET_MS) / 86_400_000);
}

/** Nhóm theo ngày như màn Lịch sử: "Hôm nay", "Hôm qua", "Thứ Sáu, 20/11". */
export function formatDayGroup(input: Date | string | number, now: Date | number = Date.now()): string {
  const diff = vnDayIndex(now) - vnDayIndex(input);
  if (diff === 0) return 'Hôm nay';
  if (diff === 1) return 'Hôm qua';
  return `${weekdayName(input)}, ${formatDayMonth(input)}`;
}

/** "vừa xong", "5 phút trước", "2 giờ trước", "hôm qua", "8/11". */
export function formatRelative(input: Date | string | number, now: Date | number = Date.now()): string {
  const ms = new Date(now).getTime() - new Date(input).getTime();
  const min = Math.floor(ms / 60_000);
  if (min < 1) return 'vừa xong';
  if (min < 60) return `${min} phút trước`;
  const days = vnDayIndex(now) - vnDayIndex(input);
  if (days === 0) return `${Math.floor(min / 60)} giờ trước`;
  if (days === 1) return 'hôm qua';
  const p = vnParts(input);
  return `${p.day}/${p.month}`;
}

/** "0909123123" → "0909 ••• 123" */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^84/, '0');
  if (digits.length < 7) return phone;
  return `${digits.slice(0, 4)} ••• ${digits.slice(-3)}`;
}

/** Chuẩn hóa số điện thoại VN về dạng E.164 (+84…) để gửi OTP. */
export function toE164Vn(input: string): string | null {
  let d = input.replace(/\D/g, '');
  if (d.startsWith('84')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  if (!/^[35789]\d{8}$/.test(d)) return null;
  return '+84' + d;
}

/** "Minh Anh" → "MA" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Đọc số tiền người dùng gõ: "24.000", "24000", "24k" → 24000. */
export function parseVnd(input: string): number | null {
  const t = input.trim().toLowerCase().replace(/\s|đ|vnd/g, '');
  if (!t) return null;
  const k = /^(\d+(?:[.,]\d+)?)k$/.exec(t);
  if (k) return Math.round(parseFloat(k[1].replace(',', '.')) * 1000);
  const digits = t.replace(/[.,]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  return parseInt(digits, 10);
}

/** Đọc "30/11/2026" → Date (00:00 giờ VN). */
export function parseDateVn(input: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input.trim());
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  const date = new Date(Date.UTC(y, mo - 1, d) - VN_OFFSET_MS);
  if (vnParts(date).day !== d) return null;
  return date;
}
