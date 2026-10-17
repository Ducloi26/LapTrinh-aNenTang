import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, moodById } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';

export interface CommunityJourneyItem {
  emoji: string;
  title: string;
  creator: string;
  from: string;
  to: string;
  duration: string;
  saves: string;
}

interface CommunityCardProps {
  item: CommunityJourneyItem;
}

export default function CommunityCard({ item }: CommunityCardProps) {
  const from = moodById(item.from);
  const to = moodById(item.to);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[from.colors[0], to.colors[to.colors.length - 1]]}
        style={styles.cardHeaderGradient}
      >
        <Text style={styles.headerEmoji}>{item.emoji}</Text>
      </LinearGradient>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.creator}>Người tạo: {item.creator}</Text>

      <View style={styles.moodPathRow}>
        <Text style={styles.moodPathText}>
          {from.emoji} {from.label} → {to.emoji} {to.label}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{item.duration}</Text>
        <Text style={styles.metaText}>{item.saves} lượt lưu</Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.startBtnWrap}>
          <LinearGradient colors={to.colors} style={styles.startGradient}>
            <Text style={styles.startBtnText}>Bắt đầu Journey</Text>
          </LinearGradient>
        </Pressable>
        <Pressable style={styles.iconBtn}>
          <Icon name="bookmark" size={15} color={COLORS.muted} />
        </Pressable>
        <Pressable style={styles.iconBtn}>
          <Icon name="heart" size={15} color={COLORS.muted} />
        </Pressable>
        <Pressable style={styles.iconBtn}>
          <Icon name="share" size={15} color={COLORS.muted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 280,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
  },
  cardHeaderGradient: {
    width: '100%',
    height: 100,
    borderRadius: 14,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerEmoji: {
    fontSize: 30,
  },
  title: {
    fontWeight: '800',
    fontSize: 16,
    color: COLORS.text,
  },
  creator: {
    fontSize: 12.5,
    color: COLORS.faint,
    marginTop: 3,
  },
  moodPathRow: {
    marginTop: 10,
  },
  moodPathText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  metaText: {
    fontSize: 12.5,
    color: COLORS.faint,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  startBtnWrap: {
    flex: 1,
    borderRadius: 11,
    overflow: 'hidden',
  },
  startGradient: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#0A0D16',
    fontWeight: '800',
    fontSize: 12.5,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
