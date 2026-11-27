import { useState } from 'react';
import { Pressable, View } from 'react-native';
import type { CategoryKey, ProviderId, VehicleClass } from '@frego/core';
import { BrandLogo, Chip, DashLine, Icon, T, VehicleTile } from '@/components/ui';
import { Pop, pressScale } from '@/components/motion';
import { copyText } from '@/components/screens/flow/openProviderApp';
import { spellCode } from './CodeBox';
import { colors, radius } from '@/theme/tokens';

export interface VoucherHeroProps {
  businessName: string;
  businessAddress: string;
  category: CategoryKey | 'frego';
  sponsor: boolean;
  amountText: string;
  /** Đọc cho trình đọc màn hình (loại xe đã thể hiện bằng ô xe) */
  serviceText: string;
  /** "Còn 3 ngày" / "HSD 30/11" */
  expiresText: string;
  providerId: ProviderId;
  vehicleClass: VehicleClass;
  code: string;
}

/** Đường răng cưa ngang giữa các tầng của vé, hai khuyết tròn hai bên. */
function Perforation() {
  const notch = (side: 'left' | 'right') => (
    <View style={{ position: 'absolute', top: -8, [side]: -10, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.bg }} />
  );
  return (
    <View style={{ height: 2 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <DashLine direction="horizontal" />
      {notch('left')}
      {notch('right')}
    </View>
  );
}

/**
 * Vé voucher tặng riêng (UI v3, ba tầng): quán · ô xe + số tiền + hạn dùng · mã riêng + nút Chép.
 * Không ghi chữ loại xe cạnh số tiền vì đã có hình xe.
 */
export function VoucherHero({ businessName, businessAddress, category, sponsor, amountText, serviceText, expiresText, providerId, vehicleClass, code }: VoucherHeroProps) {
  const [copied, setCopied] = useState<boolean | null>(null);
  return (
    <View style={{ borderRadius: radius.card, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, overflow: 'hidden' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 }}>
        <BrandLogo kind={category} size={52} radius={14} iconSize={26} />
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
      <Perforation />
      <View
        accessible
        accessibilityLabel={`Giảm ${amountText.replace('−', '')}, ${serviceText}, ${expiresText.replace('HSD', 'hạn dùng')}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: colors.deal }}
      >
        <VehicleTile brand={providerId} kind={vehicleClass} />
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <T weight={800} size={22} lineHeight={27} color={colors.dealInk} numberOfLines={1} style={{ fontVariant: ['tabular-nums'] }}>
            {amountText}
          </T>
          <T weight={600} size={12} lineHeight={16} color={colors.dealInk}>
            Giảm cho chuyến này
          </T>
        </View>
        <T weight={700} size={12} lineHeight={16} color={colors.dealInk} align="right" style={{ flexShrink: 0 }}>
          {expiresText}
        </T>
      </View>
      <Perforation />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <T weight={700} size={12} lineHeight={16} color={colors.muted}>
            Mã riêng của bạn
          </T>
          <T weight={800} size={24} lineHeight={30} selectable numberOfLines={1} adjustsFontSizeToFit accessibilityLabel={`Mã ${spellCode(code)}`} style={{ letterSpacing: 2 }}>
            {code}
          </T>
        </View>
        {copied ? (
          <Pop>
            <View role="status" style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.goodSoft, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="check" size={16} color={colors.good} strokeWidth={2.6} />
              <T weight={800} size={14} lineHeight={18} color={colors.good}>
                Đã chép
              </T>
            </View>
          </Pop>
        ) : (
          <Pressable
            onPress={async () => setCopied(await copyText(code))}
            accessibilityRole="button"
            accessibilityLabel={`Chép mã ${code}`}
            style={({ pressed }) => [
              { minHeight: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: pressed ? colors.ink2 : colors.ink, flexDirection: 'row', alignItems: 'center', gap: 6 },
              pressScale(pressed),
            ]}
          >
            <Icon name="copy" size={16} color={colors.white} strokeWidth={2} />
            <T weight={800} size={14} lineHeight={18} color={colors.white}>
              Chép
            </T>
          </Pressable>
        )}
      </View>
      {copied === false ? (
        <T size={13} lineHeight={19} color={colors.ink2} accessibilityLiveRegion="polite" style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          Chưa chép được. Giữ ngón tay lên mã để chọn và chép.
        </T>
      ) : null}
    </View>
  );
}
