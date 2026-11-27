import { brand } from "@frego/core";
import { Icon } from "@/components/Icon";
import { Eyebrow, H2, Lead, SEC, Wrap } from "./ui";

export const FAQ = [
  {
    q: `${brand.name} có thu phí người dùng không?`,
    a: `Không. Người đặt xe dùng ${brand.name} miễn phí. Tiền giảm của voucher tài trợ do quán trả, voucher đổi từ điểm do ${brand.name} trả.`,
  },
  {
    q: `${brand.name} có đặt xe giúp tôi không?`,
    a: `Chưa. ${brand.name} tìm mã và so giá, rồi mở app hãng để bạn đặt. Grab mở sẵn điểm đến, với Be và Green SM bạn dán địa chỉ ${brand.name} đã chép sẵn.`,
  },
  {
    q: `Giá trên ${brand.name} có chính xác không?`,
    a: "Đó là giá ước tính theo bảng giá của từng hãng, được chỉnh dần từ giá thật người dùng báo lại. Giá cuối cùng là giá trong app hãng lúc bạn đặt.",
  },
  {
    q: "Mã không dùng được thì sao?",
    a: `Bạn báo lỗi ngay trong chi tiết mã. Mã bị từ ${brand.autoHideReportThreshold} người báo trong 24 giờ sẽ tự ẩn để không ai mất công thử lại.`,
  },
  {
    q: `${brand.name} dùng dữ liệu nào của tôi?`,
    a: "Điểm đến bạn tìm, voucher bạn gắn và giá bạn báo. Liên kết thẻ, ví chỉ lưu tên ngân hàng, loại thẻ và tên ví. Bạn có thể xem hoặc xóa dữ liệu trong mục Quyền dữ liệu.",
  },
];

/** Câu hỏi thường gặp (#cau-hoi). Mở/đóng bằng <details> gốc của trình duyệt, không cần JavaScript. */
export function Faq() {
  return (
    <section id="cau-hoi" aria-labelledby="h-cau-hoi" className={`${SEC} bg-app-surface`}>
      <Wrap>
        <div className="flex items-start gap-20 max-[900px]:flex-col max-[900px]:gap-8">
          <div className="flex flex-[0_0_400px] flex-col gap-4 max-[900px]:flex-none">
            <Eyebrow>Câu hỏi</Eyebrow>
            <H2 id="h-cau-hoi">Câu hỏi thường gặp</H2>
            <Lead>
              Chưa thấy câu trả lời bạn cần? Gửi câu hỏi trong mục Tài khoản của app, {brand.name} trả lời trong ngày.
            </Lead>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3 max-[900px]:w-full">
            {FAQ.map((item, i) => (
              <details key={item.q} open={i === 0} className="group rounded-app-ticket bg-app-surface px-6 shadow-app-ring">
                <summary className="flex min-h-[76px] cursor-pointer list-none items-center gap-4 text-lg font-extrabold tracking-[-0.2px] [&::-webkit-details-marker]:hidden">
                  <span className="flex-1 py-3">{item.q}</span>
                  <span
                    aria-hidden="true"
                    className="flex size-9 flex-none items-center justify-center rounded-full bg-app-primary-soft text-app-primary transition-transform duration-200 group-open:[transform:rotate(45deg)]"
                  >
                    <Icon name="plus" size={18} strokeWidth={2.4} />
                  </span>
                </summary>
                <p className="m-0 max-w-[620px] pb-6 text-base leading-[1.65] text-app-ink-2">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </Wrap>
    </section>
  );
}
