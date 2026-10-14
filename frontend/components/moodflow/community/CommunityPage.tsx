import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, MOODS, moodById } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import Icon from '@/components/moodflow/shared/Icon';
import ShareJourneyModal from '@/components/moodflow/community/ShareJourneyModal';

interface CommunityComment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface CommunityPost {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar?: string;
  caption: string;
  like_count: number;
  liked_by?: string[];
  comment_count: number;
  comments?: CommunityComment[];
  journey: any;
  created_at: string;
}

interface CommunityPageProps {
  onSelectJourney?: (journey: any) => void;
  userId?: string;
  userName?: string;
}

export default function CommunityPage({
  onSelectJourney,
  userId = 'guest',
  userName = 'Người nghe',
}: CommunityPageProps) {
  const [tab, setTab] = useState<'trending' | 'latest'>('trending');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Trạng thái bình luận & lưu bài
  const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<{ [postId: string]: string }>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<{ [postId: string]: string }>({});

  // 1. Tải danh sách bài viết từ Backend API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const url = `http://localhost:5000/api/community/posts?tab=${tab}&mood=${selectedMood}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setPosts(data.data);
      }
    } catch (err) {
      console.error('Lỗi tải bài viết cộng đồng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [tab, selectedMood]);

  // 2. Thả tim / Bỏ tim bài viết
  const handleToggleLike = async (postId: string) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const liked = p.liked_by?.includes(userId);
          const nextLikedBy = liked
            ? p.liked_by?.filter((id) => id !== userId) || []
            : [...(p.liked_by || []), userId];
          const nextLikeCount = liked
            ? Math.max(0, p.like_count - 1)
            : p.like_count + 1;
          return {
            ...p,
            liked_by: nextLikedBy,
            like_count: nextLikeCount,
          };
        }
        return p;
      })
    );

    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('moodflow_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`http://localhost:5000/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId }),
      });
    } catch (err) {
      console.error('Lỗi like bài viết:', err);
      fetchPosts();
    }
  };

  // 3. Gửi bình luận
  const handleSendComment = async (postId: string) => {
    const text = commentInput[postId]?.trim();
    if (!text) return;

    try {
      setSubmittingComment(postId);
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('moodflow_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: text,
          authorName: userName,
          userId,
        }),
      });

      const data = await res.json();
      if (data.success && data.comment) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                comment_count: p.comment_count + 1,
                comments: [...(p.comments || []), data.comment],
              };
            }
            return p;
          })
        );
        setCommentInput((prev) => ({ ...prev, [postId]: '' }));
      }
    } catch (err) {
      console.error('Lỗi gửi bình luận:', err);
    } finally {
      setSubmittingComment(null);
    }
  };

  // 4. Lưu hành trình vào Thư viện cá nhân
  const handleSaveToMyMusic = async (postId: string) => {
    try {
      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('moodflow_token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/community/posts/${postId}/save`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();
      if (data.success) {
        setSavedFeedback((prev) => ({ ...prev, [postId]: '✨ Đã lưu vào Thư viện của bạn!' }));
        setTimeout(() => {
          setSavedFeedback((prev) => {
            const next = { ...prev };
            delete next[postId];
            return next;
          });
        }, 3000);
      }
    } catch (err) {
      console.error('Lỗi lưu hành trình:', err);
    }
  };

  // 5. Phát hành trình cộng đồng
  const handlePlayCommunityJourney = (post: CommunityPost) => {
    if (onSelectJourney && post.journey) {
      onSelectJourney(post.journey);
    }
  };

  // Định dạng thời gian
  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / (1000 * 60));
      if (mins < 1) return 'Vừa xong';
      if (mins < 60) return `${mins} phút trước`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} giờ trước`;
      const days = Math.floor(hours / 24);
      return `${days} ngày trước`;
    } catch (e) {
      return 'Gần đây';
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header & Share Button */}
      <View style={styles.topHeaderRow}>
        <View style={{ flex: 1 }}>
          <SectionTitle
            title="Cộng đồng MoodFlow"
            subtitle="Khám phá và chia sẻ các lộ trình âm nhạc trị liệu từ cộng đồng."
          />
        </View>

        <Pressable
          onPress={() => setShareModalOpen(true)}
          style={styles.shareBtnWrap}
        >
          <LinearGradient
            colors={['#22D3EE', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shareBtnGradient}
          >
            <Icon name="share" size={15} color="#FFF" />
            <Text style={styles.shareBtnText}>+ Chia sẻ Hành trình</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Tabs & Mood Filters */}
      <View style={styles.filterSection}>
        {/* Main Tabs */}
        <View style={styles.tabRow}>
          <Pressable
            onPress={() => setTab('trending')}
            style={[styles.tabBtn, tab === 'trending' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, tab === 'trending' && styles.tabBtnTextActive]}>
              🔥 Thịnh hành
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setTab('latest')}
            style={[styles.tabBtn, tab === 'latest' && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, tab === 'latest' && styles.tabBtnTextActive]}>
              🆕 Mới nhất
            </Text>
          </Pressable>

          <Pressable onPress={fetchPosts} style={styles.refreshBtn}>
            <Icon name="sparkles" size={13} color="#22D3EE" />
            <Text style={styles.refreshText}>Làm mới</Text>
          </Pressable>
        </View>

        {/* 8 Mood Tags Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodScroll}
        >
          <Pressable
            onPress={() => setSelectedMood('all')}
            style={[
              styles.moodChip,
              selectedMood === 'all' && styles.moodChipActive,
            ]}
          >
            <Text
              style={[
                styles.moodChipText,
                selectedMood === 'all' && styles.moodChipTextActive,
              ]}
            >
              Tất cả tâm trạng
            </Text>
          </Pressable>

          {MOODS.map((m) => {
            const isSelected = selectedMood === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => setSelectedMood(isSelected ? 'all' : m.id)}
                style={[
                  styles.moodChip,
                  isSelected && {
                    borderColor: m.colors[1] || '#22D3EE',
                    backgroundColor: 'rgba(34, 211, 238, 0.1)',
                  },
                ]}
              >
                <Text style={{ fontSize: 13 }}>{m.emoji}</Text>
                <Text
                  style={[
                    styles.moodChipText,
                    isSelected && { color: '#FFF', fontWeight: '700' },
                  ]}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Posts Feed */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#22D3EE" />
          <Text style={styles.loadingText}>Đang tải bảng tin cộng đồng...</Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Icon name="users" size={36} color={COLORS.faint} />
          <Text style={styles.emptyTitle}>Chưa có bài viết nào</Text>
          <Text style={styles.emptySub}>
            Hãy là người đầu tiên chia sẻ hành trình âm nhạc trị liệu của bạn cho mọi người nhé!
          </Text>
          <Pressable
            onPress={() => setShareModalOpen(true)}
            style={styles.emptyShareBtn}
          >
            <Text style={styles.emptyShareText}>+ Chia sẻ ngay</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.feedWrap}>
          {posts.map((post) => {
            const isLiked = post.liked_by?.includes(userId);
            const isCommentsOpen = openCommentPostId === post.id;
            const fromMood = moodById(post.journey?.mood_from);
            const toMood = moodById(post.journey?.mood_to);

            return (
              <View key={post.id} style={styles.postCard}>
                {/* Author Header */}
                <View style={styles.authorRow}>
                  <View style={styles.avatarWrap}>
                    {post.author_avatar ? (
                      <Image source={{ uri: post.author_avatar }} style={styles.avatarImg} />
                    ) : (
                      <LinearGradient colors={['#22D3EE', '#8B5CF6']} style={styles.avatarGradient}>
                        <Text style={styles.avatarInitial}>{post.author_name.charAt(0)}</Text>
                      </LinearGradient>
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.authorName}>{post.author_name}</Text>
                    <Text style={styles.postTime}>{formatTimeAgo(post.created_at)}</Text>
                  </View>
                </View>

                {/* Caption / Story */}
                <Text style={styles.captionText}>{post.caption}</Text>

                {/* Attached Journey Box */}
                {post.journey && (
                  <View style={styles.journeyCard}>
                    <LinearGradient
                      colors={['rgba(34, 211, 238, 0.08)', 'rgba(139, 92, 246, 0.08)']}
                      style={styles.journeyGradient}
                    >
                      <View style={styles.journeyTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.journeyTitle}>{post.journey.title}</Text>
                          <View style={styles.journeyMetaRow}>
                            <View style={styles.pillBadge}>
                              <Icon name="clock" size={11} color="#22D3EE" />
                              <Text style={styles.pillBadgeText}>
                                {post.journey.duration_minutes || 30} phút
                              </Text>
                            </View>
                            <View style={styles.pillBadge}>
                              <Text style={styles.pillBadgeText}>
                                🥁 {post.journey.avg_bpm || 75} BPM
                              </Text>
                            </View>
                            <View style={styles.pillBadgeMuted}>
                              <Text style={styles.pillBadgeMutedText}>
                                4 Giai đoạn ISO
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Play Journey Button */}
                        <Pressable
                          onPress={() => handlePlayCommunityJourney(post)}
                          style={styles.playBtn}
                        >
                          <LinearGradient
                            colors={['#22D3EE', '#8B5CF6']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.playGradient}
                          >
                            <Icon name="play" size={13} color="#FFF" />
                            <Text style={styles.playText}>Nghe ngay</Text>
                          </LinearGradient>
                        </Pressable>
                      </View>

                      {/* 4 Stages Chips */}
                      {post.journey.stages && Array.isArray(post.journey.stages) && (
                        <View style={styles.stagesRow}>
                          {post.journey.stages.map((stg: any, sIdx: number) => (
                            <View key={sIdx} style={styles.stageChip}>
                              <Text style={{ fontSize: 11 }}>{stg.emoji || '🎵'}</Text>
                              <Text style={styles.stageChipTitle} numberOfLines={1}>
                                {stg.title}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </LinearGradient>
                  </View>
                )}

                {/* Feedback message when journey is saved */}
                {savedFeedback[post.id] ? (
                  <View style={styles.savedAlert}>
                    <Text style={styles.savedAlertText}>{savedFeedback[post.id]}</Text>
                  </View>
                ) : null}

                {/* Post Actions Bar */}
                <View style={styles.actionBar}>
                  <Pressable
                    onPress={() => handleToggleLike(post.id)}
                    style={[styles.actionBtn, isLiked && styles.actionBtnLiked]}
                  >
                    <Icon
                      name="heart"
                      size={15}
                      color={isLiked ? '#F472B6' : COLORS.muted}
                    />
                    <Text
                      style={[
                        styles.actionBtnText,
                        isLiked && { color: '#F472B6', fontWeight: '700' },
                      ]}
                    >
                      {post.like_count || 0} Tim
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() =>
                      setOpenCommentPostId(isCommentsOpen ? null : post.id)
                    }
                    style={styles.actionBtn}
                  >
                    <Icon name="chat" size={15} color={COLORS.muted} />
                    <Text style={styles.actionBtnText}>
                      {post.comment_count || 0} Bình luận
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleSaveToMyMusic(post.id)}
                    style={styles.actionBtn}
                  >
                    <Icon name="bookmark" size={15} color={COLORS.muted} />
                    <Text style={styles.actionBtnText}>Lưu về Thư viện</Text>
                  </Pressable>
                </View>

                {/* Comments Section */}
                {isCommentsOpen && (
                  <View style={styles.commentSection}>
                    {/* Comments List */}
                    {post.comments && post.comments.length > 0 ? (
                      <View style={styles.commentList}>
                        {post.comments.map((c) => (
                          <View key={c.id} style={styles.commentItem}>
                            <View style={styles.commentAuthorRow}>
                              <Text style={styles.commentAuthor}>{c.author_name}</Text>
                              <Text style={styles.commentTime}>{formatTimeAgo(c.created_at)}</Text>
                            </View>
                            <Text style={styles.commentContent}>{c.content}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.noCommentsText}>Chưa có bình luận nào. Hãy là người đầu tiên!</Text>
                    )}

                    {/* New Comment Input */}
                    <View style={styles.commentInputRow}>
                      <TextInput
                        style={styles.commentTextInput}
                        placeholder="Viết bình luận của bạn..."
                        placeholderTextColor={COLORS.faint}
                        value={commentInput[post.id] || ''}
                        onChangeText={(txt) =>
                          setCommentInput((prev) => ({ ...prev, [post.id]: txt }))
                        }
                      />
                      <Pressable
                        onPress={() => handleSendComment(post.id)}
                        disabled={submittingComment === post.id}
                        style={styles.sendCommentBtn}
                      >
                        {submittingComment === post.id ? (
                          <ActivityIndicator size="small" color="#22D3EE" />
                        ) : (
                          <Text style={styles.sendCommentText}>Gửi</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Share Journey Modal */}
      <ShareJourneyModal
        visible={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        onPostSuccess={() => {
          fetchPosts();
        }}
        userId={userId}
        userName={userName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 80,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  shareBtnWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  shareBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  shareBtnText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  filterSection: {
    marginBottom: 24,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  tabBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtnActive: {
    borderColor: '#22D3EE',
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
  },
  tabBtnText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#22D3EE',
    fontWeight: '700',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
  },
  refreshText: {
    fontSize: 12,
    color: '#22D3EE',
    fontWeight: '600',
  },
  moodScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  moodChipActive: {
    borderColor: '#22D3EE',
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
  },
  moodChipText: {
    fontSize: 12.5,
    color: COLORS.muted,
    fontWeight: '600',
  },
  moodChipTextActive: {
    color: '#22D3EE',
    fontWeight: '700',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  emptyBox: {
    padding: 40,
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
    maxWidth: 420,
    marginTop: 6,
    lineHeight: 18,
  },
  emptyShareBtn: {
    marginTop: 16,
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.4)',
  },
  emptyShareText: {
    color: '#22D3EE',
    fontSize: 13,
    fontWeight: '700',
  },
  feedWrap: {
    gap: 18,
  },
  postCard: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 18,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  authorName: {
    color: COLORS.text,
    fontSize: 14.5,
    fontWeight: '700',
  },
  postTime: {
    color: COLORS.faint,
    fontSize: 12,
    marginTop: 2,
  },
  captionText: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  journeyCard: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  journeyGradient: {
    padding: 14,
  },
  journeyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  journeyTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  journeyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  pillBadgeText: {
    color: '#22D3EE',
    fontSize: 11,
    fontWeight: '700',
  },
  pillBadgeMuted: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  pillBadgeMutedText: {
    color: COLORS.faint,
    fontSize: 11,
  },
  playBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  playGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  playText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  stagesRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
  },
  stageChipTitle: {
    color: COLORS.muted,
    fontSize: 11,
    maxWidth: 100,
  },
  savedAlert: {
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  savedAlertText: {
    color: '#22D3EE',
    fontSize: 12.5,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 12,
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  actionBtnLiked: {
    backgroundColor: 'rgba(244, 114, 182, 0.1)',
  },
  actionBtnText: {
    color: COLORS.muted,
    fontSize: 12.5,
    fontWeight: '600',
  },
  commentSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  commentList: {
    gap: 10,
    marginBottom: 12,
  },
  commentItem: {
    backgroundColor: COLORS.surface,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  commentAuthorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentAuthor: {
    color: '#22D3EE',
    fontSize: 12,
    fontWeight: '700',
  },
  commentTime: {
    color: COLORS.faint,
    fontSize: 10.5,
  },
  commentContent: {
    color: COLORS.text,
    fontSize: 12.5,
    lineHeight: 17,
  },
  noCommentsText: {
    color: COLORS.faint,
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    color: COLORS.text,
    fontSize: 12.5,
  },
  sendCommentBtn: {
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.4)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  sendCommentText: {
    color: '#22D3EE',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
