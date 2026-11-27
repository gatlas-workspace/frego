// 0d · Thông tin của bạn (ThongTin-v2): ảnh, tên gọi, ngày sinh, sở thích, loại xe. Không bắt buộc, có Bỏ qua.
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, formatDate, INTERESTS, parseDateVn, VEHICLE_PREFS, vnParts, type MeView, type VehicleClass } from '@frego/core';
import { BottomBar, Button, Field, ListCard, ListRow, Pill, T } from '@/components/ui';
import { AvatarPicker } from '@/components/screens/account/AvatarPicker';
import { PageHeading } from '@/components/screens/account/PageHeading';
import { ErrorView, InlineError, LoadingView } from '@/components/screens/account/ScreenState';
import { SheetModal } from '@/components/screens/account/SheetModal';
import { refreshAll, useApi } from '@/lib/api';
import { colors, layout } from '@/theme/tokens';

/** Gõ số, tự chèn dấu "/" thành dd/mm/yyyy. */
function maskBirthday(input: string) {
  const d = input.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export default function ThongTinScreen() {
  const insets = useSafeAreaInsets();
  const { status, svc } = useApi();
  const me = useQuery({ queryKey: ['me'], queryFn: () => svc.getMe(), enabled: status === 'signedIn' });
  const next = () => router.push('/quyen-rieng-tu');

  if (status === 'signedOut') return <Redirect href="/chao-mung" />;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {me.data ? (
        <ProfileForm me={me.data} topPad={Math.max(insets.top + 12, layout.topInset)} onDone={next} />
      ) : (
        <>
          <View style={{ flex: 1, paddingTop: Math.max(insets.top + 12, layout.topInset), paddingHorizontal: 24 }}>
            <PageHeading title={`Cho ${brand.name} biết thêm về bạn`} />
            {me.isError ? <ErrorView style={{ marginTop: 22 }} onRetry={() => me.refetch()} /> : <LoadingView />}
          </View>
          <BottomBar gap={4}>
            <Button label="Bỏ qua, điền sau" variant="text" size="sm" onPress={next} />
          </BottomBar>
        </>
      )}
    </View>
  );
}

