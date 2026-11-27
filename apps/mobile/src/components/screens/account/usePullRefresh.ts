import { useCallback, useState } from 'react';

/** Kéo xuống để tải lại: chỉ hiện vòng xoay khi người dùng kéo (không hiện khi tự làm mới nền). */
export function usePullRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);
  return { refreshing, onRefresh };
}
