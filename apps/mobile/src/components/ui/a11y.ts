import { Platform } from 'react-native';

/**
 * Ẩn hình trang trí `<Svg>` khỏi trình đọc màn hình.
 * Trên web react-native-svg đổ props thẳng xuống thẻ DOM, nên `accessibilityElementsHidden` / `importantForAccessibility`
 * làm React báo lỗi "does not recognize the prop" → dùng `aria-hidden` (cùng tác dụng). Điện thoại giữ props của RN.
 * (`View` của react-native-web tự xử lý hai props này, không cần dùng hàm này.)
 */
export const svgHidden =
  Platform.OS === 'web'
    ? ({ 'aria-hidden': true } as const)
    : ({ accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' } as const);
