import { useState } from 'react';
import { Image, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { colors } from '@/theme/tokens';

const SVG_PREFIX = /^data:image\/svg\+xml(;charset=[^,;]+)?(;base64)?,/i;

/** Đọc SVG từ data URL (ảnh banner mẫu ở DEMO). Ảnh thật doanh nghiệp tải lên là JPG/PNG/WebP. */
function svgFromDataUrl(uri: string): string | null {
  const m = uri.match(SVG_PREFIX);
  if (!m) return null;
  const payload = uri.slice(m[0].length);
  try {
    return m[2] ? atob(payload) : decodeURIComponent(payload);
  } catch {
    return null;
  }
}

/**
 * Ảnh banner tỉ lệ 16:9, bo góc. Image của React Native trên iOS/Android không vẽ được SVG nên SVG dùng SvgXml.
 * Ảnh lỗi → khối màu nền (nội dung chữ của banner vẫn hiện bên dưới).
 */
export function BannerImage({ uri, label }: { uri: string; label: string }) {
  const [w, setW] = useState(0);
  const [failed, setFailed] = useState(false);
  const h = Math.round((w * 9) / 16);
  const xml = svgFromDataUrl(uri);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.surfaceAlt }}
    >
      {failed || !w ? null : xml ? (
        <SvgXml xml={xml} width={w} height={h} />
      ) : (
        <Image source={{ uri }} style={{ width: w, height: h }} resizeMode="cover" onError={() => setFailed(true)} />
      )}
    </View>
  );
}
