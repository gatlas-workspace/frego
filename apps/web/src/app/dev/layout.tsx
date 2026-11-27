import { notFound } from 'next/navigation';

/** Trang tổng hợp thành phần chỉ dùng khi phát triển; bản production trả 404 (trừ khi bật NEXT_PUBLIC_SHOW_DEV=1). */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SHOW_DEV !== '1') notFound();
  return children;
}
