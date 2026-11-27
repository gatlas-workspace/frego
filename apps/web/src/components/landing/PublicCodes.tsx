import { brand, formatVnd } from "@frego/core";
import { Icon } from "@/components/Icon";
import { CodeCard } from "@/components/app";
import { CheckList, Eyebrow, Feature, FeatureArt, FeatureCopy, H2, Lead, Panel, SEC, Wrap } from "./ui";

const LINKED = ["VPBank · thẻ tín dụng", "MoMo", "Gmail"];

/** Mục "Mã công khai" (#ma-cong-khai). Trên máy tính hình bên trái, xếp dọc thì chữ lên trước. */
export function PublicCodes() {
  return (
    <section id="ma-cong-khai" aria-labelledby="h-ma-cong-khai" className={`${SEC} bg-app-bg`}>
      <Wrap>
        <Feature flip>
          <FeatureArt>
            <Panel className="bg-app-surface shadow-app-ring">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[13px] font-bold text-app-muted">Đã liên kết</span>
                {LINKED.map((l) => (
                  <span
                    key={l}
                    className="flex h-8 items-center gap-1.5 rounded-2xl bg-app-surface px-3 text-[13px] font-bold text-app-ink-2 shadow-app-ring"
                  >
                    <span className="text-app-ok">
                      <Icon name="check" size={14} strokeWidth={2.6} />
                    </span>
                    {l}
                  </span>
                ))}
              </div>
              <div aria-hidden="true" className="flex flex-col gap-3.5">
                <CodeCard
                  logo="grab"
                  brandLine="Grab · mã công khai"
                  code="VPBTRANSPORT"
                  title={`Giảm ${formatVnd(15000)} cho chuyến GrabBike, GrabCar từ ${formatVnd(50000)}`}
                  ok="Thẻ VPBank của bạn"
                  plain="1 lần mỗi tháng"
                  meta="Nguồn: grab.com · kiểm tra 2 giờ trước"
                />
                <CodeCard
                  logo="gsm"
                  brandLine="Green SM · tự áp, không cần mã"
                  title="Giảm 25% mọi chuyến đến hết 28/02/2027"
                  meta="Nguồn: greensm.com · kiểm tra hôm nay"
                />
              </div>
            </Panel>
          </FeatureArt>

          <FeatureCopy>
            <Eyebrow>Mã công khai</Eyebrow>
            <H2 id="h-ma-cong-khai">Chỉ hiện mã bạn dùng được</H2>
            <Lead>
              {brand.name} gom mã của hãng xe, ngân hàng và ví điện tử, rồi lọc theo thẻ, ví bạn đã liên kết. Không phải
              thử từng mã rồi mới biết mã không hợp.
            </Lead>
            <CheckList
              items={[
                `${brand.name} chỉ lưu tên ngân hàng, loại thẻ và tên ví. Không lưu số thẻ hay mật khẩu`,
                "Mỗi mã ghi rõ nguồn và lần kiểm tra gần nhất",
                `Mã bị từ ${brand.autoHideReportThreshold} người báo không dùng được trong 24 giờ sẽ tự ẩn`,
              ]}
            />
          </FeatureCopy>
        </Feature>
      </Wrap>
    </section>
  );
}
