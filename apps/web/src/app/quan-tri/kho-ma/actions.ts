'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AddPublicCodeField, CodeBrand, ProviderId } from '@frego/core';
import { adminService } from '@/lib/server/data';

export type AddCodeState = { errors: Partial<Record<AddPublicCodeField | 'form', string>>; at: number } | null;

const BRANDS: CodeBrand[] = ['grab', 'be', 'gsm', 'bank'];
const PROVIDERS: ProviderId[] = ['grab', 'be', 'gsm'];

/** Thêm mã công khai ở trạng thái "Chờ kiểm tra", rồi đóng khung và tô dòng mới (?moi=). */
export async function addCodeAction(_prev: AddCodeState, formData: FormData): Promise<AddCodeState> {
  const { svc } = await adminService();
  const s = (k: string) => String(formData.get(k) ?? '');
  const brand = (BRANDS.includes(s('brand') as CodeBrand) ? s('brand') : 'grab') as CodeBrand;
  const bankProvider = PROVIDERS.includes(s('bankProvider') as ProviderId) ? (s('bankProvider') as ProviderId) : undefined;
  let id: string;
  try {
    const r = await svc.addPublicCode({
      brand,
      bankId: s('bankId') || undefined,
      bankProvider,
      code: s('code'),
      title: s('title'),
      condition: s('condition'),
      source: s('source'),
      expires: s('expires'),
    });
    if (!r.ok) return { errors: r.errors, at: Date.now() };
    id = r.id;
  } catch (e) {
    return { errors: { form: e instanceof Error ? e.message : 'Chưa lưu được mã. Thử lại.' }, at: Date.now() };
  }
  revalidatePath('/quan-tri', 'layout');
  redirect(`/quan-tri/kho-ma?moi=${encodeURIComponent(id)}`);
}
