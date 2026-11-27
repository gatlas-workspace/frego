// TODO(thành phần): trang đăng nhập web (Notion-style). Bản tạm: chọn vai trò DEMO.
import { demoSignIn } from './actions';
import { MODE } from '@/lib/server/data';

export const metadata = { title: 'Đăng nhập' };

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm p-12">
      <h1 className="mb-6 text-[28px] font-bold">Đăng nhập Frego</h1>
      {MODE === 'demo' ? (
        <form action={demoSignIn} className="flex flex-col gap-3">
          <button name="role" value="biz" className="rounded-[4px] bg-blue px-3 py-2 text-white">Vào cổng doanh nghiệp (Cà phê Mây)</button>
          <button name="role" value="admin" className="rounded-[4px] border border-line px-3 py-2">Vào quản trị Frego</button>
        </form>
      ) : (
        <p>Đăng nhập bằng email công việc.</p>
      )}
    </main>
  );
}
