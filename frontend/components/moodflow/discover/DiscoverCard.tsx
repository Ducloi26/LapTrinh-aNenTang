import React from 'react';
import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, moodById } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';

interface DiscoverCardProps {
  title: string;
  creator: string;
  moodFrom: string;
  moodTo: string;
  activityLabel: string;
  durationMinutes: number;
  listenCount: string;
  matchScore: number;
  cover?: string;
  onPress: () => void;
}

export default function DiscoverCard({
  title,
  creator,
  moodFrom,
  moodTo,
  activityLabel,
  durationMinutes,
  listenCount,
  matchScore,
  cover,
  onPress,
}: DiscoverCardProps) {
  const from = moodById(moodFrom);
  const to = moodById(moodTo);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Mở hành trình ${title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.cardCover}>
        <LinearGradient
          colors={[from.colors[0], to.colors[to.colors.length - 1]]}
          style={StyleSheet.absoluteFill}
        />
        {cover ? <Image source={{ uri: cover }} style={styles.coverImage} /> : null}
        <Text style={styles.coverEmoji}>{from.emoji} → {to.emoji}</Text>
      </View>
      <Text numberOfLines={2} style={styles.title}>{title}</Text>
      <Text numberOfLines={1} style={styles.creator}>Bởi {creator}</Text>
      <Text numberOfLines={1} style={styles.moodPath}>
        {from.label} → {to.label}
      </Text>
      <View style={styles.metadata}>
        <View style={styles.metaItem}>
          <Icon name="clock" size={13} color={COLORS.faint} />
          <Text style={styles.metaText}>{durationMinutes} phút</Text>
        </View>
        <View style={styles.metaItem}>
          <Icon name="play" size={11} color={COLORS.faint} />
          <Text style={styles.metaText}>{listenCount} lượt nghe</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text numberOfLines={1} style={styles.activity}>{activityLabel}</Text>
        <Text style={styles.match}>{matchScore}% hợp</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.82,
  },
  cardCover: {
    width: '100%',
    height: 112,
    borderRadius: 12,
    marginBottom: 13,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
    resizeMode: 'cover',
  },
  coverEmoji: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 8,
  },
  title: {
    fontWeight: '800',
    fontSize: 14.5,
    color: COLORS.text,
    marginBottom: 6,
    minHeight: 36,
  },
  creator: {
    fontSize: 12,
    color: COLORS.faint,
    marginBottom: 8,
  },
  moodPath: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 10,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: COLORS.faint,
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  activity: {
    color: COLORS.muted,
    fontSize: 11,
    flex: 1,
  },
  match: {
    color: COLORS.ok,
    fontSize: 11,
    fontWeight: '700',
  },
});
