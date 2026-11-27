/**
 * Thông báo đẩy hiển thị trong app (3b, 5a). Trên máy thật, tin đẩy hệ thống do server gửi
 * (expo-notifications + Supabase); khi app đang mở, tin hiện dạng banner trên cùng này.
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export interface PushMessage {
  id: string;
  title: string;
  body: string;
  time: string;
  /** Đường dẫn expo-router khi bấm */
  link: string;
}

interface PushValue {
  current: PushMessage | null;
  show(msg: Omit<PushMessage, 'id'>): void;
  dismiss(): void;
}

const Ctx = createContext<PushValue | null>(null);

export function PushProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<PushMessage | null>(null);
  const show = useCallback((msg: Omit<PushMessage, 'id'>) => setCurrent({ ...msg, id: String(Date.now()) }), []);
  const dismiss = useCallback(() => setCurrent(null), []);
  return <Ctx.Provider value={{ current, show, dismiss }}>{children}</Ctx.Provider>;
}

export function usePush() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePush phải nằm trong <PushProvider>');
  return v;
}
