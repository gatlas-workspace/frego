/**
 * Bóc biên nhận chuyến đi trong email (Grab, Be, Green SM) — hàm thuần, không gọi mạng.
 * Máy chủ web (apps/web/src/app/api/gmail/sync) đọc thư Gmail rồi gọi parseReceipt; kết quả đi vào RPC
 * record_receipt (supabase/migrations/20261127001100_gmail_receipts.sql, bản JS trong db/memory.ts).
 *
 * Địa chỉ gửi, tiêu đề và nhãn trong thư của các hãng CHƯA đối chiếu với thư thật: mọi quy tắc nằm trong
 * RECEIPT_RULES để sửa một chỗ khi có mẫu thật.
 */
import type { ISODate, ProviderId } from './types';

/* ───────────────────────── Kiểu dữ liệu ───────────────────────── */

/** Thư đầu vào (đã giải mã từ Gmail API). */
export interface ReceiptEmail {
  /** Header From, VD "Grab <no-reply@grab.com>" */
  from: string;
  subject: string;
  /** Thời điểm nhận thư (ISO hoặc chuỗi Date đọc được) */
  date: string;
  /** Phần text/plain */
  text?: string | null;
  /** Phần text/html */
  html?: string | null;
}

/** Kết quả bóc được. */
export interface ParsedReceipt {
  providerId: ProviderId;
  /** Tổng tiền đã trả (VND, sau giảm giá) */
  total: number;
  /** Thời gian chuyến ghi trong thư (giờ VN → ISO). Không có thì null, dùng ngày nhận thư. */
  tripAt: ISODate | null;
  /** Ngày nhận thư (ISO) */
  receivedAt: ISODate;
  pickup: string | null;
  dropoff: string | null;
  promoCode: string | null;
}

/** Kết nối Gmail của người dùng (bảng gmail_connections, người dùng đọc qua view gmail_connections_public — không có token). */
export interface GmailConnection {
  userId: string;
  email: string;
  status: 'active' | 'error';
  connectedAt: ISODate;
  lastSyncAt: ISODate | null;
  lastError: string | null;
  /** Chỉ chế độ DEMO: liên kết giả lập, không có Google thật. */
  demo?: boolean;
}

/** Biên nhận đã ghi (bảng gmail_receipts). Mỗi thư Gmail một dòng (khóa user + messageId). */
export interface GmailReceipt {
  id: string;
  userId: string;
  /** Id thư Gmail (chống ghi trùng) */
  messageId: string;
  providerId: ProviderId;
  paidAmount: number;
  receivedAt: ISODate;
  tripAt: ISODate | null;
  pickup: string | null;
  dropoff: string | null;
  promoCode: string | null;
  /** Chuyến Frego khớp được (null = chưa khớp) */
  tripId: string | null;
  /** matched: đã ghi giá vào chuyến · unmatched: không có chuyến hợp · already_reported: chuyến đã có số tiền */
  status: 'matched' | 'unmatched' | 'already_reported';
  pointsAwarded: number;
  /** Lý do giữ điểm (lệch > 30%, vượt giới hạn ngày) */
  held: string | null;
  createdAt: ISODate;
}

/* ───────────────────────── Quy tắc theo hãng (sửa ở đây) ───────────────────────── */

export interface ReceiptRule {
  providerId: ProviderId;
  /** Tên miền người gửi (khớp đúng hoặc tên miền con, VD "mail.grab.com" khớp "grab.com") */
  senderDomains: string[];
  /** Tiêu đề phải khớp một trong các mẫu (thư khuyến mãi cùng tên miền bị bỏ qua) */
  subjectHints: RegExp[];
  /** Tiêu đề có các chữ này là đơn đồ ăn / giao hàng, không phải chuyến xe */
  excludeHints: RegExp[];
}

