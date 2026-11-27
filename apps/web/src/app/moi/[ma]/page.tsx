// Trang mời bạn bè công khai /moi/<mã> (V3-TrangMoi): mở được trong trình duyệt của Zalo, Facebook, không cần đăng nhập.
// Chỉ hiện tên đã che của chủ mã (RPC referral_owner_name), không có số điện thoại hay id.
import type { Metadata } from 'next';
import Link from 'next/link';
import { brand, normalizeReferralCode, POINTS_RULES } from '@frego/core';
import { getDb } from '@/lib/server/data';
import { InviteCode } from './_components/InviteCode';

type Params = Promise<{ ma: string }>;

async function ownerOf(raw: string): Promise<{ code: string; name: string | null }> {
  const code = normalizeReferralCode(decodeURIComponent(raw)).slice(0, 10);
  if (!code) return { code, name: null };
  try {
    const db = await getDb();
    const r = await db.rpc('referral_owner_name', { code });
    return { code, name: r?.ownerName ?? null };
  } catch {
    return { code, name: null };
  }
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code, name } = await ownerOf((await params).ma);
  return {
    title: name ? `${name} mời bạn đi xe rẻ hơn` : 'Mã mời không tồn tại',
    description: name
      ? `Nhập mã ${code} trên ${brand.name} để nhận ${POINTS_RULES.referral.referee} điểm sau chuyến đầu tiên.`
      : brand.shortPitch,
    robots: { index: false, follow: false },
  };
}

/** Link tải app: brand.web còn "#…" (chưa có link thật) thì về khối tải app ở trang chủ. */
function storeHref(url: string): string {
  return /^https?:\/\//.test(url) ? url : `/${url.startsWith('#') ? url : '#tai-app'}`;
}

export default async function InvitePage({ params }: { params: Params }) {
  const { code, name } = await ownerOf((await params).ma);
  const R = POINTS_RULES.referral;
  const btn =
    'flex min-h-[52px] items-center justify-center rounded-lg text-[16px] font-semibold no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col gap-5 bg-white px-[22px] py-6 text-ink">
      <p aria-label={brand.name} className="m-0 text-[22px] font-extrabold tracking-[-0.5px] text-frego">
        <Link href="/" className="text-frego no-underline">
          {brand.name}
        </Link>
      </p>

      {name ? (
        <>
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-[27px] font-bold leading-tight tracking-[-0.5px]">{name} mời bạn đi xe rẻ hơn</h1>
            <p className="m-0 text-[15px] leading-relaxed text-ink-2">
              {brand.name} gom mã Grab, Be, Green SM và quà của quán, gắn mã rồi mới so giá. Nhập mã mời để nhận{' '}
              <strong className="text-ink">{R.referee} điểm</strong> sau chuyến đầu tiên.
            </p>
          </div>

          <InviteCode code={code} />

          <ol className="m-0 flex flex-col gap-2 pl-5 text-[15px] leading-normal">
            <li>Tải {brand.name} và đăng nhập bằng số điện thoại.</li>
            <li>
              Nhập mã <strong>{code}</strong> ở bước tạo tài khoản, hoặc trong {R.enterDays} ngày đầu.
            </li>
            <li>
              Báo giá thật chuyến đầu tiên trong {R.qualifyDays} ngày để nhận {R.referee} điểm.
            </li>
          </ol>
        </>
      ) : (
        <div className="flex flex-col gap-2" role="status">
          <h1 className="m-0 text-[27px] font-bold leading-tight tracking-[-0.5px]">Không tìm thấy mã mời này</h1>
          <p className="m-0 text-[15px] leading-relaxed text-ink-2">
            Mã {code ? <strong className="text-ink">{code}</strong> : null} có thể đã gõ sai. Hỏi lại người mời, hoặc cứ tải{' '}
            {brand.name} để so giá Grab, Be, Green SM sau khi trừ voucher.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <a href={storeHref(brand.web.playStoreUrl)} className={`${btn} bg-blue-deep text-white hover:bg-blue-action`}>
          Tải trên Google Play
        </a>
        <a href={storeHref(brand.web.appStoreUrl)} className={`${btn} border border-line-strong bg-white text-ink hover:bg-hover`}>
          Tải trên App Store
        </a>
      </div>

      <p className="m-0 text-[12px] leading-relaxed text-ink-2">
        Đã có {brand.name}? Mở app, vào Tài khoản → Giới thiệu bạn bè để nhập mã. Chương trình thưởng một tầng, điểm không
        đổi ra tiền mặt.{' '}
        <Link href="/dieu-khoan" className="text-ink-2 underline">
          Thể lệ
        </Link>
      </p>
    </main>
  );
}
