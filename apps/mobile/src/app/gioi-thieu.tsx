// Màn 3f · Giới thiệu bạn bè (thiết kế UI v3: V3-GioiThieu.dc.html)
import { useMutation, useQuery } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Share, View } from 'react-native';
import { brand, type ReferralFriendView } from '@frego/core';
import { BottomBar, Button, Card, Icon, ModalSheet, ScreenHeader, T } from '@/components/ui';
import { Fill, Float, Pop, Rise, pressScale } from '@/components/motion';
import { ReferralCodeInput, useReferralCheck } from '@/components/screens/account/ReferralCodeInput';
import { copyText } from '@/components/screens/flow/openProviderApp';
import { ErrorState, LoadingState } from '@/components/screens/wallet/QueryState';
import { refreshAll, useApi } from '@/lib/api';
import { colors, radius } from '@/theme/tokens';

const STATUS: Record<ReferralFriendView['status'], { text: (f: ReferralFriendView) => string; bg: string; ink: string }> = {
  rewarded: { text: (f) => `+${f.points} điểm`, bg: colors.goodSoft, ink: colors.good },
  pending: { text: () => 'Chờ chuyến đầu', bg: colors.deal, ink: colors.dealInk },
  held: { text: () => 'Đang kiểm tra', bg: colors.primarySoft, ink: colors.primaryDeep },
  expired: { text: () => 'Hết hạn', bg: colors.surfaceAlt, ink: colors.ink2 },
  rejected: { text: () => 'Không hợp lệ', bg: colors.surfaceAlt, ink: colors.ink2 },
};
const TINTS = [colors.catBook, colors.catBowl, colors.catTea, colors.catCake];

