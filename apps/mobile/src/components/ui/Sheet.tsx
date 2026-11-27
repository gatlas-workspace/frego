import { useRef, type ReactNode } from 'react';
import { PanResponder, Pressable, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from './Text';
import { SlideUp } from '@/components/motion';
import { colors, radius, shadow } from '@/theme/tokens';

/** Thanh kéo 44×5 trên đầu tấm trượt. */
export function SheetHandle() {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.handle }}
    />
  );
}

export interface SheetProps {
  /** Tiêu đề tuyến (20/800, role header), VD "Landmark 81 → Chợ Bến Thành". */
  title?: string;
  /** Dòng phụ 14px, VD "5,8 km · khoảng 20 phút". */
  subtitle?: string;
  /** Phần đầu cố định thêm dưới tiêu đề (không cuộn). */
  header?: ReactNode;
  /** Nội dung cuộn. */
  children?: ReactNode;
  /** Có cuộn nội dung không (mặc định có). */
  scroll?: boolean;
  /** Đệm vùng nội dung (KetQua: 4/20/20, gap 16; ChonHang: 2/20/28, gap 14). */
  contentStyle?: StyleProp<ViewStyle>;
  /** Phần tử cố định dưới đáy tấm (VD BottomBar). */
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Tấm đang thu gọn (chỉ còn tiêu đề + footer) để lộ bản đồ. Truyền cùng `onCollapsedChange` để bật kéo/chạm thanh kéo. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

/** Kéo quá ngưỡng này (px) thì đổi trạng thái thu gọn/mở rộng. */
const DRAG_THRESHOLD = 40;

/** Thanh kéo bấm được: chạm để đổi, kéo xuống để thu gọn, kéo lên để mở rộng. */
function SheetToggle({ collapsed, onChange }: { collapsed: boolean; onChange: (collapsed: boolean) => void }) {
  const state = useRef({ collapsed, onChange });
  state.current = { collapsed, onChange };
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderRelease: (_, g) => {
        const s = state.current;
        if (g.dy > DRAG_THRESHOLD && !s.collapsed) s.onChange(true);
        else if (g.dy < -DRAG_THRESHOLD && s.collapsed) s.onChange(false);
      },
    }),
  ).current;
  return (
    <View {...pan.panHandlers} style={{ marginTop: -10, marginBottom: -12, marginHorizontal: -20 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={collapsed ? 'Mở rộng chi tiết chuyến' : 'Thu gọn để xem bản đồ'}
        accessibilityState={{ expanded: !collapsed }}
        onPress={() => onChange(!collapsed)}
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <SheetHandle />
      </Pressable>
    </View>
  );
}

/**
 * Tấm nền xám bo 28 trồi lên đè 28px lên bản đồ (KetQua, ChonHang).
 * Đặt ngay sau `<MapRoute height={250} />` trong một cột `flex: 1`.
 */
export function Sheet({
  title,
  subtitle,
  header,
  children,
  scroll = true,
  contentStyle,
  footer,
  style,
  collapsed = false,
  onCollapsedChange,
}: SheetProps) {
  const content = [{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 20, gap: 16 }, contentStyle];
  return (
    <View
      style={[
        {
          // Thu gọn: cao vừa tiêu đề + footer (không dùng flex: 0 vì web hiểu thành cao 0).
          ...(collapsed ? { flexGrow: 0, flexShrink: 0 } : { flex: 1 }),
          minHeight: 0,
          marginTop: -28,
          backgroundColor: colors.bg,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          boxShadow: shadow.sheet,
        },
        style,
      ]}
    >
      <View style={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 12, gap: 12 }}>
        {onCollapsedChange ? <SheetToggle collapsed={collapsed} onChange={onCollapsedChange} /> : <SheetHandle />}
        {title || subtitle ? (
          <View style={{ gap: 4 }}>
            {title ? (
              <T variant="screenTitle" lineHeight={25} accessibilityRole="header">
                {title}
              </T>
            ) : null}
            {subtitle ? (
              <T size={14} lineHeight={19} color={colors.ink2}>
                {subtitle}
              </T>
            ) : null}
          </View>
        ) : null}
        {header}
      </View>
      {collapsed ? null : scroll ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, content]}>{children}</View>
      )}
      {footer}
    </View>
  );
}

export interface ModalSheetProps {
  /** Nội dung tấm (sau thanh kéo). */
  children?: ReactNode;
  /** Lớp nền phía sau lớp phủ (VD `<MapRoute height="100%" labels={false} />`). */
  backdrop?: ReactNode;
  /** Bấm lớp phủ tối để đóng. Không có thì lớp phủ không bấm được. */
  onDismiss?: () => void;
  /** Nhãn đọc cho lớp phủ, mặc định "Đóng". */
  dismissLabel?: string;
  /** Khoảng cách giữa các khối (MoApp: 18, BaoGia: 16). */
  gap?: number;
  /** Cho phép cuộn khi nội dung cao (BaoGia: max-height 800). */
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Hộp thoại dạng tấm trắng bo 28 từ đáy, có lớp phủ tối rgba(20,21,43,.5) (MoApp, MoAppGrab, BaoGia).
 * Dùng làm toàn bộ màn (route `presentation: 'fullScreenModal'`).
 */
export function ModalSheet({ children, backdrop, onDismiss, dismissLabel = 'Đóng', gap = 18, scroll, style }: ModalSheetProps) {
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = { paddingTop: 10, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 30), gap };
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {backdrop ? (
        <View
          style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {backdrop}
        </View>
      ) : null}
      <Pressable
        onPress={onDismiss}
        disabled={!onDismiss}
        accessibilityRole={onDismiss ? 'button' : undefined}
        accessibilityLabel={onDismiss ? dismissLabel : undefined}
        style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: colors.scrim }}
      />
      <SlideUp
        accessibilityViewIsModal
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            maxHeight: '95%',
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
          },
          style,
        ]}
      >
        {scroll ? (
          <ScrollView contentContainerStyle={pad} showsVerticalScrollIndicator={false}>
            <SheetHandle />
            {children}
          </ScrollView>
        ) : (
          <View style={pad}>
            <SheetHandle />
            {children}
          </View>
        )}
      </SlideUp>
    </View>
  );
}
