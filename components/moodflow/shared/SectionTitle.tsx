import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/moodflow';

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

export default function SectionTitle({ eyebrow, title, subtitle }: SectionTitleProps) {
  return (
    <View style={styles.container}>
      {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  eyebrow: {
    color: COLORS.faint,
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '500',
    color: COLORS.text,
  },
  subtitle: {
    color: COLORS.muted,
    marginTop: 6,
    fontSize: 14.5,
    lineHeight: 21,
  },
});
