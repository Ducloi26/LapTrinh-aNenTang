import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, moodById } from '@/constants/moodflow';

interface DiscoverCardProps {
  title: string;
  reason: string;
  moodId: string;
}

export default function DiscoverCard({
  title,
  reason,
  moodId,
}: DiscoverCardProps) {
  const m = moodById(moodId);

  return (
    <View style={styles.card}>
      <LinearGradient colors={m.colors} style={styles.cardCover} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.reason}>{reason}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 250,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 18,
    marginRight: 14,
  },
  cardCover: {
    width: '100%',
    height: 88,
    borderRadius: 12,
    marginBottom: 14,
    opacity: 0.9,
  },
  title: {
    fontWeight: '800',
    fontSize: 14.5,
    color: COLORS.text,
    marginBottom: 6,
  },
  reason: {
    fontSize: 12,
    color: COLORS.faint,
    lineHeight: 18,
  },
});
