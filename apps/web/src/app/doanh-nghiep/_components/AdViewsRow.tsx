import type { BizStatView } from '@frego/core';
import { MoreLink, WebIcon } from '@/components/web';

/**
 * Dòng "Lượt xem quảng cáo" (popup của quán sau màn So giá) đặt dưới dải số liệu ở Báo cáo, Chi tiết chiến dịch.
 * Tách riêng để không đổi lưới ô số liệu sẵn có. `link` = hiện "Quảng cáo ›" sang trang quản lý banner.
 */
export function AdViewsRow({ stat, link = true }: { stat: BizStatView; link?: boolean }) {
  return (
    <section
      aria-label={stat.label}
      className="flex flex-none flex-wrap items-center gap-x-3 gap-y-1 rounded-frame bg-white px-4 py-3 shadow-frame"
    >
      <WebIcon name="camera" size={18} className="flex-none text-ink-2" />
      <span className="text-[14px] text-ink-2">{stat.label}</span>
      <span className="text-[18px] font-semibold tabular-nums">{stat.value}</span>
      <span className="min-w-0 flex-1 basis-[200px] text-[13px] leading-[1.4] text-ink-2">{stat.sub}</span>
      {link ? <MoreLink href="/doanh-nghiep/quang-cao">Quảng cáo</MoreLink> : null}
    </section>
  );
}
