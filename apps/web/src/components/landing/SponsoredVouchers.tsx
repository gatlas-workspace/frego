import { formatDate, formatDiscount, formatMeters, serviceShortLabel } from "@frego/core";
import { Icon } from "@/components/Icon";
import { VoucherTicket } from "@/components/app";
import { CheckList, Eyebrow, Feature, FeatureArt, FeatureCopy, H2, Lead, Panel, SEC, Wrap } from "./ui";

/** Mục "Voucher tài trợ" (#voucher). */
export function SponsoredVouchers() {
  return (
    <section id="voucher" aria-labelledby="h-voucher" className={`${SEC} bg-app-surface`}>
      <Wrap>
        <Feature>
          <FeatureCopy>
            <Eyebrow>Voucher tài trợ</Eyebrow>
            <H2 id="h-voucher">Đi tới gần quán nào, quán đó tặng mã</H2>
            <Lead>
              Các quán, cửa hàng trả một phần tiền xe cho người đi tới gần quán. Khi điểm đến của bạn nằm trong vùng tài
              trợ, mã hiện ngay ở bước gắn voucher.
            </Lead>
            <CheckList
              items={[
                "Mã tặng riêng cho người hay đi khu đó, có hạn dùng và khung giờ ghi rõ",
                "Quán chỉ thấy số liệu tổng như số mã được dùng, không biết bạn là ai",
                "Hết ngân sách thì quán ngừng tặng, mã đã có trong Ví vẫn dùng đến hết hạn",
              ]}
            />
          </FeatureCopy>

          <FeatureArt>
            <Panel className="bg-app-bg">
              <div className="flex flex-wrap items-center gap-3 rounded-[20px] bg-app-surface px-4 py-3.5 shadow-app-soft">
                <span className="flex size-10 flex-none items-center justify-center rounded-full bg-app-primary-soft text-app-primary">
                  <Icon name="pinok" size={20} strokeWidth={2} />
                </span>
                <span className="flex min-w-[160px] flex-1 flex-col gap-px">
                  <span className="text-[13px] text-app-muted">Điểm đến</span>
                  <span className="text-base font-extrabold">Chợ Bến Thành, Quận 1</span>
                </span>
                <span className="rounded-full bg-app-deal px-3 py-[5px] text-[13px] font-bold text-app-deal-ink">
                  2 quán tài trợ gần đây
                </span>
              </div>
              <div aria-hidden="true" className="flex flex-col gap-3.5">
                <VoucherTicket
                  mode="static"
                  logo="cup"
                  amount={formatDiscount(20000)}
                  service={serviceShortLabel("grab", "car4")}
                  tag="sponsor"
                  title="Cà phê Mây"
                  line={`Cách điểm đến ${formatMeters(120)} · tặng vì bạn hay đến khu này`}
                  lineIcon="spark"
                  meta={`HSD ${formatDate("2026-11-30T05:00:00Z")}`}
                />
                <VoucherTicket
                  mode="static"
                  logo="lotus"
                  amount={formatDiscount(10000)}
                  service={serviceShortLabel("be", "bike")}
                  tag="sponsor"
                  title="Tiệm trà Sen"
                  line={`Cách điểm đến ${formatMeters(150)} · áp dụng 7:00–11:00`}
                  meta={`HSD ${formatDate("2026-12-05T05:00:00Z")}`}
                />
              </div>
            </Panel>
          </FeatureArt>
        </Feature>
      </Wrap>
    </section>
  );
}
