import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SheetHandle, T } from '@/components/ui';
import { colors, radius } from '@/theme/tokens';

export interface SheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  /** Phần cố định dưới cùng (nút chính). */
  footer?: ReactNode;
}

/**
 * Tấm chọn nhỏ trồi từ đáy trên màn hiện tại (lớp phủ tối, bấm ra ngoài để đóng):
 * chọn cách thêm ảnh đại diện, chọn ngân hàng và loại thẻ.
 */
export function SheetModal({ visible, onClose, title, subtitle, children, footer }: SheetModalProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Đóng"
          style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, backgroundColor: colors.scrim }}
        />
        <View
          accessibilityViewIsModal
          style={{
            maxHeight: '88%',
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.sheet,
            borderTopRightRadius: radius.sheet,
            paddingBottom: Math.max(insets.bottom, 24),
          }}
        >
          <View style={{ paddingTop: 10, paddingHorizontal: 20, paddingBottom: 12, gap: 12 }}>
            <SheetHandle />
            <View style={{ gap: 4 }}>
              <T variant="screenTitle" accessibilityRole="header">
                {title}
              </T>
              {subtitle ? (
                <T size={14} lineHeight={20} color={colors.ink2}>
                  {subtitle}
                </T>
              ) : null}
            </View>
          </View>
          <ScrollView
            style={{ flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 14 }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer ? <View style={{ paddingHorizontal: 20, paddingTop: 4, gap: 8 }}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}
