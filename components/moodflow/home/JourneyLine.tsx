import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, Mood } from '@/constants/moodflow';

interface JourneyLineProps {
  from: Mood;
  to: Mood;
}

export default function JourneyLine({ from, to }: JourneyLineProps) {
  return (
    <View style={styles.container}>
      <View style={styles.moodCol}>
        <Text style={styles.emoji}>{from.emoji}</Text>
        <Text style={styles.moodLabel}>{from.label}</Text>
      </View>

      <View style={styles.lineWrap}>
        <LinearGradient
          colors={[from.colors[0], to.colors[to.colors.length - 1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientLine}
        />
      </View>

      <View style={styles.moodCol}>
        <Text style={styles.emoji}>{to.emoji}</Text>
        <Text style={styles.moodLabel}>{to.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 22,
    paddingHorizontal: 8,
  },
  moodCol: {
    alignItems: 'center',
    width: 76,
    gap: 8,
  },
  emoji: {
    fontSize: 30,
  },
  moodLabel: {
    fontSize: 12.5,
    color: COLORS.muted,
    fontWeight: '600',
    textAlign: 'center',
  },
  lineWrap: {
    flex: 1,
    height: 3,
    borderRadius: 3,
    overflow: 'hidden',
  },
  gradientLine: {
    width: '100%',
    height: '100%',
  },
});
