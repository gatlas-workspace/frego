import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { Linking, Platform } from 'react-native';
import type { OpenAppView, UserService } from '@frego/core';
import { refreshAll } from '@/lib/api';
import type { PushMessage } from '@/lib/push';

/** Chép chữ vào bộ nhớ tạm. Trả về false khi không chép được (trình duyệt trong app, bị chặn quyền…). */
export async function copyText(text: string): Promise<boolean> {
  try {
    return (await Clipboard.setStringAsync(text)) !== false;
  } catch {
    return false;
  }
}

/**
 * Mở app hãng bằng link sâu; không mở được (chưa cài app) thì mở trang tải app.
 * Trên web không có app hãng: mở thẳng trang tải ở thẻ mới. Không bao giờ ném lỗi.
 */
export async function openProviderApp(view: Pick<OpenAppView, 'deepLink' | 'storeUrl'>): Promise<void> {
  if (Platform.OS === 'web') {
    // Trình duyệt trên điện thoại (cả trong Zalo/Facebook): thử mở app bằng deep link; ~1,5 giây sau trang vẫn hiện
    // (máy chưa cài app hoặc trình duyệt chặn) thì mới mở trang tải app. Máy tính: mở thẳng trang tải.
    const mobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (mobile && typeof document !== 'undefined') {
      const started = Date.now();
      window.location.href = view.deepLink;
      await new Promise((r) => setTimeout(r, 1500));
      if (!document.hidden && Date.now() - started < 3000) await Linking.openURL(view.storeUrl).catch(() => {});
      return;
    }
    await Linking.openURL(view.storeUrl).catch(() => {});
    return;
  }
  try {
    await Linking.openURL(view.deepLink);
  } catch {
    try {
      await WebBrowser.openBrowserAsync(view.storeUrl);
    } catch {
      await Linking.openURL(view.storeUrl).catch(() => {});
    }
  }
}

/** Thời gian chờ trước khi (DEMO) hãng báo mã đã được dùng. */
const CODE_USED_DELAY = 4000;
const scheduled = new Set<string>();

/**
 * DEMO: sau khi mở app hãng ~4 giây, giả lập hãng báo mã đã dùng và hiện thông báo đẩy (3b).
 * Chạy cả khi người dùng đã đóng màn Mở app; mỗi chuyến chỉ một lần.
 */
export function scheduleCodeUsed(
  svc: Pick<UserService, 'simulateCodeUsed'>,
  tripId: string,
  show: (msg: Omit<PushMessage, 'id'>) => void,
) {
  if (scheduled.has(tripId)) return;
  scheduled.add(tripId);
  setTimeout(async () => {
    try {
      const { notification } = await svc.simulateCodeUsed(tripId);
      refreshAll();
      if (notification) {
        show({ title: notification.title, body: notification.body, time: 'vừa xong', link: notification.link || `/bao-gia/${tripId}` });
      }
    } catch {
      /* Hãng chưa báo: người dùng vẫn báo giá được từ Lịch sử so giá. */
    }
  }, CODE_USED_DELAY);
}
