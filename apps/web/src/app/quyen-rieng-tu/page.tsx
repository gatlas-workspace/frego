import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@frego/core";
import { LegalList, LegalP, LegalPage, type LegalSection } from "@/components/landing/LegalPage";

const N = brand.name;

export const metadata: Metadata = {
  title: "Chính sách dữ liệu",
  description: `${N} dùng dữ liệu nào, để làm gì và bạn bật, tắt, xóa dữ liệu ra sao.`,
  alternates: { canonical: "/quyen-rieng-tu" },
  robots: { index: false, follow: true },
};

/**
 * Nội dung chỉ rút từ những gì thiết kế đã nói về dữ liệu (landing, màn Quyền dữ liệu,
 * màn Thông tin, màn Hỗ trợ của quản trị). BẢN NHÁP: cần pháp chế duyệt.
 */
const SECTIONS: LegalSection[] = [
  {
    id: "du-lieu-dung",
    title: `Dữ liệu ${N} dùng`,
    body: (
      <>
        <LegalP>
          {N} dùng điểm đến bạn tìm, voucher bạn gắn và giá bạn báo để tìm mã hợp với chuyến của bạn và so giá sau khi
          trừ mã.
        </LegalP>
        <LegalP>
          Giá bạn báo giúp {N} ước tính sát hơn cho mọi người. Đổi lại, bạn nhận điểm để đổi voucher.
        </LegalP>
      </>
    ),
  },
  {
    id: "lua-chon",
    title: `Bạn chọn chia sẻ gì với ${N}`,
    body: (
      <>
        <LegalP>
          Mỗi mục dưới đây bật, tắt riêng và đổi lại được bất cứ lúc nào trong mục Tài khoản của app.
        </LegalP>
        <LegalList
          items={[
            <>
              <b className="text-app-ink">Vị trí khi đang dùng app.</b> Chỉ dùng trong lúc bạn đang dùng app, để điền
              điểm đón và tính quãng đường.
            </>,
            <>
              <b className="text-app-ink">Góp dữ liệu tìm kiếm ẩn danh</b> (mặc định tắt). Gộp theo khu vực và khung giờ
              để giá ước tính sát hơn, không gắn với tên bạn.
            </>,
            <>
              <b className="text-app-ink">Voucher tặng riêng</b> (mặc định tắt). Nhãn hàng gần nơi bạn hay đến có thể
              tặng mã riêng. {N} không gửi lịch sử chuyến cho nhãn hàng.
            </>,
          ]}
        />
        <LegalP>Tắt cả ba mục, bạn vẫn so giá được bằng cách gõ điểm đón.</LegalP>
      </>
    ),
  },
  {
    id: "nhan-hang",
    title: "Nhãn hàng và quán tài trợ thấy gì",
    body: (
      <>
        <LegalP>
          Doanh nghiệp tài trợ chỉ xem số liệu tổng, như số mã đã tặng và số mã được dùng. Quán không biết người nhận mã
          là ai.
        </LegalP>
        <LegalP>
          Thông tin bạn tự thêm để nhận voucher hợp hơn (như sở thích, loại xe hay đi) cũng không được gửi cho nhãn hàng.
        </LegalP>
      </>
    ),
  },
  {
    id: "the-vi",
    title: "Liên kết thẻ, ví",
    body: (
      <LegalList
        items={[
          "Liên kết chỉ để lọc mã giảm giá hợp với thẻ, ví bạn dùng.",
          `${N} chỉ lưu tên ngân hàng, loại thẻ và tên ví.`,
          `${N} không lưu số thẻ hay mật khẩu.`,
        ]}
      />
    ),
  },
  {
    id: "quyen-cua-ban",
    title: "Xem và xóa dữ liệu",
    body: (
      <LegalList
        items={[
          "Bạn có thể xem hoặc xóa dữ liệu trong mục Quyền dữ liệu của app.",
          "Yêu cầu xóa dữ liệu được xử lý xong trong 30 ngày.",
          "Xóa tài khoản sẽ xóa lịch sử chuyến và điểm, chỉ giữ lại số liệu tổng đã gộp ẩn danh.",
        ]}
      />
    ),
  },
  {
    id: "doc-lap",
    title: `${N} và các hãng xe`,
    body: (
      <>
        <LegalP>
          {brand.independenceNote} {N} không đặt xe thay bạn: {N} tìm mã, so giá rồi mở app hãng để bạn tự đặt.
        </LegalP>
        <LegalP>
          Cách {N} cung cấp dịch vụ xem tại{" "}
          <Link href="/dieu-khoan" className="font-bold text-app-primary underline underline-offset-2">
            Điều khoản sử dụng
          </Link>
          .
        </LegalP>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Quyền riêng tư"
      title="Chính sách dữ liệu"
      intro={
        <p className="m-0">
          {N} làm việc cho người đặt xe. Trang này nói rõ {N} dùng dữ liệu nào, để làm gì và bạn kiểm soát dữ liệu của
          mình ra sao.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
