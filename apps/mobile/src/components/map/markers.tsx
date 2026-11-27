import { Image, View } from 'react-native';
import type { SponsorPinView } from '@frego/core';
import { Icon, T } from '@/components/ui';
import { CATEGORY } from '@/components/ui/BrandLogo';
import { colors, HIT, shadow } from '@/theme/tokens';

/** Viên nhãn trắng cạnh điểm đi/đến. */
export function PointLabel({ text }: { text: string }) {
  return (
    <View style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: colors.surface, boxShadow: shadow.mapLabel }}>
      <T weight={700} size={12} lineHeight={14} numberOfLines={1}>
        {text}
      </T>
    </View>
  );
}

/** Điểm đi: chấm xanh "Vị trí của bạn" (kiểu thongtincty). */
export function OriginDot() {
  return (
    <View
      style={{
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.mapUser,
        borderWidth: 3,
        borderColor: colors.white,
        boxShadow: shadow.mapLabel,
      }}
    />
  );
}

/** Điểm đến: chấm màu chính viền trắng. */
export function DestDot() {
  return (
    <View
      style={{
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: colors.primary,
        borderWidth: 4,
        borderColor: colors.white,
        boxShadow: shadow.mapLabel,
      }}
    />
  );
}

/** Ghim quán kiểu thongtincty: tròn 44px, viền trắng 3px (màu chính khi chọn); có logo thì hiện logo, không thì icon ngành. */
export function SponsorMarker({ pin, selected }: { pin: SponsorPinView; selected: boolean }) {
  const cat = CATEGORY[pin.category];
  return (
    <View
      style={{
        width: HIT,
        height: HIT,
        borderRadius: HIT / 2,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: selected ? colors.primary : colors.white,
        backgroundColor: pin.logoUrl ? colors.white : cat.bg,
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: shadow.mapLabel,
      }}
    >
      {pin.logoUrl ? (
        <Image source={{ uri: pin.logoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      ) : (
        <Icon name={cat.icon} size={20} color={colors.white} />
      )}
    </View>
  );
}

/** Bong bóng cụm (kiểu leaflet.markercluster): 40px trong vùng chạm 44px. */
export function ClusterBubble({ count }: { count: number }) {
  return (
    <View style={{ width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' }}>
      <View
        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.mapClusterOuter, alignItems: 'center', justifyContent: 'center' }}
      >
        <View
          style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.mapClusterInner, alignItems: 'center', justifyContent: 'center' }}
        >
          <T weight={700} size={13} lineHeight={16}>
            {count}
          </T>
        </View>
      </View>
    </View>
  );
}
