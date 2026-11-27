import { initials as initialsOf, PROVIDERS, type CategoryKey, type ProviderId } from '@frego/core';
import { cx } from './cx';
import { WebIcon } from './WebIcon';
import { PROVIDER_LOGO_SRC } from '@/components/app/ProviderLogo';

/* Các ô biểu tượng nhỏ: logo Frego, logo quán theo ngành, logo hãng xe, ảnh đại diện chữ cái. Đều là trang trí (aria-hidden). */

/** Logo chữ F tím của Frego (thanh bên quản trị 20px, khung trang đứng riêng 24px). */
export function FregoMark({ size = 20, className }: { size?: 20 | 24 | 32 | 40; className?: string }) {
  const look = { 20: 'rounded-ctl text-[12px]', 24: 'rounded-[5px] text-[13px]', 32: 'rounded-mark text-[16px]', 40: 'rounded-tile text-[20px]' }[size];
  return (
    <span
      aria-hidden="true"
      className={cx('flex flex-none items-center justify-center bg-frego font-bold leading-none text-white', look, className)}
      style={{ width: size, height: size }}
    >
      F
    </span>
  );
}

const category: Record<CategoryKey, { bg: string; icon: 'cup' | 'bowl' | 'lotus' | 'gym' | 'book' | 'cake' }> = {
  cafe: { bg: 'bg-app-logo-cup', icon: 'cup' },
  bowl: { bg: 'bg-app-logo-bowl', icon: 'bowl' },
  tea: { bg: 'bg-app-logo-lotus', icon: 'lotus' },
  gym: { bg: 'bg-app-logo-gym', icon: 'gym' },
  book: { bg: 'bg-app-logo-book', icon: 'book' },
  cake: { bg: 'bg-app-logo-cake', icon: 'cake' },
};

/** Cỡ ô theo thiết kế: 20 (thanh bên), 32 (hàng chờ duyệt), 40 (đầu chi tiết), 44 (ảnh chiến dịch), 48 (hồ sơ). */
export type BizMarkSize = 20 | 32 | 40 | 44 | 48;
const bizLook: Record<BizMarkSize, { radius: string; icon: number; stroke: number }> = {
  20: { radius: 'rounded-ctl', icon: 13, stroke: 2.2 },
  32: { radius: 'rounded-mark', icon: 17, stroke: 2 },
  40: { radius: 'rounded-tile', icon: 22, stroke: 2 },
  44: { radius: 'rounded-tile', icon: 24, stroke: 2 },
  48: { radius: 'rounded-tile', icon: 26, stroke: 2 },
};

/** Logo quán theo ngành (cà phê, trà, phòng tập…): ô màu + icon trắng. */
export function BizMark({ category: cat, size = 32, className }: { category: CategoryKey; size?: BizMarkSize; className?: string }) {
  const c = category[cat] ?? category.cafe;
  const l = bizLook[size];
  return (
    <span
      aria-hidden="true"
      className={cx('flex flex-none items-center justify-center text-white', c.bg, l.radius, className)}
      style={{ width: size, height: size }}
    >
      <WebIcon name={c.icon} size={l.icon} strokeWidth={l.stroke} />
    </span>
  );
}

const providerBg: Record<ProviderId, string> = {
  grab: 'bg-app-veh-grab text-white',
  be: 'bg-app-veh-be text-ink',
  gsm: 'bg-app-veh-gsm text-white',
};
/** 16 (hàng chờ), 18 (bảng), 20 (dòng thanh đo), 24 (danh sách hãng). */
export type ProviderMarkSize = 16 | 18 | 20 | 24;
const providerRadius: Record<ProviderMarkSize, string> = {
  16: 'rounded-ctl',
  18: 'rounded-ctl',
  20: 'rounded-[5px]',
  24: 'rounded-[6px]',
};

/**
 * Logo hãng xe. Bản thiết kế dùng ảnh logo chưa kèm theo, nên tạm vẽ ô màu hãng + chữ viết tắt
 * (`PROVIDERS[id].mono`, cùng cách với thành phần app). Có file logo thì truyền `src`.
 */
export function ProviderMark({
  provider,
  size = 18,
  src,
  className,
}: {
  provider: ProviderId;
  size?: ProviderMarkSize;
  src?: string;
  className?: string;
}) {
  const box = cx('flex-none overflow-hidden shadow-[0_0_0_1px_rgba(15,15,15,0.08)]', providerRadius[size], className);
  src ??= PROVIDER_LOGO_SRC[provider];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- logo nhỏ, tĩnh
    return <img src={src} alt="" aria-hidden="true" width={size} height={size} className={cx(box, 'block object-cover')} />;
  }
  return (
    <span
      aria-hidden="true"
      className={cx(box, 'flex items-center justify-center font-extrabold leading-none tracking-[-0.02em]', providerBg[provider])}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}
    >
      {PROVIDERS[provider].mono}
    </span>
  );
}

/** Ảnh đại diện chữ cái: 20 (trong bảng), 28 (danh sách thành viên), 40 (đầu chi tiết người dùng). */
export function Avatar({
  name,
  initials,
  size = 28,
  className,
}: {
  /** Tên đầy đủ → tự lấy chữ cái đầu (vd. "Minh Anh" → "MA"). */
  name?: string;
  /** Chữ cái ghi sẵn, vd. "CM". */
  initials?: string;
  size?: 20 | 28 | 40;
  className?: string;
}) {
  const text = initials ?? (name ? initialsOf(name) : '');
  const font = { 20: 'text-[10px]', 28: 'text-[12px]', 40: 'text-[14px]' }[size];
  return (
    <span
      aria-hidden="true"
      className={cx(
        'flex flex-none items-center justify-center rounded-full bg-tag-grey font-semibold leading-none text-tag-grey-ink',
        font,
        className,
      )}
      style={{ width: size, height: size }}
    >
      {text}
    </span>
  );
}
