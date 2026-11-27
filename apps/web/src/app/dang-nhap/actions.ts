'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEMO_ROLE_COOKIE, MODE } from '@/lib/server/data';

/** DEMO: vào cổng doanh nghiệp (Cà phê Mây) hoặc quản trị Frego không cần mật khẩu. */
export async function demoSignIn(formData: FormData) {
  if (MODE !== 'demo') redirect('/dang-nhap');
  const role = formData.get('role') === 'admin' ? 'admin' : 'biz';
  (await cookies()).set(DEMO_ROLE_COOKIE, role, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
  redirect(role === 'admin' ? '/quan-tri' : '/doanh-nghiep');
}

export async function signOut() {
  (await cookies()).delete(DEMO_ROLE_COOKIE);
  redirect('/dang-nhap');
}
