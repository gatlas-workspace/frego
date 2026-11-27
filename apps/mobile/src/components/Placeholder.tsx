import { View } from 'react-native';
import { T } from '@/components/ui/Text';
import { colors } from '@/theme/tokens';

/** Màn tạm khi chưa dựng xong. */
export function Placeholder({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, padding: 20 }}>
      <T variant="screenTitle">{title}</T>
    </View>
  );
}
