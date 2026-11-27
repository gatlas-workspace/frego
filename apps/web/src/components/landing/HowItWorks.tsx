import { brand, formatVndRange, POINTS_RULES } from "@frego/core";
import { PushNotif } from "@/components/app";
import { H2, IconTile, Wrap } from "./ui";

const STEPS = [
  {
    icon: "pin",
    title: "Nhập điểm đến",
    body: "Gõ nơi bạn muốn đến hoặc chạm một địa điểm đã lưu như Nhà, Công ty.",
  },
  {
    icon: "ticket",
    title: "Gắn voucher",
    body: `${brand.name} gợi ý mã của quán gần điểm đến và mã hợp thẻ, ví của bạn. Chạm Gắn để dùng cho chuyến này.`,
  },
  {
    icon: "compare",
    title: "So giá sau voucher",
    body: "Xem giá Grab, Be, Green SM đã trừ mã, theo từng loại xe, xếp từ rẻ đến đắt.",
  },
  {
    icon: "external",
    title: "Mở app hãng, nhập mã",
    body: `Grab mở sẵn điểm đến, bạn chỉ cần nhập mã. Với Be, Green SM, ${brand.name} chép sẵn địa chỉ để bạn dán.`,
  },
] as const;

/** Mục "Cách dùng": bốn bước + thẻ "Sau chuyến". */
export function HowItWorks() {
  return (
    <section
      id="cach-dung"
      aria-labelledby="h-cach-dung"
      className="relative bg-app-surface pb-20 pt-[104px] max-[640px]:pt-16"
    >
      <Wrap>
        <div className="flex flex-col items-center gap-3.5 text-center">
          <p className="m-0 text-sm font-extrabold uppercase tracking-[0.6px] text-app-primary">Cách dùng</p>
          <H2 id="h-cach-dung">Bốn bước trước mỗi chuyến</H2>
          <p className="m-0 max-w-[640px] text-lg leading-[1.6] text-app-ink-2">
            {brand.name} không đặt xe thay bạn. {brand.name} tìm mã, so giá rồi đưa bạn sang app hãng với mã đã sẵn sàng.
          </p>
        </div>

        <ol className="mb-0 mt-14 grid list-none grid-cols-4 gap-6 p-0 max-[1100px]:grid-cols-2 max-[640px]:grid-cols-1">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex flex-col gap-3.5 rounded-[28px] bg-app-bg px-6 pb-[30px] pt-7">
              <div className="flex items-center justify-between">
                <IconTile name={s.icon} />
                <span aria-hidden="true" className="text-[44px] font-extrabold leading-none text-app-on-primary-soft">
                  {i + 1}
                </span>
              </div>
              <h3 className="mb-0 mt-1.5 text-[21px] font-extrabold leading-[1.3] tracking-[-0.3px]">
                <span className="sr-only">Bước {i + 1}. </span>
                {s.title}
              </h3>
              <p className="m-0 text-[15px] leading-[1.6] text-app-ink-2">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex items-center gap-10 rounded-[28px] bg-app-surface px-8 py-7 shadow-app-ring max-[900px]:flex-col max-[900px]:items-stretch">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <h3 className="m-0 text-[21px] font-extrabold tracking-[-0.3px]">
              Sau chuyến, {brand.name} báo khi mã được dùng
            </h3>
            <p className="m-0 text-base leading-[1.6] text-app-ink-2">
              Bạn không cần quay lại app. Khi hãng ghi nhận mã, {brand.name} gửi thông báo. Chạm một lần để cho biết giá
              thật rẻ hơn, đúng khoảng hay đắt hơn ước tính, và nhận {POINTS_RULES.tap} điểm.
            </p>
          </div>
          <div aria-hidden="true" className="min-w-0 flex-[0_0_380px] max-[900px]:w-full max-[900px]:flex-none">
            <PushNotif
              title={`Mã ${brand.welcomeCode} vừa được dùng cho chuyến Be`}
              body={`Giá thật so với ước tính ${formatVndRange(31000, 36000)}? Chạm để trả lời, nhận ${POINTS_RULES.tap} điểm.`}
              time="08:52"
            />
          </div>
        </div>
      </Wrap>
    </section>
  );
}
