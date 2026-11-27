import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import type { IconName, ProviderId } from '@frego/core';
import { BrandLogo, MonoLogo } from './BrandLogo';
import { Icon } from './Icon';
import { T } from './Text';
import { Toggle } from './Toggle';
import { colors, radius } from '@/theme/tokens';

export type ListRowLead = 'icon' | 'mono' | 'logo' | 'none';
export type ListRowTrail = 'none' | 'chev' | 'toggle' | 'action' | 'done';

export interface ListRowProps {
  /** Phần đầu (design `lead`): icon (ô tròn 40) · mono (ô chữ tối) · logo (logo hãng) · none. Mặc định: icon nếu có `icon`, mono nếu có `mono`, logo nếu có `logo`. */
  lead?: ListRowLead;
  /** Icon phần đầu (design `icon`: clock, pin, home, brief, ticket, bell, link, shield, mail, receipt, card…). */
  icon?: IconName;
  /** Tông ô icon (design `leadTone`): tint (tím nhạt) | neutral (xám). */
  leadTone?: 'tint' | 'neutral';
  /** Chữ viết tắt khi lead = mono (design `mono`), VD "VP". Nhận `LinkRowView.mono`. */
  mono?: string;
  /** Logo hãng khi lead = logo (design `logo`): grab | be | gsm. */
  logo?: ProviderId;
  /** Tiêu đề (design `title`). */
  title: string;
  /** Phần in đậm đứng trước tiêu đề, cho kết quả tìm kiếm (design `hl`): hl="Chợ Bến" title="Thành". */
  hl?: string;
  /** Dòng phụ (design `sub`). */
  sub?: string;
  /** Màu dòng phụ (design `subTone`): muted | deal (cam, đậm 600). */
  subTone?: 'muted' | 'deal';
  /** Cho dòng phụ xuống dòng (design `subWrap`); mặc định cắt 1 dòng. */
  subWrap?: boolean;
  /** Chữ nhỏ bên phải (design `meta`), VD "5,8 km". */
  meta?: string;
  /** Nhãn viên bên phải (design `chip`), VD "3 voucher", "+50". */
  chip?: string;
  /** Tông nhãn viên (design `chipTone`): deal | tint. */
  chipTone?: 'deal' | 'tint';
  /** Phần cuối (design `trail`): chev · toggle · action (nút viền) · done (nhãn đã xong) · none. */
  trail?: ListRowTrail;
  /** Trạng thái công tắc khi trail = toggle (design `checked`). */
  checked?: boolean;
  /** Chữ nút khi trail = action (design `actionLabel`, mặc định "Liên kết"). */
  actionLabel?: string;
  /** Bấm nút khi trail = action (design `onAction`). */
  onAction?: () => void;
  /** Chữ nhãn khi trail = done (design `doneLabel`, mặc định "Đã liên kết"). */
  doneLabel?: string;
  /**
   * Bấm cả hàng: điều hướng (trail chev), bật/tắt (trail toggle → role switch), hoặc chọn (truyền `selected`).
   * Không có thì hàng chỉ hiển thị.
   */
  onPress?: () => void;
  /** Hàng chọn được (aria-pressed): true/false → accessibilityState.selected. */
  selected?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** UiListRow: hàng danh sách cao tối thiểu 68 (đặt trong ListCard để có nền trắng và vạch ngăn). */
export function ListRow(props: ListRowProps) {
  const {
    icon,
    leadTone = 'tint',
    mono,
    logo,
    title,
    hl,
    sub,
    subTone = 'muted',
    subWrap,
    meta,
    chip,
    chipTone = 'deal',
    trail = 'none',
    checked = false,
    actionLabel = 'Liên kết',
    onAction,
    doneLabel = 'Đã liên kết',
    onPress,
    selected,
    accessibilityLabel,
    accessibilityHint,
    disabled,
    style,
  } = props;
  const lead: ListRowLead = props.lead ?? (icon ? 'icon' : mono ? 'mono' : logo ? 'logo' : 'none');

  const leadEl =
    lead === 'icon' && icon ? (
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: leadTone === 'neutral' ? colors.surfaceAlt : colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={icon} size={20} color={leadTone === 'neutral' ? colors.ink2 : colors.primary} strokeWidth={1.9} />
      </View>
    ) : lead === 'mono' && mono ? (
      <MonoLogo text={mono} />
    ) : lead === 'logo' && logo ? (
      <BrandLogo kind={logo} size={40} radius={12} />
    ) : null;

  const body = (
    <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
      {hl ? (
        <T size={15} lineHeight={20}>
          <T weight={700} size={15} lineHeight={20}>
            {hl}
          </T>{' '}
          {title}
        </T>
      ) : (
        <T weight={700} size={15} lineHeight={20}>
          {title}
        </T>
      )}
      {sub ? (
        subTone === 'deal' ? (
          <T weight={600} size={13} lineHeight={18} color={colors.dealInk}>
            {sub}
          </T>
        ) : (
          <T size={13} lineHeight={subWrap ? 19 : 18} color={colors.muted} numberOfLines={subWrap ? undefined : 1}>
            {sub}
          </T>
        )
      ) : null}
    </View>
  );

  const right =
    meta || chip ? (
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        {meta ? (
          <T weight={600} size={13} lineHeight={17} color={colors.muted} numberOfLines={1}>
            {meta}
          </T>
        ) : null}
        {chip ? (
          <View
            style={{
              borderRadius: radius.pill,
              paddingVertical: 3,
              paddingHorizontal: 9,
              backgroundColor: chipTone === 'tint' ? colors.primarySoft : colors.deal,
            }}
          >
            <T weight={800} size={12} lineHeight={16} color={chipTone === 'tint' ? colors.primaryDeep : colors.dealInk} numberOfLines={1}>
              {chip}
            </T>
          </View>
        ) : null}
      </View>
    ) : null;

  const trailEl =
    trail === 'chev' ? (
      <Icon name="chev" size={20} color={colors.muted} strokeWidth={2} />
    ) : trail === 'toggle' ? (
      <Toggle checked={checked} />
    ) : trail === 'action' ? (
      <Pressable
        onPress={onAction}
        accessibilityRole="button"
        accessibilityLabel={`${actionLabel} ${title}`}
        style={({ pressed }) => ({
          height: 44,
          paddingHorizontal: 16,
          borderRadius: radius.small,
          borderWidth: 1.5,
          borderColor: colors.handle,
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
          justifyContent: 'center',
        })}
      >
        <T weight={800} size={14} lineHeight={18} color={colors.ink} numberOfLines={1}>
          {actionLabel}
        </T>
      </Pressable>
    ) : trail === 'done' ? (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          borderRadius: radius.small,
          paddingVertical: 8,
          paddingHorizontal: 10,
          backgroundColor: colors.goodSoft,
        }}
      >
        <Icon name="check" size={14} color={colors.good} strokeWidth={2.4} />
        <T weight={800} size={13} lineHeight={17} color={colors.good} numberOfLines={1}>
          {doneLabel}
        </T>
      </View>
    ) : null;

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 68,
    paddingVertical: 12,
    paddingHorizontal: 16,
  };
  const content = (
    <>
      {leadEl}
      {body}
      {right}
      {trailEl}
    </>
  );

  if (!onPress) {
    return <View style={[rowStyle, style]}>{content}</View>;
  }
  const isSwitch = trail === 'toggle';
  const a11yParts = [hl ? `${hl} ${title}` : title, sub, meta, chip, trail === 'done' ? doneLabel : undefined].filter(Boolean);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={isSwitch ? 'switch' : 'button'}
      accessibilityLabel={accessibilityLabel ?? a11yParts.join(', ')}
      accessibilityHint={accessibilityHint}
      accessibilityState={isSwitch ? { checked, disabled: !!disabled } : { selected, disabled: !!disabled }}
      style={({ pressed }) => [rowStyle, { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }, style]}
    >
      {content}
    </Pressable>
  );
}
