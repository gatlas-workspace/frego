// Trang đăng nhập web quản lý (cổng doanh nghiệp, quản trị), phong cách Notion như các trang Web*.
import Link from 'next/link';
import type { Metadata } from 'next';
import { brand } from '@frego/core';
import { BizMark, Button, Callout, cx, Divider, FregoLogo, FregoMark, Input, WebIcon } from '@/components/web';
import { MODE } from '@/lib/server/data';
import { demoSignIn } from './actions';

export const metadata: Metadata = { title: 'Đăng nhập' };

type Role = 'biz' | 'admin';

function roleFromParam(v: string | string[] | undefined): Role | null {
  const s = Array.isArray(v) ? v[0] : v;
  if (s === 'quan-tri' || s === 'admin') return 'admin';
  if (s === 'doanh-nghiep' || s === 'biz') return 'biz';
  return null;
}

function Choice({ role, preselected }: { role: Role; preselected: boolean }) {
  const biz = role === 'biz';
  return (
    <button
      type="submit"
      name="role"
      value={role}
      autoFocus={preselected}
      className={cx(
        'flex w-full cursor-pointer items-center gap-3 rounded-frame border-0 px-3 py-3 text-left text-ink',
        preselected ? 'bg-blue-soft shadow-choice-on' : 'bg-white shadow-outline hover:bg-sidebar',
      )}
    >
      {biz ? <BizMark category="cafe" size={32} /> : <FregoMark size={32} />}
      <span className="flex min-w-0 flex-1 flex-col gap-px">
        <span className="text-[14px] font-medium">{biz ? 'Cổng doanh nghiệp · Cà phê Mây' : 'Quản trị Frego'}</span>
        <span className="text-[13px] text-ink-2">
          {biz ? 'Chiến dịch, ví và hóa đơn, báo cáo của quán' : 'Duyệt, tiền và đối soát, người dùng, dữ liệu'}
        </span>
      </span>
      <WebIcon name="chev" size={16} strokeWidth={2} className="text-nav-icon" />
    </button>
  );
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const wanted = roleFromParam((await searchParams)['vai-tro']);
  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <header className="px-6 py-5 max-[600px]:px-4">
        <FregoLogo text={brand.name} />
      </header>
      <main id="noi-dung" className="flex flex-1 justify-center px-4 pb-16 pt-[8vh] max-[600px]:pt-6">
        <div className="flex w-full max-w-[380px] flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-[28px] font-bold leading-[1.25] tracking-[-0.4px]">Đăng nhập Frego</h1>
            <p className="m-0 text-[14px] leading-normal text-ink-2">
              {wanted === 'admin'
                ? 'Đăng nhập để vào trang quản trị Frego.'
                : wanted === 'biz'
                  ? 'Đăng nhập để vào cổng doanh nghiệp.'
                  : 'Cổng doanh nghiệp tài trợ và trang quản trị Frego.'}
            </p>
          </div>

          {MODE === 'demo' ? (
            <>
              <Callout tone="blue" icon="info">
                Bản chạy thử: chọn nơi muốn vào, không cần mật khẩu. Số liệu là dữ liệu mẫu.
              </Callout>
              <form action={demoSignIn} className="flex flex-col gap-2" aria-label="Chọn nơi đăng nhập">
                {(wanted === 'admin' ? (['admin', 'biz'] as const) : (['biz', 'admin'] as const)).map((r) => (
                  <Choice key={r} role={r} preselected={wanted === r} />
                ))}
              </form>
            </>
          ) : (
            <form className="flex flex-col gap-3" aria-describedby="dang-nhap-supabase">
              <Input label="Email công việc" id="dn-email" name="email" type="email" autoComplete="email" placeholder="ten@cuahang.vn" />
              <Input label="Mật khẩu" id="dn-mat-khau" name="password" type="password" autoComplete="current-password" />
              <Button type="submit" variant="primary" block disabled>
                Đăng nhập
              </Button>
              <Callout tone="grey" icon="info">
                <span id="dang-nhap-supabase">
                  Đăng nhập bằng email được cấu hình qua Supabase Auth (mật khẩu hoặc mã OTP gửi về email). Tài khoản doanh
                  nghiệp được tạo sau khi Frego duyệt hồ sơ đăng ký.
                </span>
              </Callout>
            </form>
          )}

          <Divider />
          <p className="m-0 text-[14px] text-ink-2">
            Chưa có tài khoản?{' '}
            <Link href="/doanh-nghiep/dang-ky" className="font-medium text-blue-deep no-underline hover:underline">
              Đăng ký doanh nghiệp
            </Link>
          </p>
          <p className="m-0 text-[12px] leading-normal text-ink-2">
            Cần hỗ trợ: {brand.company.supportEmail} · {brand.company.hotline}
          </p>
        </div>
      </main>
    </div>
  );
}
