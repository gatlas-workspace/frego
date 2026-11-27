/** Kết quả server action trả về cho form (useActionState). Không import @frego/core để file nhẹ ở phía trình duyệt. */
export type FormState = {
  status: 'idle' | 'ok' | 'error';
  message?: string;
  /** Lỗi theo tên ô (name của input). */
  fieldErrors?: Record<string, string>;
  /** Thông tin thêm cho màn hình (vd. cảnh báo sau khi gửi). */
  note?: string;
  /** Mốc thời gian để phân biệt hai lần gửi liên tiếp. */
  at?: number;
};

export const IDLE_STATE: FormState = { status: 'idle' };

/** FormData → chuỗi (bỏ tệp). */
export function formValues(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  fd.forEach((v, k) => {
    if (typeof v === 'string') out[k] = v;
  });
  return out;
}
