import React from 'react';
import { View, StyleSheet } from 'react-native';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import CommunityCard, {
  CommunityJourneyItem,
} from '@/components/moodflow/community/CommunityCard';

const COMMUNITY_JOURNEYS: CommunityJourneyItem[] = [
  {
    emoji: '🎧',
    title: '2 Hour Coding Flow',
    creator: 'Alex',
    from: 'anxious',
    to: 'focus',
    duration: '2 giờ',
    saves: '1.2K',
  },
  {
    emoji: '🌙',
    title: 'Late Night Healing',
    creator: 'Minh',
    from: 'sad',
    to: 'calm',
    duration: '45 phút',
    saves: '845',
  },
  {
    emoji: '🔥',
    title: 'Morning Energy',
    creator: 'Quyên',
    from: 'sad',
    to: 'energetic',
    duration: '30 phút',
    saves: '2.4K',
  },
];

export default function CommunityPage() {
  return (
    <View style={styles.container}>
      <SectionTitle
        title="Cộng đồng"
        subtitle="Khám phá Music Journey do cộng đồng MoodFlow tạo ra."
      />

      <View style={styles.grid}>
        {COMMUNITY_JOURNEYS.map((j) => (
          <CommunityCard key={j.title} item={j} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 980,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 60,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
});
