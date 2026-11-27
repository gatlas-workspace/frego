import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { refreshAll, useApi } from '@/lib/api';

/**
 * Đọc một bản ghi cài đặt (quyền dữ liệu, cài đặt thông báo) và đổi từng mục ngay khi bấm:
 * cập nhật giao diện trước, lưu sau; lưu lỗi thì trả lại như cũ và báo `saveError`.
 */
export function useSettings<T extends object>(key: string, read: () => Promise<T>, write: (patch: Partial<T>) => Promise<unknown>) {
  const { status } = useApi();
  const qc = useQueryClient();
  const [saveError, setSaveError] = useState(false);
  const query = useQuery({ queryKey: [key], queryFn: read, enabled: status === 'signedIn' });

  const mutation = useMutation({
    mutationFn: write,
    onMutate: async (patch: Partial<T>) => {
      setSaveError(false);
      await qc.cancelQueries({ queryKey: [key] });
      const prev = qc.getQueryData<T>([key]);
      if (prev) qc.setQueryData<T>([key], { ...prev, ...patch });
      return { prev };
    },
    onError: (_e, _patch, ctx) => {
      if (ctx?.prev) qc.setQueryData<T>([key], ctx.prev);
      setSaveError(true);
    },
    onSettled: () => refreshAll(),
  });

  return { query, set: (patch: Partial<T>) => mutation.mutate(patch), saveError };
}
