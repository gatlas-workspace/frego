import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { BrandLogo, type BrandLogoKind } from './BrandLogo';
import { DashLine } from './Dash';
import { Icon } from './Icon';
import { T } from './Text';
import { colors, radius, shadow } from '@/theme/tokens';

export type VoucherTag = 'sponsor' | 'frego' | 'public';

export interface VoucherTicketProps {
  /** Logo cuống vé (design `logo`: cup, f, bowl, lotus, gr, gym, book, cake). Nhận `CategoryKey | 'frego' | ProviderId` của core; `gr` = grab. */
  logo: BrandLogoKind | 'gr';
  /** Số tiền giảm (design `amount`; core `amountText`). */
  amountText: string;
  /** Dịch vụ dưới số tiền (design `service`; core `serviceText`). Rỗng thì ẩn. */
  serviceText?: string;
  /** Loại mã (design `tag`): sponsor "Tài trợ" · frego "Frego" · public "Công khai". */
  tag: VoucherTag;
  /** Ghi đè chữ nhãn (design `tagText`), VD "Quà chào mừng". */
  tagText?: string;
  /** Tên mã/quán (design `title`; `WalletGiftView.title`). */
  title?: string;
  /** Bí danh của `title` cho `AttachItemView.name`. */
  name?: string;
  /** Dòng điều kiện (design `line`; `WalletGiftView.line`). */
  line?: string;
  /** Bí danh của `line` cho `AttachItemView.conditionLine`. */
  conditionLine?: string;
  /** Icon trước dòng điều kiện (design `lineIcon`): spark | none. */
  lineIcon?: 'spark' | 'none';
  /** Dòng nhỏ cuối (design `meta`; core `metaText`), VD "HSD 30/11/2026". */
  metaText?: string;
  /**
   * Kiểu (design `mode`):
   * - link: cả vé bấm được, cuối vé có chữ `action` (Ví voucher)
   * - attach: nút Gắn / Đã gắn (bước gắn voucher)
   * - static: chỉ hiển thị
   */
  mode?: 'link' | 'attach' | 'static';
  /** Đã gắn (design `attached`) khi mode = attach. */
  attached?: boolean;
  /** Bấm Gắn / Đã gắn (design `onToggle`). */
  onToggle?: () => void;
  /** Chữ hành động khi mode = link (design `action`), VD "Xem mã ›", "Dùng ›". */
  action?: string;
  /** Bấm cả vé (mode = link). */
  onPress?: () => void;
  /** Màu hai khuyết tròn trên/dưới = màu nền phía sau vé (mặc định nền trang #F4F5FA; nền trắng thì truyền colors.surface). */
  notchColor?: string;
  style?: StyleProp<ViewStyle>;
}

const TAG_LABEL: Record<VoucherTag, string> = { sponsor: 'Tài trợ', frego: 'Frego', public: 'Công khai' };

/**
 * UiVoucherTicket: vé voucher có cuống cam bên trái, đường răng cưa và hai khuyết tròn.
 * Truyền thẳng `WalletGiftView` (`{...gift}`) hoặc `AttachItemView` (`{...item}`).
 */
