import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { T } from '@/components/ui';
import { colors } from '@/theme/tokens';

export interface StepsProps {
  /** Nội dung từng bước (chữ 14px; phần nhấn dùng <Strong>). */
  items: ReactNode[];
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Chữ nhấn trong một bước: đậm 700, màu chữ chính. */
export function Strong({ children }: { children: ReactNode }) {
  return (
    <T weight={700} size={14} lineHeight={21}>
      {children}
    </T>
  );
}

/** Danh sách bước đánh số (vòng 26px tím nhạt) — màn Mở app hãng. */
export function Steps({ items, accessibilityLabel, style }: StepsProps) {
  return (
    <View accessibilityRole="list" accessibilityLabel={accessibilityLabel} style={[{ gap: 12 }, style]}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: colors.primarySoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <T weight={800} size={13} lineHeight={16} color={colors.primaryDeep}>
              {String(i + 1)}
            </T>
          </View>
          <T size={14} lineHeight={21} color={colors.ink2} style={{ flex: 1, minWidth: 0 }}>
            {item}
          </T>
        </View>
      ))}
    </View>
  );
}
