import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GradientColors } from '@/constants/moodflow';

interface Props {
  mode: 'login' | 'register';
  moodColors: GradientColors;
  onSwitch: (mode: 'login' | 'register') => void;
}

export default function ModeSwitcher({ mode, moodColors, onSwitch }: Props) {
  return (
    <View style={styles.container}>
      {mode === 'login' && (
        <LinearGradient
          colors={moodColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.indicator, styles.indicatorLeft]}
        />
      )}
      {mode === 'register' && (
        <LinearGradient
          colors={moodColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.indicator, styles.indicatorRight]}
        />
      )}

      <Pressable style={styles.tab} onPress={() => onSwitch('login')}>
        <Text style={[styles.tabText, mode === 'login' ? styles.tabTextActive : null]}>
          Đăng nhập
        </Text>
      </Pressable>

      <Pressable style={styles.tab} onPress={() => onSwitch('register')}>
        <Text style={[styles.tabText, mode === 'register' ? styles.tabTextActive : null]}>
          Đăng ký
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface2,
    borderRadius: 13,
    padding: 4,
    marginBottom: 28,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '48%',
    borderRadius: 10,
  },
  indicatorLeft: {
    left: 4,
  },
  indicatorRight: {
    right: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.muted,
  },
  tabTextActive: {
    color: COLORS.bg,
  },
});
