// DN 0 · Đăng ký doanh nghiệp (thiết kế WebDnDangKy.dc.html): trang đứng riêng, không thanh bên.
import type { Metadata } from 'next';
import { brand, formatVnd } from '@frego/core';
import { FregoLogo, StandalonePage, StepList } from '@/components/web';
import { MODE, getDb } from '@/lib/server/data';
import { RegisterForm } from './_components/RegisterForm';

export const metadata: Metadata = {
  title: 'Đăng ký doanh nghiệp',
  description: `Tặng mã giảm giá đặt xe cho người hay đi gần quán, chỉ trả khi mã được dùng.`,
};

export default async function Page() {
  // Supabase: chưa đăng nhập thì cần mật khẩu để tạo tài khoản chủ cửa hàng.
  const needPassword = MODE === 'supabase' && !(await getDb()).currentUserId();
  return (
    <StandalonePage
      aside={
        <>
          <FregoLogo />
          <div className="flex flex-col gap-1.5">
            <h2 className="m-0 text-[20px] font-bold leading-[1.35]">Đưa khách đặt xe tới quán bạn</h2>
            <p className="m-0 text-[14px] leading-[1.55] text-ink-2">
              Tặng mã giảm giá cho người hay đi gần quán. Bạn chỉ trả khi mã được dùng: giá trị giảm cộng{' '}
              {formatVnd(brand.serviceFeePerCode)} phí dịch vụ.
            </p>
          </div>
          <StepList steps={['Doanh nghiệp', 'Cửa hàng', 'Giấy tờ', 'Liên hệ']} />
          <p className="m-0 mt-auto text-[13px] leading-normal text-ink-2 max-[900px]:mt-0">
            Frego duyệt hồ sơ trong 1 ngày làm việc. Sau khi duyệt, bạn nạp ví và tạo chiến dịch đầu tiên.
          </p>
        </>
      }
    >
      <h1 className="m-0 mb-1 text-[28px] font-bold leading-[1.25] tracking-[-0.4px] max-[600px]:text-[24px]">Đăng ký doanh nghiệp</h1>
      <p className="m-0 mb-3 text-[14px] leading-normal text-ink-2">
        Thông tin này dùng để Frego xác minh cửa hàng có thật và đúng vị trí trên bản đồ.
      </p>
      <RegisterForm needPassword={needPassword} />
    </StandalonePage>
  );
}
