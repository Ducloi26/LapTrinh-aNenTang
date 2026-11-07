import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, MOODS, Track } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import GhostButton from '@/components/moodflow/shared/GhostButton';
import MusicCard from '@/components/moodflow/journey/MusicCard';
import Icon from '@/components/moodflow/shared/Icon';
import JourneyPrivacyControl from '@/components/moodflow/journey/JourneyPrivacyControl';
import { SavedJourney, deleteJourney, getSavedJourneys, restoreJourney } from '@/services/journey-service';
import {
  clearListeningHistory,
  getFavoriteTracks,
  getListeningHistory,
  getListeningSummary,
  ListeningHistoryItem,
  ListeningSummary,
  renameSavedJourney,
} from '@/services/music-library-service';

const TABS = [
  { id: 'journeys', label: '🎼 Journey của tôi' },
  { id: 'liked', label: '❤️ Bài hát đã thích' },
  { id: 'history', label: '🕒 Lịch sử nghe' },
];

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
  const [history, setHistory] = useState<ListeningHistoryItem[]>([]);
  const [summary, setSummary] = useState<ListeningSummary>({
    totalListeningSeconds: 0, topGenre: null, topArtist: null, topMood: null,
  });
  const [loading, setLoading] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJourneys = async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      setJourneys(await getSavedJourneys(signal));
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : 'Không tải được thư viện.');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  const fetchLikedTracks = async (signal?: AbortSignal) => {
    setLoadingFavorites(true);
    try {
      setLikedTracks(await getFavoriteTracks(signal));
    } catch (err) {
      if (!signal?.aborted) setError(err instanceof Error ? err.message : 'Không tải được bài hát yêu thích.');
    } finally {
      if (!signal?.aborted) setLoadingFavorites(false);
    }
  };

  const fetchHistory = async (signal?: AbortSignal) => {
    setLoadingHistory(true);
    try {
      setHistory(await getListeningHistory(signal));
    } catch (failure) {
      if (!signal?.aborted) setError(failure instanceof Error ? failure.message : 'Không tải được lịch sử nghe.');
    } finally {
      if (!signal?.aborted) setLoadingHistory(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    void fetchJourneys(controller.signal);
    void fetchLikedTracks(controller.signal);
    void getListeningSummary(controller.signal).then(setSummary).catch((failure) => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Không tải được thống kê nghe nhạc.');
    });
    void fetchHistory(controller.signal);
    return () => controller.abort();
  }, []);

  // Xóa hành trình khỏi CSDL
  const handleDeleteJourney = async (id: string) => {
    try {
      setDeletingId(id);
      setError(null);
      await deleteJourney(id);
      setJourneys((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xóa được hành trình.');
    } finally {
      setDeletingId(null);
    }
  };

  // Xử lý phát toàn bộ hành trình đã lưu
  const handlePlayJourney = (savedJourney: SavedJourney) => {
    try {
      onSelectJourney?.(restoreJourney(savedJourney));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không mở được hành trình.');
    }
  };

  const handleRenameJourney = async (journey: SavedJourney) => {
    const title = titleDraft.trim();
    if (!title || title.length > 200 || savingTitle) return;
    setSavingTitle(true);
    setError(null);
    try {
      const savedTitle = await renameSavedJourney(journey.id, title);
      setJourneys((current) => current.map((item) =>
        item.id === journey.id ? { ...item, title: savedTitle } : item,
      ));
      setRenamingId(null);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không đổi được tên hành trình.');
    } finally {
      setSavingTitle(false);
    }
  };

  const handleClearHistory = async () => {
    if (clearingHistory) return;
    setClearingHistory(true);
    setError(null);
    try {
      await clearListeningHistory();
      setHistory([]);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Không xóa được lịch sử nghe.');
    } finally {
      setClearingHistory(false);
    }
  };

  const historyGroups = groupHistory(history);
  const moodLabel = (id: string | null) =>
    MOODS.find((mood) => mood.id === id)?.label ?? id ?? 'Chưa có dữ liệu';
  const listeningHours = summary.totalListeningSeconds / 3600;
  const stats = [
    { label: 'Tổng giờ nghe', value: `${listeningHours.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} giờ` },
    { label: 'Thể loại yêu thích', value: summary.topGenre || 'Chưa có dữ liệu' },
    { label: 'Nghệ sĩ yêu thích', value: summary.topArtist || 'Chưa có dữ liệu' },
    { label: 'Mood yêu thích nhất', value: moodLabel(summary.topMood) },
  ];

  return (
    <View style={styles.container}>
      <SectionTitle title="Thư viện & Nhạc của tôi" />
      {error ? <Text style={{ color: COLORS.danger }}>{error}</Text> : null}

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
            <Pressable onPress={() => void fetchJourneys()} style={styles.refreshBtn}>
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
                Bạn có thể tạo một Music Journey ở Trang chủ, sau đó bấm nút “Lưu hành trình” để lưu lại vào CSDL và nghe lại bất cứ lúc nào.
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
                      {renamingId === j.id ? (
                        <View style={styles.renameRow}>
                          <TextInput
                            accessibilityLabel="Tên hành trình mới"
                            value={titleDraft}
                            onChangeText={setTitleDraft}
                            maxLength={200}
                            editable={!savingTitle}
                            style={styles.renameInput}
                            placeholder="Tên hành trình"
                            placeholderTextColor={COLORS.faint}
                          />
                          <Pressable
                            accessibilityRole="button"
                            disabled={savingTitle || !titleDraft.trim()}
                            onPress={() => void handleRenameJourney(j)}
                          >
                            <Text style={styles.renameAction}>{savingTitle ? 'Đang lưu...' : 'Lưu'}</Text>
                          </Pressable>
                          <Pressable disabled={savingTitle} onPress={() => setRenamingId(null)}>
                            <Text style={styles.cancelRename}>Hủy</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View style={styles.journeyTitleRow}>
                          <Text style={[styles.journeyTitle, { flex: 1 }]}>{j.title}</Text>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Đổi tên ${j.title}`}
                            onPress={() => { setRenamingId(j.id); setTitleDraft(j.title); }}
                            style={styles.renameButton}
                          >
                            <Icon name="edit" size={13} color={COLORS.ok} />
                          </Pressable>
                        </View>
                      )}
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

                  <JourneyPrivacyControl id={j.id} privacy={j}
                    onChanged={(value) => setJourneys((current) => current.map((item) => item.id === j.id ? { ...item, ...value } : item))} />

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
              Bài hát yêu thích ({likedTracks.length})
            </Text>
            <Pressable onPress={() => void fetchLikedTracks()} style={styles.refreshBtn}>
              <Icon name="sparkles" size={13} color="#22D3EE" />
              <Text style={styles.refreshText}>Làm mới</Text>
            </Pressable>
          </View>
          {loadingFavorites ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#22D3EE" />
              <Text style={styles.loadingText}>Đang tải bài hát yêu thích...</Text>
            </View>
          ) : likedTracks.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="heart" size={30} color={COLORS.faint} />
              <Text style={styles.emptyTitle}>Chưa có bài hát yêu thích</Text>
              <Text style={styles.emptySub}>Nhấn biểu tượng trái tim trên bài hát để thêm vào đây.</Text>
            </View>
          ) : (
            <View style={styles.trackList}>
              {likedTracks.map((track) => (
                <MusicCard
                  key={track.id}
                  track={track}
                  initialLiked
                  onPlay={() => onPlayTrack?.(track)}
                  onToggleLike={(_track, liked) => {
                    if (!liked) setLikedTracks((current) => current.filter((item) => item.id !== track.id));
                  }}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {tab === 'history' && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Lịch sử nghe ({history.length}/50)</Text>
            <Pressable
              accessibilityRole="button"
              disabled={clearingHistory || history.length === 0}
              onPress={() => void handleClearHistory()}
              style={[styles.clearHistoryButton, (clearingHistory || history.length === 0) && styles.disabledButton]}
            >
              <Icon name="trash" size={13} color={COLORS.danger} />
              <Text style={styles.clearHistoryText}>{clearingHistory ? 'Đang xóa...' : 'Xóa lịch sử'}</Text>
            </Pressable>
          </View>
          {loadingHistory ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="small" color="#22D3EE" />
              <Text style={styles.loadingText}>Đang tải lịch sử nghe...</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="clock" size={30} color={COLORS.faint} />
              <Text style={styles.emptyTitle}>Lịch sử nghe đang trống</Text>
            </View>
          ) : (
            <View style={styles.historyGroups}>
              {historyGroups.map((group) => (
                <View key={group.label}>
                  <Text style={styles.historyGroupTitle}>{group.label}</Text>
                  <View style={styles.trackList}>
                    {group.items.map((item) => (
                      <View key={item.historyId}>
                        <MusicCard track={item} onPlay={() => onPlayTrack?.(item)} />
                        <Text style={styles.historyTime}>
                          {new Date(item.playedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function groupHistory(items: ListeningHistoryItem[]): { label: string; items: ListeningHistoryItem[] }[] {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const groups = new Map<string, ListeningHistoryItem[]>();
  for (const item of items) {
    const playedAt = new Date(item.playedAt).getTime();
    const day = new Date(playedAt);
    const daysAgo = Math.floor((startOfToday - new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime()) / 86400000);
    const label = daysAgo <= 0 ? 'Hôm nay' : daysAgo === 1 ? 'Hôm qua' : daysAgo < 7 ? 'Tuần này' : 'Trước đó';
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }
  const order = ['Hôm nay', 'Hôm qua', 'Tuần này', 'Trước đó'];
  return order.flatMap((label) => {
    const entries = groups.get(label);
    return entries?.length ? [{ label, items: entries }] : [];
  });
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
  journeyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  renameButton: {
    padding: 6,
  },
  renameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  renameInput: {
    flex: 1,
    minWidth: 120,
    color: COLORS.text,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  renameAction: {
    color: COLORS.ok,
    fontSize: 12,
    fontWeight: '700',
  },
  cancelRename: {
    color: COLORS.muted,
    fontSize: 12,
  },
  clearHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  clearHistoryText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.5,
  },
  historyGroups: {
    gap: 18,
  },
  historyGroupTitle: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  historyTime: {
    color: COLORS.faint,
    fontSize: 11,
    textAlign: 'right',
    marginTop: -4,
    marginBottom: 8,
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
