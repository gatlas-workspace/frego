import { router, type Href } from 'expo-router';

/** Xóa các màn đã mở trong ngăn xếp rồi thay bằng `href` (kết thúc luồng bắt đầu: không quay lại được màn nhập mã). */
export function resetTo(href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}