export const RECEIPT_RULES: ReceiptRule[] = [
  {
    providerId: 'grab',
    senderDomains: ['grab.com'],
    subjectHints: [/receipt/i, /biên nhận/i, /hóa đơn|hoá đơn/i, /chuyến (đi|xe)/i],
    excludeHints: [/grabfood/i, /grabmart/i, /grabexpress/i, /đơn hàng/i, /food order/i],
  },
  {
    providerId: 'be',
    senderDomains: ['be.com.vn'],
    subjectHints: [/receipt/i, /biên nhận/i, /hóa đơn|hoá đơn/i, /chuyến (đi|xe)/i],
    excludeHints: [/befood/i, /bedelivery/i, /đơn hàng/i],
  },
  {
    providerId: 'gsm',
    senderDomains: ['xanhsm.com', 'greensm.com', 'greensm.com.vn', 'xanhsm.vn', 'gsm.vn'],
    subjectHints: [/receipt/i, /biên nhận/i, /hóa đơn|hoá đơn/i, /chuyến (đi|xe)/i],
    excludeHints: [/xanh express/i, /đơn hàng/i, /giao hàng/i],
  },
];

/** Nhãn dòng tổng tiền (so sau khi bỏ dấu, chữ thường). Thứ tự = ưu tiên. */
const TOTAL_LABELS = [
  'tong thanh toan',
  'tong cong',
  'total paid',
  'amount paid',
  'ban da tra',
  'so tien thanh toan',
  'tong tien',
  'thanh toan',
  'total',
];
const PICKUP_LABELS = ['diem don', 'don tai', 'noi don', 'pick-up', 'pickup', 'pick up', 'from'];
const DROPOFF_LABELS = ['diem den', 'diem tra', 'tra tai', 'noi den', 'drop-off', 'dropoff', 'drop off', 'to'];
const PROMO_LABELS = ['ma khuyen mai', 'ma giam gia', 'ma uu dai', 'khuyen mai', 'promo code', 'promotion', 'promo', 'voucher'];
const TIME_LABELS = ['thoi gian don', 'gio don', 'thoi gian', 'ngay di', 'pick-up time', 'pickup time', 'trip date', 'date'];

/** Số tiền hợp lệ cho một chuyến (như RPC report_price: tối đa 5.000.000đ). */
const MIN_TOTAL = 1_000;
const MAX_TOTAL = 5_000_000;

/* ───────────────────────── Tiện ích ───────────────────────── */

function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Địa chỉ email trong header From: "Grab <no-reply@grab.com>" → "no-reply@grab.com". */
export function senderAddress(from: string): string {
  const m = from.match(/<([^>]+)>/);
  return (m ? m[1]! : from).trim().toLowerCase();
}

function domainMatches(address: string, domains: string[]): boolean {
  const host = address.split('@')[1] ?? '';
  return domains.some((d) => host === d || host.endsWith('.' + d));
}

const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'" };

/** HTML → chữ, mỗi ô/dòng bảng một dòng. */
export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|td|th|li|h[1-6]|table|section)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z0-9#]+);/gi, (m, n: string) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/[ \t ]+/g, ' ')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Số tiền VND trong chuỗi: "25.000 ₫", "25,000đ", "VND 25.000", "₫25,000", "25.000 VNĐ", "25,000.00 VND", "25.000 đồng".
 * Bắt buộc có ký hiệu tiền tệ để không nhầm với số khác (năm, mã chuyến…). Trả số tiền đầu tiên tìm thấy.
 */
