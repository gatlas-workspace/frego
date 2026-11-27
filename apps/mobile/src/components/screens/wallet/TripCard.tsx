import { View } from 'react-native';
import type { TripHistoryItem } from '@frego/core';
import { Button, Chip, T, type ChipTone } from '@/components/ui';
import { colors } from '@/theme/tokens';

const CHIP_TONE: Record<TripHistoryItem['status'], ChipTone> = {
  pending: 'deal',
  viewed: 'neutral',
  opened: 'neutral',
  reported: 'tint',
};

export interface TripCardProps {
  trip: TripHistoryItem;
  /** Bấm "Báo giá thật" (chỉ chuyến chưa báo giá). */
  onReport?: () => void;
  /** Hàng đầu trong nhóm (không kẻ vạch phía trên). */
  first?: boolean;
}

/**
 * Một chuyến trong Lịch sử so giá (UI v3: các chuyến cùng ngày nằm chung một khung, kẻ vạch giữa):
 * giờ + trạng thái, tuyến, dòng dịch vụ, nút báo giá hoặc số tiền đã trả.
 */
export function TripCard({ trip: t, onReport, first }: TripCardProps) {
  const showPaid = t.status === 'reported' && (!!t.paidText || !!t.pointsText);
  return (
    <View accessibilityLabel={`${t.time}, ${t.chip}. ${t.title}. ${t.line}`} style={{ paddingTop: 12, paddingHorizontal: 14, paddingBottom: 14, gap: 4, borderTopWidth: first ? 0 : 1, borderTopColor: colors.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <T weight={700} size={13} lineHeight={18} color={colors.muted} style={{ fontVariant: ['tabular-nums'] }}>
          {t.time}
        </T>
        <Chip text={t.chip} tone={CHIP_TONE[t.status]} size="sm" />
      </View>
      <T weight={800} size={15} lineHeight={20} accessibilityRole="header">
        {t.title}
      </T>
      <T size={13} lineHeight={20} color={colors.ink2}>
        {t.line}
      </T>
      {t.status === 'pending' && onReport ? (
        <View style={{ paddingTop: 8 }}>
          <Button
            label="Báo giá thật"
            badge="+10 điểm"
            size="md"
            onPress={onReport}
            accessibilityLabel={`Báo giá thật chuyến ${t.title}, được cộng 10 điểm`}
          />
        </View>
      ) : null}
      {showPaid ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginTop: 8,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: colors.line,
          }}
        >
          <T weight={700} size={14} lineHeight={19} style={{ flexShrink: 1 }}>
            {t.paidText ?? ''}
          </T>
          {t.pointsText ? <Chip text={t.pointsText} tone="tint" /> : null}
        </View>
      ) : null}
    </View>
  );
}
