/**
 * Số điện thoại vừa nhập ở màn Đăng nhập, giữ trong bộ nhớ để màn Xác nhận gửi lại mã
 * (useApi chỉ trả số đã che). Không lưu xuống máy, không đưa lên đường dẫn.
 */
export const otpSession: { phone: string | null } = { phone: null };

/** Thời gian chờ trước khi được gửi lại mã (giây). */
export const RESEND_SECONDS = 60;
