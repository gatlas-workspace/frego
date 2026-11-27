import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useApi } from '@/lib/api';
import { usePush } from '@/lib/push';

/** Chỉ hiện một lần mỗi phiên chạy app (5a). */
let shownThisSession = false;
/** Đợi màn Ví hiện xong rồi mới trượt banner xuống, như một tin đẩy vừa tới. */
const DELAY_MS = 700;
const HINT = 'Bấm để xem mã.';

/**
 * 5a · Thông báo "được tặng voucher": lần đầu mở Ví trong phiên, nếu có thông báo quà tặng chưa đọc
 * thì hiện banner đẩy trong app (tiêu đề, nội dung lấy từ thông báo; bấm mở /voucher/<id>).
 */
export function useGiftPush() {
  const { svc, status } = useApi();
  const { show } = usePush();
  const notifs = useQuery({
    queryKey: ['notifications'],
    queryFn: () => svc.listNotifications(),
    enabled: status === 'signedIn' && !shownThisSession,
  });
  const data = notifs.data;
  useEffect(() => {
    if (shownThisSession || !data) return;
    const gift = data.find((n) => n.kind === 'gift' && n.unread);
    if (!gift) {
      shownThisSession = true;
      return;
    }
    const body = gift.body.includes(HINT) ? gift.body : `${gift.body.trim()} ${HINT}`;
    const t = setTimeout(() => {
      shownThisSession = true;
      show({ title: gift.title, body, time: 'vừa xong', link: gift.link || '/vi' });
    }, DELAY_MS);
    return () => clearTimeout(t);
  }, [data, show]);
}
