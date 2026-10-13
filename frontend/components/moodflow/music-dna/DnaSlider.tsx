import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '@/constants/moodflow';

interface DnaSliderProps {
  label: string;
  left: string;
  right: string;
  value: number;
  onChange: (val: number) => void;
}

export default function DnaSlider({
  label,
  left,
  right,
  value,
  onChange,
}: DnaSliderProps) {
  const steps = [20, 40, 60, 80, 100];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.valText}>{value}%</Text>
      </View>

      {/* Interactive step bar */}
      <View style={styles.trackBar}>
        <View style={[styles.fillBar, { width: `${value}%` }]} />
      </View>

      <View style={styles.stepButtons}>
        {steps.map((s) => (
          <Pressable
            key={s}
            onPress={() => onChange(s)}
            style={[styles.stepDot, value >= s && styles.stepDotActive]}
          />
        ))}
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.subText}>{left}</Text>
        <Text style={styles.subText}>{right}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 22,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
  },
  valText: {
    fontSize: 13,
    color: '#67E8F9',
    fontWeight: '700',
  },
  trackBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    position: 'relative',
  },
  fillBar: {
    height: '100%',
    backgroundColor: '#67E8F9',
    borderRadius: 3,
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stepDotActive: {
    backgroundColor: '#FFF',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  subText: {
    fontSize: 12,
    color: COLORS.faint,
  },
});
