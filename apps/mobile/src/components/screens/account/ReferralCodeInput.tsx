import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Field, Icon, T } from '@/components/ui';
import { Pop } from '@/components/motion';
import { useApi } from '@/lib/api';
import { colors } from '@/theme/tokens';

/** Chuẩn hóa mã: chữ in hoa, bỏ ký tự lạ, tối đa 10. */
export const cleanReferralCode = (t: string) => t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

export type ReferralCheck = { state: 'empty' | 'typing' | 'checking' } | { state: 'ok'; ownerName: string } | { state: 'bad'; message: string };

/**
 * Kiểm mã giới thiệu khi gõ (chờ 400ms, từ 6 ký tự). Chỉ kiểm, không áp dụng — áp dụng khi người dùng lưu.
 * Mã chưa hợp lệ: chỉ báo, không chặn lưu ở màn đăng ký (bỏ qua mã sai là được).
 */
export function useReferralCheck(code: string): ReferralCheck {
  const { svc } = useApi();
  const [debounced, setDebounced] = useState(code);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(code), 400);
    return () => clearTimeout(t);
  }, [code]);
  const ready = debounced.length >= 6 && debounced === code;
  const q = useQuery({
    queryKey: ['referral-check', debounced],
    queryFn: () => svc.checkReferralCode(debounced),
    enabled: ready,
    staleTime: 60_000,
    retry: false,
  });
  if (!code) return { state: 'empty' };
  if (!ready) return { state: 'typing' };
  if (q.isPending) return { state: 'checking' };
  if (q.isError) return { state: 'bad', message: 'Chưa kiểm tra được mã. Thử lại sau giây lát.' };
  return q.data.ok ? { state: 'ok', ownerName: q.data.ownerName } : { state: 'bad', message: q.data.message };
}

export interface ReferralCodeInputProps {
  value: string;
  onChange: (v: string) => void;
  check: ReferralCheck;
  /** Nút bên phải (màn Giới thiệu: "Áp dụng"). */
  action?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
  /** Dòng gợi ý khi chưa gõ. */
  hint?: string;
  label?: string;
}

/** Ô "Mã giới thiệu · nếu có": tự in hoa, báo tên chủ mã khi đúng, báo lỗi khi sai. */
export function ReferralCodeInput({ value, onChange, check, action, onAction, actionDisabled, hint, label = 'Mã giới thiệu · nếu có' }: ReferralCodeInputProps) {
  return (
    <View style={{ gap: 8 }}>
      <Field
        label={label}
        value={value}
        onChangeText={(t) => onChange(cleanReferralCode(t))}
        placeholder="VD: LAN7QX"
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={10}
        action={action}
        onAction={onAction}
        actionDisabled={actionDisabled}
        aria-invalid={check.state === 'bad'}
      />
      <View accessibilityLiveRegion="polite" style={{ minHeight: 18 }}>
        {check.state === 'ok' ? (
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <Pop>
              <Icon name="check" size={16} color={colors.good} strokeWidth={2.6} />
            </Pop>
            <T weight={600} size={13} lineHeight={18} color={colors.good} style={{ flex: 1 }}>
              Mã của {check.ownerName}
              {check.ownerName.endsWith('.') ? '' : '.'} Bạn nhận điểm sau khi báo giá thật chuyến đầu tiên.
            </T>
          </View>
        ) : check.state === 'bad' ? (
          <View role="alert" style={{ flexDirection: 'row', gap: 6 }}>
            <Icon name="info" size={16} color={colors.bad} strokeWidth={2.2} />
            <T weight={600} size={13} lineHeight={18} color={colors.bad} style={{ flex: 1 }}>
              {check.message}
            </T>
          </View>
        ) : check.state === 'checking' ? (
          <T size={13} lineHeight={18} color={colors.muted}>
            Đang kiểm tra mã…
          </T>
        ) : hint ? (
          <T size={13} lineHeight={18} color={colors.muted}>
            {hint}
          </T>
        ) : null}
      </View>
    </View>
  );
}
