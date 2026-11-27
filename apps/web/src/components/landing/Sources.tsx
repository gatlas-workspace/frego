import { PROVIDER_ORDER, PROVIDERS } from "@frego/core";
import { Icon } from "@/components/Icon";
import { ProviderLogo } from "@/components/app";
import { Wrap } from "./ui";

const chip =
  "flex h-12 items-center gap-2.5 rounded-3xl bg-app-surface px-4 text-[15px] font-bold text-app-ink-2 shadow-app-ring";

const OTHER_SOURCES = [
  { icon: "card", label: "Thẻ ngân hàng" },
  { icon: "wallet", label: "Ví điện tử" },
  { icon: "cup", label: "Quán gần điểm đến" },
] as const;

/** Dải "Mã giảm giá được gom từ" dưới hero. */
export function Sources() {
  return (
    <section aria-label="Nguồn mã giảm giá" className="relative bg-app-surface py-10 shadow-app-line-bottom">
      <Wrap>
        <div className="flex items-center gap-7 max-[900px]:flex-col max-[900px]:items-start max-[900px]:gap-3.5">
          <p className="m-0 max-w-[140px] flex-none text-[15px] font-bold leading-[1.45] text-app-muted">
            Mã giảm giá được gom từ
          </p>
          <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
            {PROVIDER_ORDER.map((p) => (
              <li key={p} className={chip}>
                <ProviderLogo provider={p} size={30} className="rounded-[9px] border-2 border-white shadow-app-brand" />
                {PROVIDERS[p].name}
              </li>
            ))}
            {OTHER_SOURCES.map((s) => (
              <li key={s.label} className={chip}>
                <span className="text-app-primary">
                  <Icon name={s.icon} size={20} strokeWidth={1.9} />
                </span>
                {s.label}
              </li>
            ))}
          </ul>
        </div>
      </Wrap>
    </section>
  );
}
