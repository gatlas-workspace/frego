// 0b · Đăng nhập bằng số điện thoại (DangNhap-v2): gửi mã xác nhận rồi sang màn nhập mã.
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, View, type TextInputInstance } from 'react-native';
import { brand } from '@frego/core';
import { Button, Field, ScreenHeader, T } from '@/components/ui';
import { otpSession } from '@/components/screens/account/otp-session';
import { PageHeading } from '@/components/screens/account/PageHeading';
import { InlineError } from '@/components/screens/account/ScreenState';
import { useApi } from '@/lib/api';
import { colors } from '@/theme/tokens';

export default function DangNhapScreen() {
  const { sendOtp } = useApi();
  const [phone, setPhone] = useState(otpSession.phone ?? '');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const fieldRef = useRef<TextInputInstance>(null);

  const submit = async () => {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await sendOtp(phone);
      if (!res.ok) {
        setError(res.error);
        fieldRef.current?.focus();
        return;
      }
      otpSession.phone = phone;
      router.push('/xac-nhan');
    } catch {
      setError('Chưa gửi được mã. Thử lại sau ít phút.');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScreenHeader
        backLabel="Quay lại màn chào mừng"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/chao-mung'))}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 24, paddingBottom: 24, gap: 24 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <PageHeading title="Nhập số điện thoại">Để giữ mã voucher riêng của bạn và cộng điểm mỗi lần báo giá.</PageHeading>
        <View style={{ gap: 8 }}>
          <Field
            ref={fieldRef}
            label="Số điện thoại"
            prefix="+84"
            value={phone}
            onChangeText={(t) => {
              setPhone(t.replace(/[^\d ]/g, ''));
              if (error) setError(null);
            }}
            placeholder="909 123 456"
            inputMode="tel"
            keyboardType="phone-pad"
            autoComplete="tel-national"
            textContentType="telephoneNumber"
            returnKeyType="send"
            maxLength={14}
            onSubmitEditing={submit}
          />
          {error ? <InlineError text={error} /> : null}
        </View>
        <Button
          label={sending ? 'Đang gửi mã…' : 'Gửi mã xác nhận'}
          onPress={submit}
          disabled={sending}
        />
        <T size={13} lineHeight={19} color={colors.muted}>
          Khi tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách dữ liệu của {brand.name}.
        </T>
      </ScrollView>
    </View>
  );
}