export default function GioiThieuScreen() {
  const { svc, status, guest } = useApi();
  const q = useQuery({ queryKey: ['referral'], queryFn: () => svc.getReferral(), enabled: status === 'signedIn' && !guest });
  const [copied, setCopied] = useState(false);
  const [sheet, setSheet] = useState<'share' | 'rules' | null>(null);
  const [msgCopied, setMsgCopied] = useState<boolean | null>(null);
  const [entry, setEntry] = useState('');
  const check = useReferralCheck(entry);
  const apply = useMutation({
    mutationFn: () => svc.applyReferralCode(entry),
    onSuccess: () => {
      refreshAll();
      q.refetch();
    },
  });
  const closeSheet = () => setTimeout(() => setSheet(null), 80);

  if (status === 'signedOut' || guest) return <Redirect href="/dang-nhap" />;

  const r = q.data;
  const message = r
    ? `Mình dùng ${brand.name} để so giá Grab, Be, Green SM sau khi trừ voucher. Tải app và nhập mã ${r.code} để được ${r.rewardReferee} điểm đổi voucher: ${r.link}`
    : '';

  const share = async () => {
    if (!r) return;
    // Điện thoại: bảng chia sẻ của máy (Zalo, Messenger…). Web không có bảng chia sẻ thì hiện tin nhắn để chép.
    if (Platform.OS !== 'web') {
      try {
        await Share.share({ message });
        return;
      } catch {
        /* rơi xuống bảng dự phòng */
      }
    }
    setMsgCopied(null);
    setSheet('share');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader
        title="Giới thiệu bạn bè"
        backLabel="Quay lại Tài khoản"
        right={<Button label="Thể lệ" variant="text" size="sm" block={false} onPress={() => setSheet('rules')} />}
      />
      {q.isPending ? (
        <LoadingState label="Đang tải mã giới thiệu" />
      ) : q.isError || !r ? (
        <ErrorState onRetry={() => q.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 16 }} showsVerticalScrollIndicator={false}>
          <Rise>
            <Card tone="primary" padding={18} gap={14}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ flex: 1, gap: 6 }}>
                  <T accessibilityRole="header" weight={800} size={21} lineHeight={27} color={colors.white} style={{ letterSpacing: -0.3 }}>
                    Rủ bạn đi xe rẻ hơn, cả hai cùng có điểm
                  </T>
                  <T size={13} lineHeight={19} color={colors.onPrimarySoft}>
                    Điểm cộng khi bạn ấy báo giá thật chuyến đầu tiên.
                  </T>
                </View>
                <Float>
                  <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: colors.primaryDeep, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="gift" size={30} color={colors.vehicleHeadlight} strokeWidth={2} />
                  </View>
                </Float>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  ['Bạn nhận', r.rewardReferrer],
                  ['Bạn bè nhận', r.rewardReferee],
                ].map(([label, pts]) => (
                  <View key={label} style={{ flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.primaryDeep, gap: 2 }}>
                    <T weight={600} size={12} lineHeight={16} color={colors.onPrimarySoft}>
                      {label}
                    </T>
                    <T weight={800} size={20} lineHeight={25} color={colors.white} style={{ fontVariant: ['tabular-nums'] }}>
                      +{pts} điểm
                    </T>
                  </View>
                ))}
              </View>
            </Card>
          </Rise>

          {/* Mã của bạn */}
          <Rise index={1}>
            <View style={{ padding: 16, gap: 8, borderRadius: radius.card, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.onPrimarySoft, backgroundColor: colors.surface }}>
              <T weight={700} size={12} lineHeight={16} color={colors.muted}>
                Mã giới thiệu của bạn
              </T>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <T weight={800} size={28} lineHeight={34} selectable accessibilityLabel={`Mã ${r.code.split('').join(' ')}`} style={{ letterSpacing: 3, flexShrink: 1 }}>
                  {r.code}
                </T>
                {copied ? (
                  <Pop>
                    <View role="status" style={{ minWidth: 96, minHeight: 48, borderRadius: 12, backgroundColor: colors.goodSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <Icon name="check" size={16} color={colors.good} strokeWidth={2.6} />
                      <T weight={800} size={14} lineHeight={18} color={colors.good}>
                        Đã chép
                      </T>
                    </View>
                  </Pop>
                ) : (
                  <Pressable
                    onPress={async () => setCopied(await copyText(r.code))}
                    accessibilityRole="button"
                    accessibilityLabel={`Chép mã ${r.code}`}
                    style={({ pressed }) => [
                      { minWidth: 96, minHeight: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
                      pressScale(pressed),
                    ]}
                  >
                    <Icon name="copy" size={16} color={colors.primaryDeep} strokeWidth={2} />
                    <T weight={800} size={14} lineHeight={18} color={colors.primaryDeep}>
                      Chép mã
                    </T>
                  </Pressable>
                )}
              </View>
              <T size={13} lineHeight={18} color={colors.ink2} selectable>
                Hoặc gửi link: <T weight={700} size={13} lineHeight={18}>{r.link.replace(/^https?:\/\//, '')}</T>
              </T>
            </View>
          </Rise>

          {/* Cách nhận thưởng */}
          <Rise index={2} style={{ gap: 10 }}>
            <T accessibilityRole="header" weight={800} size={17} lineHeight={22} style={{ paddingHorizontal: 4 }}>
              Cách nhận thưởng
            </T>
            <Card padding={14} gap={12}>
              {[
                'Gửi mã hoặc link cho bạn bè.',
                `Bạn ấy tải ${brand.name}, đăng nhập bằng số điện thoại và nhập mã khi tạo tài khoản (hoặc trong 7 ngày đầu).`,
                'Khi bạn ấy báo giá thật chuyến đầu tiên trong 30 ngày, cả hai được cộng điểm để đổi voucher.',
              ].map((t, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <T weight={800} size={14} lineHeight={18} color={colors.primaryDeep}>
                      {i + 1}
                    </T>
                  </View>
                  <T size={14} lineHeight={21} style={{ flex: 1 }}>
                    {t}
                  </T>
                </View>
              ))}
            </Card>
          </Rise>

          {/* Bạn bè đã mời */}
          <Rise index={3} style={{ gap: 10 }}>
            <View style={{ paddingHorizontal: 4, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <T accessibilityRole="header" weight={800} size={17} lineHeight={22}>
                Bạn bè đã mời
              </T>
              <T size={13} lineHeight={18} color={colors.ink2}>
                Đã nhận{' '}
                <T weight={800} size={13} lineHeight={18}>
                  {r.pointsEarned} điểm
                </T>
              </T>
            </View>
            <Card padding={12} gap={8}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <T weight={700} size={13} lineHeight={18}>
                  Lượt được thưởng tháng này
                </T>
                <T weight={800} size={13} lineHeight={18} style={{ fontVariant: ['tabular-nums'] }}>
                  {r.monthRewarded}/{r.monthlyCap}
                </T>
              </View>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: 6, borderRadius: 3, backgroundColor: colors.track, overflow: 'hidden' }}>
                <Fill progress={r.monthRewarded / r.monthlyCap} color={colors.primary} style={{ borderRadius: 3 }} />
              </View>
            </Card>
            {r.friends.length ? (
              <Card padding={0} clip>
                {r.friends.map((f, i) => {
                  const st = STATUS[f.status];
                  return (
                    <View
                      key={f.id}
                      accessible
                      accessibilityLabel={`${f.name}, ${f.sub}, ${st.text(f)}`}
                      style={{ minHeight: 64, paddingVertical: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: TINTS[i % TINTS.length], alignItems: 'center', justifyContent: 'center' }}>
                        <T weight={800} size={15} lineHeight={19} color={colors.white}>
                          {f.initial}
                        </T>
                      </View>
                      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                        <T weight={700} size={15} lineHeight={20}>
                          {f.name}
                        </T>
                        <T size={12} lineHeight={16} color={colors.muted} numberOfLines={1}>
                          {f.sub}
                        </T>
                      </View>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: st.bg }}>
                        <T weight={800} size={12} lineHeight={16} color={st.ink} numberOfLines={1}>
                          {st.text(f)}
                        </T>
                      </View>
                    </View>
                  );
                })}
              </Card>
            ) : (
              <T size={13} lineHeight={19} color={colors.muted} style={{ paddingHorizontal: 4 }}>
                Chưa mời ai. Gửi mã cho bạn bè để cả hai cùng có điểm.
              </T>
            )}
          </Rise>

          {/* Nhập mã của bạn bè (trong 7 ngày đầu) */}
          {r.enteredBy ? (
            <Card padding={14} gap={6} style={{ backgroundColor: colors.goodSoft, borderColor: colors.goodSoft }}>
              <T weight={800} size={14} lineHeight={19} color={colors.good}>
                Đã nhận mã giới thiệu của {r.enteredBy.name}
              </T>
              <T size={13} lineHeight={19} color={colors.good}>
                Báo giá thật chuyến đầu tiên trong 30 ngày để nhận {r.rewardReferee} điểm.
              </T>
            </Card>
          ) : r.canEnter ? (
            <Card padding={14} gap={10}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                <T accessibilityRole="header" weight={800} size={15} lineHeight={20}>
                  Có mã của bạn bè?
                </T>
                {r.enterDaysLeft !== null ? (
                  <T weight={700} size={12} lineHeight={16} color={colors.dealInk}>
                    Còn {r.enterDaysLeft} ngày để nhập
                  </T>
                ) : null}
              </View>
              <ReferralCodeInput
                label="Mã giới thiệu của bạn bè"
                value={entry}
                onChange={setEntry}
                check={apply.isError ? { state: 'bad', message: apply.error instanceof Error ? apply.error.message : 'Chưa áp dụng được mã.' } : check}
                action={apply.isPending ? 'Đang áp dụng…' : 'Áp dụng'}
                onAction={() => apply.mutate()}
                actionDisabled={check.state !== 'ok' || apply.isPending}
                hint="Mỗi tài khoản nhập được một mã, không đổi lại được."
              />
            </Card>
          ) : null}

          <T size={12} lineHeight={18} color={colors.muted} style={{ paddingHorizontal: 4 }}>
            Chỉ thưởng một tầng: bạn không nhận điểm khi bạn của bạn mời thêm người khác. Điểm không đổi ra tiền mặt.
          </T>
        </ScrollView>
      )}
      <BottomBar>
        <Button label="Chia sẻ mã cho bạn bè" icon="external" iconPosition="start" onPress={share} disabled={!r} />
      </BottomBar>

      {sheet === 'share' && r ? (
        <ModalSheet onDismiss={closeSheet} dismissLabel="Đóng hộp chia sẻ" gap={14}>
          <T weight={800} size={20} lineHeight={26} accessibilityRole="header">
            Tin nhắn sẽ gửi
          </T>
          <View style={{ padding: 14, borderRadius: 14, backgroundColor: colors.bg }}>
            <T size={14} lineHeight={22} selectable>
              {message}
            </T>
          </View>
          <Button label={msgCopied ? 'Đã chép tin nhắn' : 'Chép tin nhắn'} icon={msgCopied ? 'check' : 'copy'} onPress={async () => setMsgCopied(await copyText(message))} />
          {msgCopied === false ? (
            <T size={13} lineHeight={19} color={colors.ink2} accessibilityLiveRegion="polite">
              Trình duyệt này không cho chép tự động. Giữ ngón tay lên tin nhắn ở trên để chọn và chép.
            </T>
          ) : null}
          <Button label="Đóng" variant="ghost" onPress={closeSheet} />
        </ModalSheet>
      ) : null}

      {sheet === 'rules' ? (
        <ModalSheet onDismiss={closeSheet} dismissLabel="Đóng thể lệ" gap={12} scroll>
          <T weight={800} size={20} lineHeight={26} accessibilityRole="header">
            Thể lệ giới thiệu
          </T>
          {[
            `Bạn nhận ${r?.rewardReferrer ?? 200} điểm, bạn bè nhận ${r?.rewardReferee ?? 100} điểm khi bạn bè báo giá thật chuyến đầu tiên trong 30 ngày kể từ lúc nhập mã.`,
            'Bạn bè phải là tài khoản mới đăng nhập bằng số điện thoại và nhập mã trong 7 ngày đầu. Không tự nhập mã của mình.',
            `Tối đa ${r?.monthlyCap ?? 10} lượt được thưởng mỗi tháng. Lượt vượt mức hoặc có dấu hiệu bất thường được giữ lại để ${brand.name} kiểm tra.`,
            'Tạo nhiều tài khoản, mua bán mã hay dùng công cụ tự động sẽ bị thu hồi điểm và khóa tài khoản.',
            `${brand.name} có thể điều chỉnh hoặc dừng chương trình và sẽ báo trước trong app.`,
          ].map((t) => (
            <View key={t} style={{ flexDirection: 'row', gap: 8 }}>
              <T size={14} lineHeight={21}>•</T>
              <T size={14} lineHeight={21} style={{ flex: 1 }}>
                {t}
              </T>
            </View>
          ))}
          <Button label="Đã hiểu" onPress={closeSheet} />
        </ModalSheet>
      ) : null}
    </View>
  );
}

