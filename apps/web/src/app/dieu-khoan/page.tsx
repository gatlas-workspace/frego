import type { Metadata } from "next";
import Link from "next/link";
import { brand, formatNumber, formatVnd, POINTS_RULES, PROVIDER_ORDER, PROVIDERS, serviceShortLabel } from "@frego/core";
import { LegalList, LegalP, LegalPage, type LegalSection } from "@/components/landing/LegalPage";

const N = brand.name;
const PROVIDER_NAMES = PROVIDER_ORDER.map((p) => PROVIDERS[p].name).join(", ");

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description: `Điều khoản sử dụng app ${N}: voucher, so giá ước tính, điểm thưởng và phí cho doanh nghiệp tài trợ.`,
  alternates: { canonical: "/dieu-khoan" },
  robots: { index: false, follow: true },
};

/** Nội dung chỉ rút từ những gì landing và thiết kế app đã nêu. BẢN NHÁP: cần pháp chế duyệt. */
const SECTIONS: LegalSection[] = [
  {
    id: "dich-vu",
    title: `${N} là gì`,
    body: (
      <>
        <LegalP>
          {N} là app voucher đặt xe công nghệ. {brand.shortPitch}
        </LegalP>
        <LegalP>
          {brand.independenceNote} {PROVIDER_NAMES} là thương hiệu của các công ty tương ứng.
        </LegalP>
      </>
    ),
  },
  {
    id: "dat-xe",
    title: `${N} không đặt xe thay bạn`,
    body: (
      <LegalList
        items={[
          `${N} tìm mã, so giá rồi mở app hãng để bạn tự đặt.`,
          `Grab mở sẵn điểm đến, bạn chỉ cần nhập mã. Với Be, Green SM, ${N} chép sẵn địa chỉ để bạn dán.`,
          "Giá cuối cùng do app hãng hiển thị lúc bạn đặt.",
        ]}
      />
    ),
  },
  {
    id: "gia-uoc-tinh",
    title: "Giá ước tính",
    body: (
      <LegalP>
        Giá trên {N} là giá ước tính theo bảng giá của từng hãng, đã trừ voucher bạn gắn, và được chỉnh dần từ giá thật
        người dùng báo lại. Giá cuối cùng là giá trong app hãng lúc bạn đặt.
      </LegalP>
    ),
  },
  {
    id: "voucher",
    title: "Voucher và mã giảm giá",
    body: (
      <LegalList
        items={[
          "Voucher tài trợ do quán, cửa hàng tặng cho người đi tới gần quán, có hạn dùng và khung giờ ghi rõ.",
          "Hết ngân sách thì quán ngừng tặng, mã đã có trong Ví vẫn dùng đến hết hạn.",
          "Mã công khai của hãng xe, ngân hàng, ví điện tử ghi rõ nguồn và lần kiểm tra gần nhất.",
          `Mã không dùng được thì bạn báo lỗi trong chi tiết mã. Mã bị từ ${brand.autoHideReportThreshold} người báo trong 24 giờ sẽ tự ẩn.`,
          `Quà chào mừng: nhập điểm đến đầu tiên để nhận mã ${brand.welcomeCode} giảm ${formatVnd(brand.welcomeAmount)} cho chuyến ${serviceShortLabel("be", "bike")}.`,
        ]}
      />
    ),
  },
  {
    id: "diem-thuong",
    title: "Điểm thưởng",
    body: (
      <LegalList
        items={[
          `+${POINTS_RULES.tap} điểm khi chạm một lần cho biết giá thật rẻ hơn, đúng khoảng hay đắt hơn ước tính.`,
          `+${POINTS_RULES.amount} điểm khi nhập số tiền đã trả.`,
          `Đổi ${formatNumber(500)}, ${formatNumber(1000)} hoặc ${formatNumber(1500)} điểm lấy voucher do ${N} tài trợ. Voucher vào Ví ngay khi đổi.`,
        ]}
      />
    ),
  },
  {
    id: "phi",
    title: "Phí",
    body: (
      <>
        <LegalP>
          Người đặt xe dùng {N} miễn phí. Tiền giảm của voucher tài trợ do quán trả, voucher đổi từ điểm do {N} trả.
        </LegalP>
        <LegalP>
          Doanh nghiệp tài trợ chỉ trả khi mã được dùng: giá trị giảm cộng {formatVnd(brand.serviceFeePerCode)} phí dịch
          vụ mỗi mã. Doanh nghiệp nạp ví trước, {N} trừ mỗi ngày cho mã đã dùng hôm trước. Chiến dịch được {N} duyệt
          trước khi tặng mã, và có thể tạm dừng hoặc tăng ngân sách bất cứ lúc nào.
        </LegalP>
      </>
    ),
  },
  {
    id: "du-lieu",
    title: "Dữ liệu của bạn",
    body: (
      <LegalP>
        {N} chỉ lưu tên ngân hàng, loại thẻ và tên ví, không lưu số thẻ hay mật khẩu. Doanh nghiệp chỉ xem số liệu tổng,
        không thấy người nhận mã. Chi tiết xem tại{" "}
        <Link href="/quyen-rieng-tu" className="font-bold text-app-primary underline underline-offset-2">
          Chính sách dữ liệu
        </Link>
        .
      </LegalP>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Pháp lý"
      title="Điều khoản sử dụng"
      intro={
        <p className="m-0">
          Trang này nói rõ cách {N} phục vụ người đặt xe và doanh nghiệp tài trợ. {N} do {brand.company.legalName} vận hành.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
