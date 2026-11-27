import type { BizCampaignRowView } from '@frego/core';
import type { TableColumn, TableRow } from '@/components/web';

/** Cột bảng chiến dịch (WebDnTongQuan, WebDnChienDich). */
export const CAMPAIGN_COLS: TableColumn[] = [
  { label: 'Chiến dịch', w: '1.6fr' },
  { label: 'Ưu đãi và vùng', w: '1.5fr' },
  { label: 'Mã dùng / tặng', align: 'right', w: '150px' },
  { label: 'Đã chi', align: 'right', w: '130px' },
  { label: 'Trạng thái', w: '170px' },
];

export function campaignRows(rows: BizCampaignRowView[]): TableRow[] {
  return rows.map((r) => ({
    key: r.id,
    cells: [
      { text: r.name, sub: r.sub, strong: true, href: r.href },
      { text: r.offerText, logo: r.providerId, sub: r.zoneText },
      { text: r.usedText, sub: r.usedSub },
      { text: r.spentText, strong: true },
      { text: r.statusLabel, status: r.statusTone },
    ],
  }));
}
