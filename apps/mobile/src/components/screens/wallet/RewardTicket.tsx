import { View } from 'react-native';
import type { RewardView } from '@frego/core';
import { Button, Chip, DashLine, T, VehicleTile } from '@/components/ui';
import { colors, shadow } from '@/theme/tokens';

export interface RewardTicketProps {
  reward: RewardView;
  /** Vừa đổi xong trong phiên này: hiện nhãn "Đã đổi". */
  redeemed: boolean;
  /** Đang gửi lệnh đổi (khóa nút). */
  busy?: boolean;
  onRedeem: () => void;
}

/** Vé quà đổi điểm: cuống cam có ô xe + số tiền, răng cưa, thân vé có giá điểm và nút Đổi. */
export function RewardTicket({ reward: r, redeemed, busy, onRedeem }: RewardTicketProps) {
  const notch = (pos: 'top' | 'bottom') => (
    <View style={{ position: 'absolute', left: -8, [pos]: -10, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.bg }} />
  );
  const canRedeem = !redeemed && r.canRedeem;
  return (
    <View style={{ borderRadius: 22, backgroundColor: colors.surface, boxShadow: shadow.card }}>
      <View style={{ flexDirection: 'row', borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface }}>
        <View
          accessible
          accessibilityLabel={`Voucher ${r.serviceText} ${r.amountText}`}
          style={{
            width: 104,
            paddingTop: 12,
            paddingHorizontal: 8,
            paddingBottom: 14,
            backgroundColor: colors.deal,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <View style={{ marginBottom: 6, marginLeft: -6 }}>
            <VehicleTile brand={r.providerId} kind={r.kind} />
          </View>
          <View style={{ alignSelf: 'stretch', marginHorizontal: -8 }}>
            <T weight={800} size={17} lineHeight={20} color={colors.dealInk} align="center" numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
              {r.amountText}
            </T>
          </View>
          <T weight={600} size={12} lineHeight={16} color={colors.ink2} align="center">
            {r.serviceText}
          </T>
        </View>
        <View style={{ width: 2, alignSelf: 'stretch' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <DashLine style={{ flex: 1 }} />
          {notch('top')}
          {notch('bottom')}
        </View>
        <View style={{ flex: 1, minWidth: 0, paddingVertical: 14, paddingRight: 14, paddingLeft: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <T weight={800} size={15} lineHeight={20}>
              {r.costText}
            </T>
            <T size={12} lineHeight={16} color={colors.muted}>
              {redeemed ? 'Đã thêm vào Ví voucher' : 'Vào Ví ngay khi đổi'}
            </T>
          </View>
          {redeemed ? (
            <Chip text="Đã đổi" tone="tint" icon="check" />
          ) : canRedeem ? (
            <Button
              label="Đổi"
              size="sm"
              block={false}
              disabled={busy}
              onPress={onRedeem}
              accessibilityLabel={`Đổi ${r.costText} lấy voucher ${r.serviceText} ${r.amountText}`}
            />
          ) : (
            <T weight={700} size={12} lineHeight={16} color={colors.muted} align="right" style={{ flexShrink: 0 }}>
              {r.shortText}
            </T>
          )}
        </View>
      </View>
    </View>
  );
}
