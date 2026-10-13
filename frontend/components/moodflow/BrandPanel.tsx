import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, MOODS } from '@/constants/moodflow';

interface Props {
  moodIndex: number;
}

export default function BrandPanel({ moodIndex }: Props) {
  const mood = MOODS[moodIndex] || MOODS[0];
  const orbColors: [string, string, ...string[]] = [mood.colors[0], mood.colors[1], 'transparent'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={orbColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.orbGradient}
      />

      <View style={styles.header}>
        <LinearGradient
          colors={mood.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoIcon}
        />
        <Text style={styles.logoText}>MoodFlow</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.dotsRow}>
          {MOODS.map((_, i) => (
            <View key={i} style={[styles.dot, i === moodIndex ? styles.dotActive : null]}>
              {i === moodIndex && (
                <LinearGradient
                  colors={mood.colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.dotGradient}
                />
              )}
            </View>
          ))}
        </View>

        <View style={styles.moodLabel}>
          <Text style={styles.moodEmoji}>{mood.emoji}</Text>
          <Text style={styles.moodLabelText}>{mood.label.toUpperCase()}</Text>
        </View>

        <Text style={styles.headline}>{mood.line}</Text>

        <Text style={styles.description}>
          MoodFlow lắng nghe tâm trạng, hoạt động và mục tiêu cảm xúc của bạn
          — rồi dựng nên một Music Journey chỉ dành riêng cho khoảnh khắc này.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerIcon}>🎵</Text>
        <Text style={styles.footerText}>Được xây dựng quanh Music DNA của riêng bạn</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 36,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  orbGradient: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '500',
    color: COLORS.text,
  },
  content: {
    maxWidth: 360,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 22,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  dotActive: {
    width: 22,
  },
  dotGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  moodLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodLabelText: {
    fontSize: 13,
    color: COLORS.faint,
    fontWeight: '700',
  },
  headline: {
    fontSize: 30,
    fontWeight: '400',
    lineHeight: 38,
    color: COLORS.text,
  },
  description: {
    color: COLORS.muted,
    fontSize: 14,
    marginTop: 18,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerIcon: {
    fontSize: 14,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.faint,
  },
});
