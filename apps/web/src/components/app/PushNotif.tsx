import { brand } from "@frego/core";

export type PushNotifProps = {
  title?: string;
  body?: string;
  /** VD "vừa xong", "08:52". */
  time?: string;
  className?: string;
};

/** Thông báo đẩy của Frego (UiPushNotif). */
export function PushNotif({
  title = `Mã ${brand.welcomeCode} vừa được dùng cho chuyến Be`,
  body = "Giá thật tiết kiệm được bao nhiêu? Bấm đánh giá để được cộng điểm.",
  time = "vừa xong",
  className = "",
}: PushNotifProps) {
  return (
    <div
      className={`box-border flex w-full gap-3 rounded-app-ticket bg-app-surface p-3.5 font-app text-app-ink shadow-app-card ${className}`}
    >
      <span
        aria-hidden="true"
        className="flex size-10 flex-none items-center justify-center rounded-app-small bg-app-primary text-lg font-extrabold text-white"
      >
        {brand.name.charAt(0)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-bold leading-[1.3] text-app-ink-2">{brand.name}</span>
          <span className="text-xs leading-[1.3] text-app-muted">{time}</span>
        </div>
        <span className="text-[15px] font-extrabold leading-[1.35]">{title}</span>
        <span className="text-[13px] leading-[1.45] text-app-ink-2">{body}</span>
      </div>
    </div>
  );
}
