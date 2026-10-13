import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, Track, moodById } from '@/constants/moodflow';
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
  const [saved, setSaved] = useState(false);
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

  const handlePlayAll = () => {
    // Phát bài đầu tiên của giai đoạn đầu tiên
    const firstStage = journey.stages[0];
    if (firstStage && firstStage.tracks.length > 0) {
      onPlayTrack(firstStage.tracks[0], firstStage, 0);
    }
  };

  const handleToggleSave = () => {
    setSaved(!saved);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>HÀNH TRÌNH 4 GIAI ĐOẠN KHOA HỌC</Text>
        </View>

        <Text style={styles.title}>
          {from.emoji} {from.label}{' '}
          <Text style={{ color: COLORS.faint, fontWeight: '300' }}>→</Text>{' '}
          {to.emoji} {to.label}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="clock" size={14} color={COLORS.muted} />
            <Text style={styles.metaText}>{fmtMin(journey.totalMin)}</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>4 giai đoạn chuyển hóa</Text>
          </View>
          {journey.activityLabel ? (
            <>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Text style={styles.metaText}>Mục tiêu: {journey.activityLabel}</Text>
              </View>
            </>
          ) : null}
        </View>

        {/* Action Controls */}
        <View style={styles.controlsRow}>
          <Pressable onPress={handlePlayAll} style={styles.playAllBtn}>
            <LinearGradient
              colors={[to.colors[0] || '#22D3EE', to.colors[1] || '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.playAllGradient}
            >
              <Icon name="play" size={14} color="#FFF" />
              <Text style={styles.playAllText}>Phát toàn bộ hành trình</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={handleToggleSave}
            style={[styles.saveBtn, saved && styles.saveBtnActive]}
          >
            <Icon
              name="bookmark"
              size={14}
              color={saved ? '#22D3EE' : COLORS.text}
            />
            <Text style={[styles.saveBtnText, saved && { color: '#22D3EE' }]}>
              {saved ? 'Đã lưu vào Thư viện' : 'Lưu hành trình'}
            </Text>
          </Pressable>
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

            {/* Stage title & subtitle */}
            <Text style={styles.stageRange}>{stage.range}</Text>
            <Text style={styles.stageTitle}>
              {stage.emoji} {stage.title}
            </Text>
            {stage.subtitle ? (
              <Text style={styles.stageSubtitle}>{stage.subtitle}</Text>
            ) : null}

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
  headerBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderColor: 'rgba(34, 211, 238, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  headerBadgeText: {
    color: '#22D3EE',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: COLORS.text,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.faint,
  },
  metaText: {
    color: COLORS.muted,
    fontSize: 13.5,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    flexWrap: 'wrap',
  },
  playAllBtn: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  playAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  playAllText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  saveBtnActive: {
    borderColor: 'rgba(34, 211, 238, 0.4)',
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
  },
  saveBtnText: {
    color: COLORS.text,
    fontSize: 13.5,
    fontWeight: '600',
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
  },
  stageSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 10,
    marginTop: 2,
  },
  trackList: {
    gap: 4,
    marginTop: 6,
  },
});
