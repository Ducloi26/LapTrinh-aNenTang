import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, Mood, Track, moodById } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';
import MusicCard from '@/components/moodflow/journey/MusicCard';
import { Journey, Stage, fmtMin } from '@/services/journey-generator';

interface JourneyPageProps {
  journey: Journey | null;
  state: {
    moodFrom: string;
    moodTo: string;
  };
  onPlayTrack: (track: Track, stage: Stage, stageIndex: number) => void;
}

export default function JourneyPage({
  journey,
  state,
  onPlayTrack,
}: JourneyPageProps) {
  const from = moodById(state.moodFrom);
  const to = moodById(state.moodTo);

  if (!journey) {
    return (
      <View style={styles.emptyWrap}>
        <Icon name="sparkles" size={32} color={COLORS.faint} />
        <Text style={styles.emptyTitle}>Chưa có hành trình nào</Text>
        <Text style={styles.emptySub}>
          Quay lại Trang chủ, chọn tâm trạng và nhấn "Tạo Music Journey của tôi"
          để bắt đầu.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>HÀNH TRÌNH ÂM NHẠC CỦA BẠN</Text>
        <Text style={styles.title}>
          {from.emoji} {from.label}{' '}
          <Text style={{ color: COLORS.faint, fontWeight: '300' }}>→</Text>{' '}
          {to.emoji} {to.label}
        </Text>
        <View style={styles.metaRow}>
          <Icon name="clock" size={14} color={COLORS.muted} />
          <Text style={styles.metaText}>{fmtMin(journey.totalMin)}</Text>
        </View>
      </View>

      {/* Timeline stages */}
      <View style={styles.timelineWrap}>
        <LinearGradient
          colors={[from.colors[0], to.colors[to.colors.length - 1]]}
          style={styles.verticalLine}
        />

        {journey.stages.map((stage, i) => (
          <View key={stage.key} style={styles.stageBlock}>
            {/* Stage Icon Node */}
            <View
              style={[
                styles.nodeIcon,
                { borderColor: to.colors[0] },
              ]}
            >
              <Text style={{ fontSize: 10 }}>{stage.emoji}</Text>
            </View>

            {/* Stage title */}
            <Text style={styles.stageRange}>{stage.range}</Text>
            <Text style={styles.stageTitle}>
              {stage.emoji} {stage.title}
            </Text>

            {/* Tracks */}
            <View style={styles.trackList}>
              {stage.tracks.map((t, ti) => (
                <MusicCard
                  key={ti}
                  track={t}
                  onPlay={() => onPlayTrack(t, stage, i)}
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 60,
  },
  emptyWrap: {
    maxWidth: 480,
    alignSelf: 'center',
    alignItems: 'center',
    marginTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '400',
  },
  emptySub: {
    color: COLORS.muted,
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    marginBottom: 30,
  },
  eyebrow: {
    color: COLORS.faint,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '400',
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  metaText: {
    color: COLORS.muted,
    fontSize: 14,
  },
  timelineWrap: {
    position: 'relative',
    paddingLeft: 26,
  },
  verticalLine: {
    position: 'absolute',
    left: 9,
    top: 8,
    bottom: 8,
    width: 2,
    borderRadius: 2,
  },
  stageBlock: {
    position: 'relative',
    marginBottom: 34,
  },
  nodeIcon: {
    position: 'absolute',
    left: -26,
    top: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageRange: {
    fontSize: 12.5,
    color: COLORS.faint,
    fontWeight: '600',
    marginBottom: 3,
  },
  stageTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
  },
  trackList: {
    gap: 4,
  },
});
