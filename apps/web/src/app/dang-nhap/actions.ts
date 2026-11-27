'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEMO_ROLE_COOKIE, MODE, getSession, supabaseServerClient } from '@/lib/server/data';

/** DEMO: vào cổng doanh nghiệp (Cà phê Mây) hoặc quản trị Frego không cần mật khẩu. */
export async function demoSignIn(formData: FormData) {
  if (MODE !== 'demo') redirect('/dang-nhap');
  const role = formData.get('role') === 'admin' ? 'admin' : 'biz';
  (await cookies()).set(DEMO_ROLE_COOKIE, role, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 });
  redirect(role === 'admin' ? '/quan-tri' : '/doanh-nghiep');
}

/** Supabase: đăng nhập email + mật khẩu, rồi vào đúng nơi theo vai trò (quản trị / thành viên doanh nghiệp). */
export async function passwordSignIn(formData: FormData) {
  if (MODE !== 'supabase') redirect('/dang-nhap');
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) redirect('/dang-nhap?loi=thieu');
  const client = await supabaseServerClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) redirect('/dang-nhap?loi=sai');
  const session = await getSession();
  if (!session) {
    await client.auth.signOut();
    redirect('/dang-nhap?loi=quyen');
  }
  redirect(session.role === 'admin' ? '/quan-tri' : '/doanh-nghiep');
}

export async function signOut() {
  if (MODE === 'supabase') await (await supabaseServerClient()).auth.signOut();
  else (await cookies()).delete(DEMO_ROLE_COOKIE);
  redirect('/dang-nhap');
}
