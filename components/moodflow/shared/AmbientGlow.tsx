import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mood } from '@/constants/moodflow';

interface AmbientGlowProps {
  currentMood: Mood;
}

export default function AmbientGlow({ currentMood }: AmbientGlowProps) {
  if (Platform.OS === 'web') {
    return (
      <View
        pointerEvents="none"
        style={[
          styles.glowWeb,
          {
            // @ts-ignore
            background: `radial-gradient(circle, ${currentMood.colors[0]}44 0%, ${currentMood.colors[1] || currentMood.colors[0]}22 50%, transparent 75%)`,
            filter: 'blur(100px)',
            transition: 'all 1s ease',
          },
        ]}
      />
    );
  }

  return (
    <View pointerEvents="none" style={styles.glowNative}>
      <LinearGradient
        colors={[currentMood.colors[0], 'transparent']}
        style={styles.gradient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  glowWeb: {
    position: 'absolute',
    top: -120,
    left: '15%',
    width: 600,
    height: 600,
    borderRadius: 300,
    zIndex: 0,
  },
  glowNative: {
    position: 'absolute',
    top: -100,
    left: 20,
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.35,
    overflow: 'hidden',
    zIndex: 0,
  },
  gradient: {
    width: '100%',
    height: '100%',
  },
});
