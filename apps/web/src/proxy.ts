/**
 * Làm mới cookie phiên Supabase trước khi render cổng doanh nghiệp và quản trị.
 * Chế độ DEMO (chưa có biến môi trường Supabase) thì bỏ qua.
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const login = request.nextUrl.clone();
    login.pathname = '/dang-nhap';
    login.searchParams.set('vai-tro', request.nextUrl.pathname.startsWith('/quan-tri') ? 'quan-tri' : 'doanh-nghiep');
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ['/doanh-nghiep', '/doanh-nghiep/((?!dang-ky).*)', '/quan-tri/:path*'],
};