function ProfileForm({ me, topPad, onDone }: { me: MeView; topPad: number; onDone: () => void }) {
  const { svc } = useApi();
  const p = me.profile;
  const [avatar, setAvatar] = useState<string | null>(p.avatarUrl);
  const [name, setName] = useState(p.displayName);
  const [birthday, setBirthday] = useState(p.birthday ? formatDate(p.birthday) : '');
  const [interests, setInterests] = useState<string[]>(p.interests);
  const [vehicles, setVehicles] = useState<VehicleClass[]>(p.vehiclePrefs);
  const [birthdayError, setBirthdayError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [sheet, setSheet] = useState(false);

  const toggle = <K extends string>(list: K[], key: K) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);

  const pick = async (source: 'camera' | 'library') => {
    setSheet(false);
    setPicking(true);
    setSaveError(null);
    try {
      // iOS không mở được trình chọn ảnh khi tấm chọn còn đang đóng.
      if (Platform.OS === 'ios') await new Promise((r) => setTimeout(r, 450));
      const perm =
        source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        setSaveError(
          source === 'camera'
            ? `Chưa có quyền dùng máy ảnh. Bật quyền cho ${brand.name} trong Cài đặt của điện thoại.`
            : `Chưa có quyền mở thư viện ảnh. Bật quyền cho ${brand.name} trong Cài đặt của điện thoại.`,
        );
        return;
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 };
      const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      const uri = !res.canceled ? res.assets[0]?.uri : null;
      if (!uri) return;
      setAvatar(uri);
      await svc.updateProfile({ avatarUrl: uri });
      refreshAll();
    } catch {
      setSaveError('Chưa thêm được ảnh. Thử lại sau ít phút.');
    } finally {
      setPicking(false);
    }
  };

  const save = async () => {
    if (saving) return;
    let birthIso: string | null = null;
    if (birthday.trim()) {
      const d = parseDateVn(birthday);
      if (!d || d.getTime() > Date.now()) {
        setBirthdayError('Ngày sinh chưa đúng. Nhập theo dạng dd/mm/yyyy, ví dụ 20/05/1998.');
        return;
      }
      // Cột `date` (Supabase): lưu đúng ngày theo lịch Việt Nam, dạng yyyy-mm-dd.
      const v = vnParts(d);
      birthIso = `${v.year}-${String(v.month).padStart(2, '0')}-${String(v.day).padStart(2, '0')}`;
    }
    setBirthdayError(null);
    setSaveError(null);
    setSaving(true);
    try {
      await svc.updateProfile({
        displayName: name.trim() || p.displayName,
        birthday: birthIso,
        interests,
        vehiclePrefs: vehicles,
        avatarUrl: avatar,
      });
      refreshAll();
      onDone();
    } catch {
      setSaveError('Chưa lưu được thông tin. Thử lại sau ít phút.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 24, paddingBottom: 24, gap: 22 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
      >
        <PageHeading title={`Cho ${brand.name} biết thêm về bạn`}>
          Để chọn voucher hợp với bạn hơn, như quà sinh nhật hay ưu đãi ở quán bạn thích. {brand.name} không gửi thông tin này cho nhãn
          hàng.
        </PageHeading>
        <AvatarPicker uri={avatar} onPick={() => setSheet(true)} busy={picking} />
        <Field
          label="Tên gọi"
          value={name}
          onChangeText={setName}
          autoComplete="given-name"
          textContentType="givenName"
          autoCapitalize="words"
          returnKeyType="next"
          maxLength={40}
        />
        <View style={{ gap: 8 }}>
          <Field
            label="Ngày sinh"
            value={birthday}
            onChangeText={(t) => {
              setBirthday(maskBirthday(t));
              if (birthdayError) setBirthdayError(null);
            }}
            placeholder="dd/mm/yyyy"
            inputMode="numeric"
            keyboardType="number-pad"
            autoComplete="birthdate-full"
            textContentType="birthdate"
            maxLength={10}
            help={`${brand.name} gửi quà vào tuần sinh nhật của bạn.`}
          />
          {birthdayError ? <InlineError text={birthdayError} /> : null}
        </View>
        <ChoiceGroup
          label="Sở thích"
          hint="chọn nhiều"
          items={INTERESTS}
          selected={interests}
          onToggle={(k) => setInterests((l) => toggle(l, k))}
        />
        <ChoiceGroup
          label="Bạn hay đi loại xe nào?"
          items={VEHICLE_PREFS}
          selected={vehicles}
          onToggle={(k) => setVehicles((l) => toggle(l, k as VehicleClass))}
        />
        {saveError ? <InlineError text={saveError} /> : null}
      </ScrollView>
      <BottomBar gap={4}>
        <Button label={saving ? 'Đang lưu…' : 'Lưu và tiếp tục'} onPress={save} disabled={saving || picking} />
        <Button label="Bỏ qua, điền sau" variant="text" size="sm" onPress={onDone} disabled={saving} />
      </BottomBar>
      <SheetModal visible={sheet} onClose={() => setSheet(false)} title="Ảnh đại diện">
        <ListCard tone="alt" divider="lead">
          <ListRow icon="camera" title="Chụp ảnh mới" trail="chev" onPress={() => pick('camera')} />
          <ListRow icon="user" title="Chọn từ thư viện ảnh" trail="chev" onPress={() => pick('library')} />
        </ListCard>
      </SheetModal>
    </>
  );
}

/** Nhóm viên chọn nhiều (Sở thích, Loại xe). */
function ChoiceGroup<K extends string>({
  label,
  hint,
  items,
  selected,
  onToggle,
}: {
  label: string;
  hint?: string;
  items: readonly { key: K; label: string }[];
  selected: readonly string[];
  onToggle: (key: K) => void;
}) {
  return (
    <View role="group" aria-label={hint ? `${label}, ${hint}` : label} style={{ gap: 10 }}>
      <T weight={700} size={14} lineHeight={19} accessibilityRole="header">
        {label}
        {hint ? (
          <T size={14} lineHeight={19} color={colors.muted}>
            {' · '}
            {hint}
          </T>
        ) : null}
      </T>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {items.map((it) => (
          <Pill key={it.key} label={it.label} state={selected.includes(it.key) ? 'selected' : 'default'} onPress={() => onToggle(it.key)} />
        ))}
      </View>
    </View>
  );
}
