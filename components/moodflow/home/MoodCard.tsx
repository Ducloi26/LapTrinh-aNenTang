import React from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, Mood } from '@/constants/moodflow';

interface MoodCardProps {
  mood: Mood;
  selected: boolean;
  onClick: () => void;
}

export default function MoodCard({ mood, selected, onClick }: MoodCardProps) {
  if (selected) {
    return (
      <Pressable onPress={onClick} style={styles.cardWrap}>
        <LinearGradient
          colors={mood.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardSelected}
        >
          <Text style={styles.emoji}>{mood.emoji}</Text>
          <Text style={styles.labelSelected}>{mood.label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onClick} style={[styles.cardWrap, styles.cardNormal]}>
      <Text style={styles.emoji}>{mood.emoji}</Text>
      <Text style={styles.labelNormal}>{mood.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    flex: 1,
    minWidth: '22%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardNormal: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 92,
  },
  cardSelected: {
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 92,
  },
  emoji: {
    fontSize: 24,
  },
  labelNormal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  labelSelected: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0A0D16',
  },
});
