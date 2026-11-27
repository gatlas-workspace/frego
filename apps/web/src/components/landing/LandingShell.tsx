import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/**
 * Khung chung của landing và các trang pháp lý: font Be Vietnam Pro, màu app,
 * chặn cuộn ngang (khung điện thoại, thẻ nổi ở hero có thể tràn mép trên màn hẹp).
 */
export function LandingShell({ onLanding = true, children }: { onLanding?: boolean; children: React.ReactNode }) {
  return (
    <div className="land-root w-full min-w-[320px] overflow-x-hidden bg-app-surface font-app text-base text-app-ink">
      <SiteHeader onLanding={onLanding} />
      <main>{children}</main>
      <SiteFooter onLanding={onLanding} />
    </div>
  );
}