export function VoucherTicket(props: VoucherTicketProps) {
  const {
    logo,
    amountText,
    serviceText,
    tag,
    tagText,
    lineIcon = 'none',
    metaText,
    mode = 'link',
    attached = false,
    onToggle,
    action = 'Xem mã ›',
    onPress,
    notchColor = colors.bg,
    style,
  } = props;
  const title = props.title ?? props.name ?? '';
  const line = props.line ?? props.conditionLine ?? '';
  const logoKind: BrandLogoKind = logo === 'gr' ? 'grab' : logo;
  const tagLabel = tagText || TAG_LABEL[tag];
  const hasBottom = !!metaText || mode !== 'static';

  const tagStyle: ViewStyle =
    tag === 'sponsor'
      ? { borderWidth: 1, borderColor: colors.dash, paddingVertical: 1, paddingHorizontal: 7 }
      : { backgroundColor: tag === 'frego' ? colors.primarySoft : colors.surfaceAlt, paddingVertical: 2, paddingHorizontal: 7 };

  const notch = (pos: 'top' | 'bottom') => (
    <View
      style={{
        position: 'absolute',
        left: -8,
        [pos]: -10,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: notchColor,
      }}
    />
  );

  const ticket = (
    <View style={{ flexDirection: 'row', borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface }}>
      {/* Cuống vé */}
      <View
        style={{
          width: 104,
          paddingVertical: 14,
          paddingHorizontal: 8,
          backgroundColor: colors.deal,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}
      >
        <BrandLogo kind={logoKind} size={52} radius={14} iconSize={28} fontSize={24} />
        {/* Số tiền không xuống dòng; được tràn vào phần đệm như thiết kế (nowrap): khung rộng đủ 104px. */}
        <View style={{ alignSelf: 'stretch', marginHorizontal: -8 }}>
          <T weight={800} size={17} lineHeight={20} color={colors.dealInk} numberOfLines={1} align="center" style={{ fontVariant: ['tabular-nums'] }}>
            {amountText}
          </T>
        </View>
        {serviceText ? (
          <T weight={600} size={12} lineHeight={16} color={colors.ink2} align="center">
            {serviceText}
          </T>
        ) : null}
      </View>
      {/* Răng cưa + hai khuyết */}
      <View style={{ width: 2, alignSelf: 'stretch' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <DashLine style={{ flex: 1 }} />
        {notch('top')}
        {notch('bottom')}
      </View>
      {/* Thân vé */}
      <View style={{ flex: 1, minWidth: 0, paddingTop: 14, paddingBottom: 14, paddingRight: 14, paddingLeft: 16, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <View style={[{ borderRadius: 6 }, tagStyle]}>
            <T weight={700} size={12} lineHeight={16} color={tag === 'frego' ? colors.primaryDeep : colors.ink2} numberOfLines={1}>
              {tagLabel}
            </T>
          </View>
          <T weight={800} size={15} lineHeight={20} style={{ flexShrink: 1 }}>
            {title}
          </T>
        </View>
        {line ? (
          lineIcon === 'spark' ? (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
              <View style={{ marginTop: 2 }}>
                <Icon name="spark" size={15} color={colors.primary} strokeWidth={2} />
              </View>
              <T size={13} lineHeight={19} color={colors.ink2} style={{ flex: 1 }}>
                {line}
              </T>
            </View>
          ) : (
            <T size={13} lineHeight={19} color={colors.ink2}>
              {line}
            </T>
          )
        ) : null}
        {hasBottom ? (
          <View
            style={{
              marginTop: 'auto',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              paddingTop: 2,
            }}
          >
            <T weight={600} size={12} lineHeight={16} color={colors.muted} style={{ flexShrink: 1 }}>
              {metaText ?? ''}
            </T>
            {mode === 'attach' ? (
              <Pressable
                onPress={onToggle}
                accessibilityRole="button"
                accessibilityLabel={attached ? `Đã gắn ${title}. Bấm để bỏ gắn` : `Gắn ${title}`}
                accessibilityState={{ selected: attached }}
                style={({ pressed }) =>
                  attached
                    ? {
                        height: 44,
                        paddingHorizontal: 14,
                        borderRadius: radius.small,
                        backgroundColor: pressed ? colors.primaryDeep : colors.primary,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }
                    : {
                        height: 44,
                        paddingHorizontal: 18,
                        borderRadius: radius.small,
                        borderWidth: 1.5,
                        borderColor: colors.primary,
                        backgroundColor: pressed ? colors.primarySoft : colors.surface,
                        justifyContent: 'center',
                      }
                }
              >
                {attached ? <Icon name="check" size={16} color={colors.white} strokeWidth={2.4} /> : null}
                <T weight={700} size={14} lineHeight={18} color={attached ? colors.white : colors.primary}>
                  {attached ? 'Đã gắn' : 'Gắn'}
                </T>
              </Pressable>
            ) : mode === 'link' ? (
              <T weight={700} size={13} lineHeight={17} color={colors.primary} numberOfLines={1} style={{ flexShrink: 0 }}>
                {action}
              </T>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );

  const outer: ViewStyle = { borderRadius: 22, backgroundColor: colors.surface, boxShadow: shadow.card };
  if (mode === 'link' && onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={[tagLabel, title, amountText, serviceText, line, metaText, action.replace(/\s*›$/, '')]
          .filter(Boolean)
          .join(', ')}
        style={({ pressed }) => [outer, { opacity: pressed ? 0.85 : 1 }, style]}
      >
        {ticket}
      </Pressable>
    );
  }
  return <View style={[outer, style]}>{ticket}</View>;
}
