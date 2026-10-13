import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TRACK_POOL, Track, moodById } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import GhostButton from '@/components/moodflow/shared/GhostButton';
import MusicCard from '@/components/moodflow/journey/MusicCard';
import Icon from '@/components/moodflow/shared/Icon';

const TABS = [
  { id: 'journeys', label: '🎼 Journey của tôi' },
  { id: 'liked', label: '❤️ Bài hát đã thích' },
  { id: 'saved', label: '🔖 Bài hát đã lưu' },
  { id: 'playlists', label: '📂 Playlist' },
  { id: 'history', label: '🕒 Lịch sử nghe' },
];

interface SavedJourney {
  id: string;
  title: string;
  duration_minutes: number;
  mood_from?: string;
  mood_to?: string;
  activity?: string;
  stages?: Array<{
    key: string;
    title: string;
    emoji: string;
    range: string;
    tracks: Track[];
  }>;
  created_at?: string;
}

interface MyMusicPageProps {
  onPlayTrack?: (t: Track) => void;
  onSelectJourney?: (j: any) => void;
  onGoToHome?: () => void;
}

export default function MyMusicPage({
  onPlayTrack,
  onSelectJourney,
  onGoToHome,
}: MyMusicPageProps) {
  const [tab, setTab] = useState('journeys');
  const [journeys, setJourneys] = useState<SavedJourney[]>([]);
  const [likedTracks, setLikedTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 1. Tải danh sách Journey đã lưu từ CSDL Backend
  const fetchJourneys = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/journeys/my');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setJourneys(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách hành trình:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Tải danh sách bài hát đã thích từ CSDL Backend
  const fetchLikedTracks = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/tracks/liked');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setLikedTracks(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải bài hát đã thích:', err);
    }
  };

  useEffect(() => {
    fetchJourneys();
    fetchLikedTracks();
  }, []);

  // Xóa hành trình khỏi CSDL
  const handleDeleteJourney = async (id: string) => {
    try {
      setDeletingId(id);
      await fetch(`http://localhost:5000/api/journeys/${id}`, {
        method: 'DELETE',
      });
      setJourneys((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      console.error('Lỗi xóa hành trình:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Xử lý phát toàn bộ hành trình đã lưu
  const handlePlayJourney = (savedJ: SavedJourney) => {
    if (onSelectJourney) {
      // Chuẩn hóa định dạng Journey để index.tsx có thể nhận dạng
      const formattedJourney = {
        totalMin: savedJ.duration_minutes || 30,
        activityLabel: savedJ.activity || 'Trị liệu tâm lý',
        stages: savedJ.stages || [
          {
            key: 'acknowledge',
            title: 'Khởi đầu & Thấu cảm',
            emoji: '🌱',
            range: '0 - 6 phút',
            tracks: [TRACK_POOL.acknowledge?.[0]],
          },
          {
            key: 'transition',
            title: 'Chuyển tiếp',
            emoji: '🌊',
            range: '6 - 15 phút',
            tracks: [TRACK_POOL.transition?.[0]],
          },
          {
            key: 'elevate',
            title: 'Nâng đỡ',
            emoji: '✨',
            range: '15 - 24 phút',
            tracks: [TRACK_POOL.elevate?.[0]],
          },
          {
            key: 'transcendence',
            title: 'Thăng hoa & An định',
            emoji: '🌌',
            range: '24 - 30 phút',
            tracks: [TRACK_POOL.transcendence?.[0]],
          },
        ],
      };
      onSelectJourney(formattedJourney);
    }
  };

  // Mẫu bài hát dự phòng nếu chưa có bài like
  const fallbackLikedTracks: Track[] = [
    TRACK_POOL.acknowledge?.[0],
    TRACK_POOL.transition?.[0],
    TRACK_POOL.elevate?.[0],
    TRACK_POOL.transcendence?.[0],
  ].filter(Boolean) as Track[];

  const activeLikedList = likedTracks.length > 0 ? likedTracks : fallbackLikedTracks;

  // Thống kê động
  const stats = [
    { label: 'Hành trình đã lưu', value: `${journeys.length} hành trình` },
    { label: 'Bài hát đã thích', value: `${likedTracks.length || fallbackLikedTracks.length} bài` },
    { label: 'Cơ chế trị liệu', value: '4 Giai đoạn ISO' },
    { label: 'Nhịp tim mục tiêu', value: '60 - 85 BPM' },
  ];

  return (
    <View style={styles.container}>
      <SectionTitle title="Thư viện & Nhạc của tôi" />

      {/* Stats row */}
      <View style={styles.statsRow}>
        {stats.map((s) => (
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

      {/* TAB 1: JOURNEYS ĐÃ LƯU */}
      {tab === 'journeys' && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>
              Hành trình 4 giai đoạn trong CSDL ({journeys.length})
            </Text>
            <Pressable onPress={fetchJourneys} style={styles.refreshBtn}>
              <Icon name="sparkles" size={13} color="#22D3EE" />
              <Text style={styles.refreshText}>Làm mới</Text>
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#22D3EE" />
              <Text style={styles.loadingText}>Đang đồng bộ từ CSDL máy chủ...</Text>
            </View>
          ) : journeys.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="bookmark" size={32} color={COLORS.faint} />
              <Text style={styles.emptyTitle}>Chưa có Hành trình nào được lưu</Text>
              <Text style={styles.emptySub}>
                Bạn có thể tạo một Music Journey ở Trang chủ, sau đó bấm nút "Lưu hành trình" để lưu lại vào CSDL và nghe lại bất cứ lúc nào.
              </Text>
              {onGoToHome ? (
                <Pressable onPress={onGoToHome} style={styles.createBtn}>
                  <Text style={styles.createBtnText}>+ Tạo hành trình ngay</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.journeyList}>
              {journeys.map((j) => (
                <View key={j.id} style={styles.journeyCard}>
                  <View style={styles.journeyHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.journeyTitle}>{j.title}</Text>
                      <View style={styles.metaRow}>
                        <View style={styles.badgePill}>
                          <Icon name="clock" size={12} color="#22D3EE" />
                          <Text style={styles.badgePillText}>{j.duration_minutes || 30} phút</Text>
                        </View>
                        <View style={styles.badgePillMuted}>
                          <Text style={styles.badgePillMutedText}>4 Giai đoạn khoa học</Text>
                        </View>
                      </View>
                    </View>

                    {/* Hành động */}
                    <View style={styles.journeyActions}>
                      <Pressable
                        onPress={() => handlePlayJourney(j)}
                        style={styles.playJourneyBtn}
                      >
                        <LinearGradient
                          colors={['#22D3EE', '#8B5CF6']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.playJourneyGradient}
                        >
                          <Icon name="play" size={13} color="#FFF" />
                          <Text style={styles.playJourneyText}>Phát hành trình</Text>
                        </LinearGradient>
                      </Pressable>

                      <Pressable
                        onPress={() => handleDeleteJourney(j.id)}
                        disabled={deletingId === j.id}
                        style={styles.deleteBtn}
                      >
                        <Icon
                          name="trash"
                          size={14}
                          color={deletingId === j.id ? COLORS.faint : '#EF4444'}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* 4 Giai đoạn tóm tắt */}
                  {j.stages && Array.isArray(j.stages) && (
                    <View style={styles.stagesBar}>
                      {j.stages.map((stg, sIdx) => (
                        <View key={sIdx} style={styles.stageChip}>
                          <Text style={styles.stageChipEmoji}>{stg.emoji || '🎵'}</Text>
                          <Text style={styles.stageChipTitle} numberOfLines={1}>
                            {stg.title}
                          </Text>
                          <Text style={styles.stageChipCount}>
                            ({stg.tracks?.length || 1} bài)
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* TAB 2: BÀI HÁT ĐÃ THÍCH */}
      {tab === 'liked' && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>
              Bài hát yêu thích ({activeLikedList.length})
            </Text>
            {likedTracks.length === 0 && (
              <Text style={styles.hintText}>
                (Đang hiển thị bài hát mẫu đề xuất • Thả tim ❤️ bài hát để lưu vào đây)
              </Text>
            )}
          </View>

          <View style={styles.trackList}>
            {activeLikedList.map((t, i) => (
              <MusicCard
                key={t.id || i}
                track={t}
                initialLiked={true}
                onPlay={() => onPlayTrack && onPlayTrack(t)}
                onToggleLike={() => fetchLikedTracks()}
              />
            ))}
          </View>
        </View>
      )}

      {/* TAB 3: BÀI HÁT ĐÃ LƯU / PLAYLIST / LỊCH SỬ */}
      {(tab === 'saved' || tab === 'playlists' || tab === 'history') && (
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeading}>Danh mục {tab}</Text>
          <View style={styles.trackList}>
            {fallbackLikedTracks.map((t, i) => (
              <MusicCard
                key={i}
                track={t}
                onPlay={() => onPlayTrack && onPlayTrack(t)}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 70,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 26,
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
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '700',
  },
  tabRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  sectionWrap: {
    marginTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.faint,
    fontStyle: 'italic',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
  },
  refreshText: {
    fontSize: 12,
    color: '#22D3EE',
    fontWeight: '600',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  emptyBox: {
    padding: 36,
    borderRadius: 16,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 440,
    marginTop: 6,
    lineHeight: 19,
  },
  createBtn: {
    marginTop: 16,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.4)',
  },
  createBtnText: {
    color: '#22D3EE',
    fontSize: 13,
    fontWeight: '700',
  },
  journeyList: {
    gap: 14,
  },
  journeyCard: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
  },
  journeyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  journeyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#22D3EE',
    fontSize: 11.5,
    fontWeight: '700',
  },
  badgePillMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgePillMutedText: {
    color: COLORS.faint,
    fontSize: 11.5,
  },
  journeyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playJourneyBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  playJourneyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  playJourneyText: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stagesBar: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  stageChipEmoji: {
    fontSize: 12,
  },
  stageChipTitle: {
    fontSize: 11.5,
    color: COLORS.text,
    fontWeight: '600',
    maxWidth: 120,
  },
  stageChipCount: {
    fontSize: 10.5,
    color: COLORS.faint,
  },
  trackList: {
    gap: 8,
  },
});
