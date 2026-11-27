import { brand } from "@frego/core";
import { Icon } from "@/components/Icon";

/**
 * Khối dựng dùng chung của landing (LandingFrego.dc.html).
 * Mốc co giãn theo thiết kế: ≤1100px (máy tính bảng), ≤900px, ≤640px (điện thoại).
 */

/** `.wrap`: khung nội dung 1264px, lề 32px (20px trên điện thoại). */
export function Wrap({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`relative mx-auto max-w-[1264px] px-8 max-[640px]:px-5 ${className}`}>{children}</div>;
}

/** `.sec`: khoảng trên dưới 104px (64px trên điện thoại). */
export const SEC = "relative py-[104px] max-[640px]:py-16";

/** Dòng chữ nhỏ in hoa trên tiêu đề mục. */
export function Eyebrow({ tone = "primary", children }: { tone?: "primary" | "deal"; children: React.ReactNode }) {
  return (
    <p
      className={`m-0 text-sm font-extrabold uppercase tracking-[0.6px] ${tone === "deal" ? "text-app-deal-ink" : "text-app-primary"}`}
    >
      {children}
    </p>
  );
}

/** `.h2`: 42px (32px trên điện thoại). */
export function H2({
  id,
  onPrimary = false,
  className = "",
  children,
}: {
  id: string;
  onPrimary?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h2
      id={id}
      className={`m-0 text-[42px] font-extrabold leading-[1.15] tracking-[-0.9px] max-[640px]:text-[32px] ${onPrimary ? "text-white" : "text-app-ink"} ${className}`}
    >
      {children}
    </h2>
  );
}

/** Đoạn dẫn dưới tiêu đề mục. */
export function Lead({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <p className={`m-0 text-[17px] leading-[1.6] text-app-ink-2 ${className}`}>{children}</p>;
}

/** Danh sách có dấu tích tròn. */
export function CheckList({ tone = "primary", items }: { tone?: "primary" | "deal"; items: React.ReactNode[] }) {
  const dot = tone === "deal" ? "bg-app-surface text-app-deal-ink" : "bg-app-primary-soft text-app-primary";
  return (
    <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-base leading-[1.55] text-app-ink-2">
          <span aria-hidden="true" className={`-mt-px flex size-[26px] flex-none items-center justify-center rounded-full ${dot}`}>
            <Icon name="check" size={15} strokeWidth={2.6} />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Ô chữ F của logo Frego. */
export function LogoMark({ size = 36 }: { size?: 32 | 36 }) {
  return (
    <span
      aria-hidden="true"
      className={`flex flex-none items-center justify-center bg-app-primary font-extrabold text-white shadow-app-logo ${
        size === 36 ? "size-9 rounded-[11px] text-xl" : "size-8 rounded-[10px] text-lg"
      }`}
    >
      {brand.name.charAt(0)}
    </span>
  );
}

/** Ô icon lớn 56px (bốn bước, cam kết). */
export function IconTile({
  name,
  onPrimary = false,
}: {
  name: React.ComponentProps<typeof Icon>["name"];
  onPrimary?: boolean;
}) {
  return (
    <span
      className={`flex size-14 flex-none items-center justify-center rounded-[18px] text-white ${
        onPrimary ? "bg-app-on-primary-fill" : "bg-app-primary shadow-app-step"
      }`}
    >
      <Icon name={name} size={26} strokeWidth={1.9} />
    </span>
  );
}

/** Vòng tròn trang trí trên nền tím (aria-hidden). */
export function GlowCircle({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 400 400" width="400" height="400" aria-hidden="true" className={`absolute block ${className}`}>
      <circle cx="200" cy="200" r="200" className="fill-app-glow" />
    </svg>
  );
}

/** Chữ chỉ cho trình đọc màn hình. */
export function SrOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/** `.feature`: chữ + hình hai cột; ≤1100px xếp dọc (flip: hình nằm dưới chữ). */
export function Feature({ flip = false, children }: { flip?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`flex items-center justify-between gap-14 max-[1100px]:items-stretch ${
        flip ? "max-[1100px]:flex-col-reverse" : "max-[1100px]:flex-col"
      }`}
    >
      {children}
    </div>
  );
}

export function FeatureCopy({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-[0_1_500px] flex-col gap-5 max-[1100px]:w-full max-[1100px]:max-w-[640px] max-[1100px]:flex-none">
      {children}
    </div>
  );
}

export function FeatureArt({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-[0_1_600px] max-[1100px]:w-full max-[1100px]:max-w-[640px] max-[1100px]:flex-none">
      {children}
    </div>
  );
}

/** `.panel`: khối minh hoạ bo 36px, lề 36/40px (20px trên điện thoại). */
export function Panel({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col gap-4 rounded-[36px] px-10 py-9 max-[640px]:p-5 ${className}`}>{children}</div>
  );
}