export function parseVndAmount(s: string): number | null {
  const NUM = '(\\d{1,3}(?:[.,]\\d{3})+|\\d{4,})(?:[.,]\\d{1,2}(?!\\d))?';
  const CUR_AFTER = '(?:vnđ|vnd|đồng|dong|₫|đ)(?![\\p{L}\\d])';
  const CUR_BEFORE = '(?:₫|vnđ|vnd)';
  const re = new RegExp(`${CUR_BEFORE}\\s*${NUM}|${NUM}\\s*${CUR_AFTER}`, 'iu');
  const m = s.match(re);
  if (!m) return null;
  const digits = (m[1] ?? m[2] ?? '').replace(/[.,]/g, '');
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Giờ VN (UTC+7) → ISO. */
function vnIso(y: number, mo: number, d: number, h = 0, mi = 0): string | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
  const t = Date.UTC(y, mo - 1, d, h - 7, mi);
  const back = new Date(t + 7 * 3600_000);
  if (back.getUTCDate() !== d) return null;
  return new Date(t).toISOString();
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Ngày giờ trong một dòng chữ (giờ VN): "22/11/2026 17:58", "17:58 22/11/2026", "22 Nov 2026 5:58 PM", "22 tháng 11, 2026 17:58". */
export function parseVnDateTime(line: string): string | null {
  const s = fold(line);
  const time = (str: string): [number, number] | null => {
    const t = str.match(/(\d{1,2})[:h](\d{2})\s*(am|pm|sa|ch)?/);
    if (!t) return null;
    let h = Number(t[1]);
    const mi = Number(t[2]);
    const ap = t[3];
    if ((ap === 'pm' || ap === 'ch') && h < 12) h += 12;
    if ((ap === 'am' || ap === 'sa') && h === 12) h = 0;
    return [h, mi];
  };
  let m = s.match(/(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) {
    const rest = s.replace(m[0], ' ');
    const hm = time(rest) ?? [0, 0];
    return vnIso(Number(m[3]), Number(m[2]), Number(m[1]), hm[0], hm[1]);
  }
  m = s.match(/(\d{1,2})\s+thang\s+(\d{1,2}),?\s+(?:nam\s+)?(\d{4})/);
  if (m) {
    const hm = time(s.replace(m[0], ' ')) ?? [0, 0];
    return vnIso(Number(m[3]), Number(m[2]), Number(m[1]), hm[0], hm[1]);
  }
  m = s.match(/(\d{1,2})\s+([a-z]{3})[a-z]*,?\s+(\d{4})/);
  if (m && MONTHS[m[2]!]) {
    const hm = time(s.replace(m[0], ' ')) ?? [0, 0];
    return vnIso(Number(m[3]), MONTHS[m[2]!]!, Number(m[1]), hm[0], hm[1]);
  }
  m = s.match(/([a-z]{3})[a-z]*\s+(\d{1,2}),?\s+(\d{4})/);
  if (m && MONTHS[m[1]!]) {
    const hm = time(s.replace(m[0], ' ')) ?? [0, 0];
    return vnIso(Number(m[3]), MONTHS[m[1]!]!, Number(m[2]), hm[0], hm[1]);
  }
  return null;
}

/**
 * Dòng bắt đầu bằng nhãn (so sau khi bỏ dấu, bỏ qua ký tự không phải chữ ở đầu dòng); trả phần sau nhãn.
 * Chỉ nhận nhãn ở đầu dòng để "to", "from" trong câu thường không bị hiểu nhầm.
 */
function afterLabel(line: string, labels: string[]): string | null {
  const f = fold(line);
  const lead = f.match(/^[^a-z0-9]*/)![0].length;
  for (const label of labels) {
    if (!f.startsWith(label, lead)) continue;
    const end = lead + label.length;
    const next = f[end];
    if (next && /[a-z0-9]/.test(next)) continue;
    return line.slice(originalIndex(line, end)).replace(/^[\s:：\-–—]+/, '').trim();
  }
  return null;
}

/** Vị trí trong chuỗi gốc ứng với vị trí `foldedIdx` trong fold(chuỗi). */
function originalIndex(line: string, foldedIdx: number): number {
  let acc = 0;
  for (let i = 0; i < line.length; i++) {
    if (acc >= foldedIdx) return i;
    acc += fold(line[i]!).length;
  }
  return line.length;
}

/** Giá trị của nhãn: phần còn lại cùng dòng, hoặc dòng kế tiếp nếu cùng dòng trống. */
function labelValue(lines: string[], labels: string[], accept: (v: string) => boolean): string | null {
  for (let i = 0; i < lines.length; i++) {
    const rest = afterLabel(lines[i]!, labels);
    if (rest === null) continue;
    if (rest && accept(rest)) return rest;
    const next = lines[i + 1];
    if (!rest && next && accept(next)) return next;
  }
  return null;
}

function cleanPlace(v: string | null): string | null {
  if (!v) return null;
  const s = v.replace(/\s+/g, ' ').trim().slice(0, 200);
  return s.length >= 3 ? s : null;
}

/* ───────────────────────── API ───────────────────────── */

/** Hãng của thư (theo tên miền người gửi + tiêu đề), hoặc null nếu không phải biên nhận chuyến xe. */
export function detectReceiptProvider(email: Pick<ReceiptEmail, 'from' | 'subject'>): ProviderId | null {
  const addr = senderAddress(email.from);
  for (const r of RECEIPT_RULES) {
    if (!domainMatches(addr, r.senderDomains)) continue;
    if (!r.subjectHints.some((h) => h.test(email.subject))) return null;
    if (r.excludeHints.some((h) => h.test(email.subject))) return null;
    return r.providerId;
  }
  return null;
}

/** Chuỗi tìm kiếm Gmail cho các thư biên nhận trong `days` ngày gần nhất. */
export function gmailReceiptQuery(days: number): string {
  const domains = RECEIPT_RULES.flatMap((r) => r.senderDomains);
  return `from:(${domains.join(' OR ')}) newer_than:${Math.max(1, Math.floor(days))}d`;
}

/** Bóc biên nhận. Trả null nếu không phải biên nhận chuyến xe hoặc không tìm được tổng tiền hợp lệ. */
export function parseReceipt(email: ReceiptEmail): ParsedReceipt | null {
  const text = email.text?.trim() ? email.text : email.html ? htmlToText(email.html) : '';
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/[ \t ]+/g, ' ').trim())
    .filter(Boolean);
  const providerId = detectReceiptProvider(email);
  if (!providerId) return null;

  // Tổng tiền: theo thứ tự ưu tiên nhãn; số tiền ở cùng dòng hoặc 2 dòng kế.
  let total: number | null = null;
  for (const label of TOTAL_LABELS) {
    for (let i = 0; i < lines.length && total === null; i++) {
      const rest = afterLabel(lines[i]!, [label]);
      if (rest === null) continue;
      // Có chữ sau nhãn thì chỉ xét chính dòng đó ("Thanh toán bằng tiền mặt" không lấy số của dòng dưới).
      const cands = rest ? [rest] : [lines[i + 1] ?? '', lines[i + 2] ?? ''];
      for (const cand of cands) {
        const n = parseVndAmount(cand);
        if (n !== null) {
          total = n;
          break;
        }
      }
    }
    if (total !== null) break;
  }
  if (total === null || total < MIN_TOTAL || total > MAX_TOTAL) return null;

  const timeText = labelValue(lines, TIME_LABELS, (v) => parseVnDateTime(v) !== null);
  let tripAt = timeText ? parseVnDateTime(timeText) : null;
  if (!tripAt) {
    for (const l of lines) {
      tripAt = parseVnDateTime(l);
      if (tripAt) break;
    }
  }

  const notAmount = (v: string) => parseVndAmount(v) === null && parseVnDateTime(v) === null;
  const pickup = cleanPlace(labelValue(lines, PICKUP_LABELS, notAmount));
  const dropoff = cleanPlace(labelValue(lines, DROPOFF_LABELS, notAmount));

  const promoLine = labelValue(lines, PROMO_LABELS, (v) => /\b[A-Z][A-Z0-9]{3,19}\b/.test(v));
  const promoCode =
    promoLine
      ?.match(/\b[A-Z][A-Z0-9]{3,19}\b/g)
      ?.find((c) => !['VND', 'VNĐ', 'TOTAL', 'GRAB', 'PROMO', 'VOUCHER'].includes(c)) ?? null;

  const received = new Date(email.date);
  const receivedAt = Number.isNaN(received.getTime()) ? new Date(0).toISOString() : received.toISOString();

  return { providerId, total, tripAt, receivedAt, pickup, dropoff, promoCode };
}
