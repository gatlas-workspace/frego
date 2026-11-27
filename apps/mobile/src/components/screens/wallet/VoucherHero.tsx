import { View } from 'react-native';
import type { CategoryKey } from '@frego/core';
import { BrandLogo, Card, Chip, DashLine, Icon, T } from '@/components/ui';
import { colors } from '@/theme/tokens';

export interface VoucherHeroProps {
  businessName: string;
  businessAddress: string;
  category: CategoryKey | 'frego';
  sponsor: boolean;
  amountText: string;
  serviceText: string;
  expiresText: string;
}

/** Thẻ đầu màn Voucher tặng riêng: ô ngành quán + tên + địa chỉ, răng cưa, dải cam số tiền giảm. */
export function VoucherHero({ businessName, businessAddress, category, sponsor, amountText, serviceText, expiresText }: VoucherHeroProps) {
  const notch = (side: 'left' | 'right') => (
    <View
      style={{ position: 'absolute', top: -8, [side]: -10, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.bg }}
    />
  );
  return (
    <Card padding={0} clip>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
        <BrandLogo kind={category} size={60} radius={18} iconSize={30} />
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            {sponsor ? <Chip text="Tài trợ" tone="outline" size="sm" square /> : <Chip text="Frego" tone="tint" size="sm" square />}
            <T weight={800} size={18} lineHeight={23} accessibilityRole="header" style={{ flexShrink: 1 }}>
              {businessName}
            </T>
          </View>
          {businessAddress ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
              <View style={{ marginTop: 2 }}>
                <Icon name="pin" size={16} color={colors.muted} strokeWidth={2} />
              </View>
              <T size={13} lineHeight={19} color={colors.ink2} style={{ flex: 1, minWidth: 0 }}>
                {businessAddress}
              </T>
            </View>
          ) : null}
        </View>
      </View>
      <View style={{ height: 2 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <DashLine direction="horizontal" />
        {notch('left')}
        {notch('right')}
      </View>
      <View
        accessible
        accessibilityLabel={`Giảm ${amountText.replace('−', '')}, ${serviceText}, ${expiresText.replace('HSD', 'hạn dùng')}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          paddingTop: 14,
          paddingHorizontal: 16,
          paddingBottom: 16,
          backgroundColor: colors.deal,
        }}
      >
        <T weight={800} size={30} lineHeight={33} color={colors.dealInk} numberOfLines={1} style={{ fontVariant: ['tabular-nums'], flexShrink: 0 }}>
          {amountText}
        </T>
        <View style={{ alignItems: 'flex-end', gap: 2, flexShrink: 1 }}>
          <T weight={800} size={14} lineHeight={19} color={colors.dealInk} align="right">
            {serviceText}
          </T>
          <T weight={600} size={12} lineHeight={16} color={colors.dealInk} align="right">
            {expiresText}
          </T>
        </View>
      </View>
    </Card>
  );
}
