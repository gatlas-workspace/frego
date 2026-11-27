import { brand } from "@frego/core";
import { Icon } from "@/components/Icon";
import { LandingShell } from "./LandingShell";
import { Wrap } from "./ui";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/** Đoạn văn trong trang pháp lý. */
export function LegalP({ children }: { children: React.ReactNode }) {
  return <p className="m-0 text-base leading-[1.7] text-app-ink-2">{children}</p>;
}

/** Danh sách gạch đầu dòng trong trang pháp lý. */
export function LegalList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-base leading-[1.65] text-app-ink-2">
          <span aria-hidden="true" className="mt-[11px] size-1.5 flex-none rounded-full bg-app-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function telHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

/**
 * Khung trang Chính sách dữ liệu / Điều khoản sử dụng theo phong cách landing.
 * Nội dung là BẢN NHÁP rút từ thiết kế, cần pháp chế duyệt trước khi phát hành.
 */
export function LegalPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}) {
  const { legalName, hotline, supportEmail } = brand.company;
  return (
    <LandingShell onLanding={false}>
      <section aria-labelledby="h-trang" className="bg-app-bg pb-24 pt-12 max-[640px]:pb-16 max-[640px]:pt-8">
        <Wrap>
          <article className="mx-auto flex max-w-[800px] flex-col gap-8">
            <header className="flex flex-col gap-4">
              <p className="m-0 text-sm font-extrabold uppercase tracking-[0.6px] text-app-primary">{eyebrow}</p>
              <h1
                id="h-trang"
                className="m-0 text-[42px] font-extrabold leading-[1.15] tracking-[-0.9px] max-[640px]:text-[32px]"
              >
                {title}
              </h1>
              <p
                role="note"
                className="m-0 flex items-start gap-2.5 self-start rounded-app-block bg-app-deal px-4 py-3 text-[15px] font-bold leading-[1.5] text-app-deal-ink"
              >
                <span className="mt-0.5">
                  <Icon name="info" size={18} strokeWidth={2} />
                </span>
                Bản nháp, cần pháp chế duyệt trước khi phát hành
              </p>
              <div className="text-[17px] leading-[1.65] text-app-ink-2">{intro}</div>
            </header>

            <nav aria-label="Mục lục" className="rounded-[28px] bg-app-surface px-8 py-6 shadow-app-ring max-[640px]:px-5">
              <h2 className="m-0 mb-2 text-sm font-extrabold text-app-ink">Mục lục</h2>
              <ol className="m-0 flex list-none flex-col p-0">
                {sections.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="flex min-h-11 items-center gap-3 text-[15px] font-semibold text-app-ink-2 hover:text-app-primary"
                    >
                      <span aria-hidden="true" className="w-5 flex-none text-app-primary tabular-nums">
                        {i + 1}.
                      </span>
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="flex flex-col gap-4">
              {sections.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  aria-labelledby={`${s.id}-h`}
                  className="flex flex-col gap-3.5 rounded-[28px] bg-app-surface px-8 py-7 shadow-app-ring max-[640px]:px-5 max-[640px]:py-6"
                >
                  <h2 id={`${s.id}-h`} className="m-0 text-[22px] font-extrabold leading-[1.3] tracking-[-0.3px]">
                    <span className="text-app-primary">{i + 1}. </span>
                    {s.title}
                  </h2>
                  {s.body}
                </section>
              ))}
            </div>

            <section
              aria-labelledby="lien-he-h"
              className="land-on-primary flex flex-col gap-2 rounded-[28px] bg-app-primary px-8 py-7 text-white max-[640px]:px-5"
            >
              <h2 id="lien-he-h" className="m-0 text-[22px] font-extrabold tracking-[-0.3px]">
                Liên hệ
              </h2>
              <p className="m-0 text-base leading-[1.65] text-app-on-primary-soft">
                {brand.name} do {legalName} vận hành.
              </p>
              <div className="flex flex-wrap gap-x-6">
                <a href={telHref(hotline)} className="flex min-h-11 items-center gap-2 text-base font-bold text-white">
                  Hotline {hotline}
                </a>
                <a href={`mailto:${supportEmail}`} className="flex min-h-11 items-center gap-2 text-base font-bold text-white">
                  <Icon name="mail" size={18} />
                  {supportEmail}
                </a>
              </div>
            </section>
          </article>
        </Wrap>
      </section>
    </LandingShell>
  );
}
