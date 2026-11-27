import { brand } from "@frego/core";
import { GlowCircle, H2, IconTile, SEC, Wrap } from "./ui";

const PROMISES = [
  {
    icon: "gift",
    title: "Miễn phí cho người đặt xe",
    body: `Quán tài trợ trả tiền khi mã được dùng. Bạn không trả gì cho ${brand.name}.`,
  },
  {
    icon: "shield",
    title: "Không lưu số thẻ, mật khẩu",
    body: `Liên kết chỉ để lọc mã. ${brand.name} lưu tên ngân hàng, loại thẻ và tên ví.`,
  },
  {
    icon: "user",
    title: "Quán không biết bạn là ai",
    body: "Doanh nghiệp chỉ xem số liệu tổng, không thấy người nhận mã.",
  },
] as const;

/** Mục cam kết trên nền tím (#rieng-tu). */
export function Promises() {
  return (
    <section id="rieng-tu" aria-labelledby="h-rieng-tu" className={`${SEC} land-on-primary overflow-hidden bg-app-primary`}>
      <GlowCircle className="-right-[140px] -top-[180px]" />
      <Wrap className="flex flex-col gap-11">
        <H2 id="h-rieng-tu" onPrimary>
          {brand.name} làm việc cho người đặt xe
        </H2>
        <div className="grid grid-cols-3 gap-12 max-[900px]:grid-cols-1 max-[900px]:gap-8">
          {PROMISES.map((p) => (
            <div key={p.title} className="flex flex-col gap-3.5">
              <IconTile name={p.icon} onPrimary />
              <h3 className="m-0 text-[22px] font-extrabold tracking-[-0.3px] text-white">{p.title}</h3>
              <p className="m-0 text-base leading-[1.6] text-app-on-primary-soft">{p.body}</p>
            </div>
          ))}
        </div>
      </Wrap>
    </section>
  );
}
