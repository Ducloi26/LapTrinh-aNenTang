import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GradientColors } from '@/constants/moodflow';

interface Props {
  isLogin: boolean;
  moodColors: GradientColors;
  onDismiss: () => void;
}

export default function AuthSuccess({ isLogin, moodColors, onDismiss }: Props) {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={moodColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconCircle}
      >
        <Text style={styles.checkmark}>✓</Text>
      </LinearGradient>

      <Text style={styles.heading}>
        {isLogin ? 'Chào mừng trở lại' : 'Tài khoản đã sẵn sàng'}
      </Text>

      <Text style={styles.description}>
        {isLogin
          ? 'Đang đưa bạn vào Music Journey gần nhất của bạn.'
          : 'Hãy bắt đầu bằng việc chọn tâm trạng hiện tại của bạn ở Trang chủ.'}
      </Text>

      <Pressable onPress={onDismiss}>
        <LinearGradient
          colors={moodColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Vào MoodFlow</Text>
          <Text style={styles.arrow}>→</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 360,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  checkmark: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.bg,
  },
  heading: {
    fontSize: 24,
    fontWeight: '400',
    color: COLORS.text,
    textAlign: 'center',
  },
  description: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 8,
    maxWidth: 320,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 26,
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 13,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.bg,
  },
  arrow: {
    fontSize: 16,
    color: COLORS.bg,
  },
});
