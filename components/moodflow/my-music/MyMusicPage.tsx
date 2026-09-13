import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TRACK_POOL, Track } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import GhostButton from '@/components/moodflow/shared/GhostButton';
import MusicCard from '@/components/moodflow/journey/MusicCard';

const TABS = [
  { id: 'liked', label: 'Bài hát đã thích' },
  { id: 'saved', label: 'Bài hát đã lưu' },
  { id: 'playlists', label: 'Playlist của tôi' },
  { id: 'journeys', label: 'Journey của tôi' },
  { id: 'history', label: 'Lịch sử nghe' },
];

const STATS = [
  { label: 'Tổng thời gian nghe', value: '128 giờ' },
  { label: 'Thể loại yêu thích', value: 'R&B' },
  { label: 'Nghệ sĩ nghe nhiều nhất', value: 'Halden' },
  { label: 'Mood thường nghe nhất', value: '🧠 Tập trung' },
];

interface MyMusicPageProps {
  onPlayTrack?: (t: Track) => void;
}

export default function MyMusicPage({ onPlayTrack }: MyMusicPageProps) {
  const [tab, setTab] = useState('liked');

  const sampleTracks: Track[] = [
    TRACK_POOL.focus[0],
    TRACK_POOL.calmdown[1],
    TRACK_POOL.deepfocus[2],
    TRACK_POOL.cooldown[0],
  ].map((t) => ({
    ...t,
    mood: 'Tập trung',
    reason: 'Nằm trong Music DNA của bạn.',
  }));

  return (
    <View style={styles.container}>
      <SectionTitle title="Nhạc của tôi" />

      {/* Stats row */}
      <View style={styles.statsRow}>
        {STATS.map((s) => (
          <View key={s.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{s.label}</Text>
            <Text style={styles.statVal}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <GhostButton
            key={t.id}
            active={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </GhostButton>
        ))}
      </View>

      {/* Track list */}
      <View style={styles.trackList}>
        {sampleTracks.map((t, i) => (
          <MusicCard
            key={i}
            track={t}
            onPlay={() => onPlayTrack && onPlayTrack(t)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 60,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
  },
  statLabel: {
    fontSize: 11.5,
    color: COLORS.faint,
    marginBottom: 6,
  },
  statVal: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  trackList: {
    gap: 8,
  },
});
