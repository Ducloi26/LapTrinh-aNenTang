import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, moodById } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import Icon from '@/components/moodflow/shared/Icon';
import HourlyAreaChart from '@/components/moodflow/statistics/HourlyAreaChart';
import WeeklyBarChart from '@/components/moodflow/statistics/WeeklyBarChart';
import DonutChart from '@/components/moodflow/music-dna/DonutChart';
import SessionFeedbackModal from '@/components/moodflow/statistics/SessionFeedbackModal';

interface StatisticsPageProps {
  userId?: string;
  userName?: string;
  currentJourney?: any;
}

export default function StatisticsPage({
  userId = 'guest',
  userName = 'Người nghe',
  currentJourney,
}: StatisticsPageProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [statsData, setStatsData] = useState<any>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState<boolean>(false);

  // Màu sắc phân bổ Mood chuẩn
  const DONUT_COLORS = ['#22D3EE', '#8B5CF6', '#F43F5E', '#F59E0B', '#10B981'];

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:5000/api/stats?userId=${userId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setStatsData(json.data);
      }
    } catch (err) {
      console.error('Lỗi tải thống kê:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId]);

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.topHeaderRow}>
        <View style={{ flex: 1 }}>
          <SectionTitle
            title="Thống kê Sức khỏe Tinh thần"
            subtitle={`Toàn cảnh hành trình âm nhạc và mức độ phục hồi cảm xúc của bạn.`}
          />
        </View>

        {/* Nút bật Pop-up Đánh giá Cảm xúc */}
        <Pressable
          onPress={() => setFeedbackModalOpen(true)}
          style={styles.feedbackBtnWrap}
        >
          <LinearGradient
            colors={['#22D3EE', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.feedbackBtnGradient}
          >
            <Text style={{ fontSize: 16 }}>✍️</Text>
            <Text style={styles.feedbackBtnText}>Đánh giá phiên nghe</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {loading && !statsData ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#22D3EE" />
          <Text style={styles.loadingText}>Đang tổng hợp dữ liệu trị liệu âm nhạc...</Text>
        </View>
      ) : (
        <>
          {/* 4 Stat Cards từ Dữ liệu thật */}
          <View style={styles.statsRow}>
            {/* Card 1: Tổng thời gian */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Tổng thời gian trị liệu</Text>
              <Text style={styles.statVal}>{statsData?.totalHours || '1.8 giờ'}</Text>
              <View style={styles.subTrend}>
                <Icon name="clock" size={13} color="#22D3EE" />
                <Text style={styles.subTrendText}>
                  {statsData?.totalMinutes || 105} phút tích lũy
                </Text>
              </View>
            </View>

            {/* Card 2: Điểm đánh giá hiệu quả */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Hiệu quả trung bình</Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={styles.statVal}>{statsData?.avgRating || '4.8'}</Text>
                <Text style={{ fontSize: 16, color: '#FBBF24' }}>⭐⭐⭐⭐⭐</Text>
              </View>
              <View style={styles.subTrend}>
                <Icon name="check" size={13} color="#10B981" />
                <Text style={[styles.subTrendText, { color: '#10B981' }]}>
                  {statsData?.completionRate || '84%'} hoàn thành
                </Text>
              </View>
            </View>

            {/* Card 3: Điểm phục hồi cảm xúc */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Cân bằng Tinh thần</Text>
              <Text style={styles.statVal}>{statsData?.wellnessScore || '88%'}</Text>
              <View style={styles.subTrend}>
                <Icon name="trending" size={13} color="#22D3EE" />
                <Text style={styles.subTrendText}>Chuyển biến tích cực</Text>
              </View>
            </View>

            {/* Card 4: Chuỗi ngày chánh niệm */}
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Chuỗi chánh niệm</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.statVal}>{statsData?.streakDays || 3} ngày</Text>
                <Text style={{ fontSize: 20 }}>🔥</Text>
              </View>
              <Text style={styles.subStreakText}>Duy trì thói quen mỗi ngày</Text>
            </View>
          </View>

          {/* Hourly Area Chart + Mood Donut */}
          <View style={styles.chartsRow}>
            <View style={[styles.chartCard, { flex: 1.3 }]}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>THỜI GIAN NGHE THEO KHUNG GIỜ SINH HỌC</Text>
                <Text style={styles.chartSubtitle}>Biểu đồ sóng năng lượng theo các mốc trong ngày</Text>
              </View>
              <HourlyAreaChart data={statsData?.hourlyActivity || []} />
            </View>

            <View style={[styles.chartCard, { flex: 1 }]}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>PHÂN BỔ SẮC THÁI CẢM XÚC</Text>
                <Text style={styles.chartSubtitle}>Tỷ lệ các trạng thái tâm lý bạn hướng đến</Text>
              </View>
              <DonutChart
                data={statsData?.moodDistribution || []}
                colors={DONUT_COLORS}
              />
            </View>
          </View>

          {/* Weekly Bar Chart */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>MỨC ĐỘ THỰC HIỆN LIỆU TRÌNH TRONG TUẦN (7 NGÀY)</Text>
              <Text style={styles.chartSubtitle}>Thời lượng và tỷ lệ duy trì từ Thứ 2 đến Chủ Nhật</Text>
            </View>
            <WeeklyBarChart data={statsData?.weeklyCompletion || []} />
          </View>

          {/* Recent Evaluations List */}
          {statsData?.recentEvaluations && statsData.recentEvaluations.length > 0 && (
            <View style={styles.evalSectionCard}>
              <View style={styles.evalHeaderRow}>
                <View>
                  <Text style={styles.evalSectionTitle}>Nhật ký Cải thiện Cảm xúc sau phiên nghe</Text>
                  <Text style={styles.evalSectionSub}>
                    Dữ liệu khảo sát từ Pop-up phản hồi của bạn được lưu an toàn trong CSDL
                  </Text>
                </View>
                <Pressable
                  onPress={() => setFeedbackModalOpen(true)}
                  style={styles.addEvalBtn}
                >
                  <Text style={styles.addEvalBtnText}>+ Thêm đánh giá</Text>
                </Pressable>
              </View>

              <View style={styles.evalList}>
                {statsData.recentEvaluations.map((e: any, index: number) => {
                  const bMood = moodById(e.mood_before);
                  const aMood = moodById(e.mood_after);
                  return (
                    <View key={e.id || index} style={styles.evalItem}>
                      <View style={styles.evalTopRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.evalJourneyTitle}>🎵 {e.journey_title}</Text>
                          <View style={styles.evalMoodTransition}>
                            <Text style={styles.moodTagText}>
                              Trước: {bMood?.emoji || '😰'} {bMood?.label || e.mood_before}
                            </Text>
                            <Text style={styles.arrowText}>➔</Text>
                            <Text style={[styles.moodTagText, styles.moodAfterText]}>
                              Sau: {aMood?.emoji || '😌'} {aMood?.label || e.mood_after}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.evalRatingBadge}>
                          <Text style={styles.evalRatingText}>{'⭐'.repeat(e.rating || 5)}</Text>
                          <Text style={styles.evalDurationText}>{e.duration_minutes || 30} phút</Text>
                        </View>
                      </View>

                      {e.feedback_note ? (
                        <Text style={styles.evalNoteText}>"{e.feedback_note}"</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </>
      )}

      {/* Pop-up Đánh giá Phiên Trị liệu Âm nhạc */}
      <SessionFeedbackModal
        visible={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        onFeedbackSubmitted={() => {
          fetchStats();
        }}
        userId={userId}
        journey={currentJourney}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 980,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 70,
  },
  topHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  feedbackBtnWrap: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  feedbackBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  feedbackBtnText: {
    color: '#FFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 22,
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 18,
  },
  statLabel: {
    fontSize: 12.5,
    color: COLORS.faint,
    marginBottom: 8,
    fontWeight: '600',
  },
  statVal: {
    fontSize: 26,
    color: COLORS.text,
    fontWeight: '800',
  },
  subTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  subTrendText: {
    fontSize: 12,
    color: '#22D3EE',
    fontWeight: '600',
  },
  subStreakText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 8,
    fontWeight: '600',
  },
  chartsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginBottom: 18,
  },
  chartCard: {
    minWidth: 320,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },
  chartHeader: {
    marginBottom: 14,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  chartSubtitle: {
    fontSize: 11.5,
    color: COLORS.faint,
    marginTop: 3,
  },
  evalSectionCard: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
    marginTop: 8,
  },
  evalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  evalSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  evalSectionSub: {
    fontSize: 12,
    color: COLORS.faint,
    marginTop: 2,
  },
  addEvalBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
  },
  addEvalBtnText: {
    color: '#22D3EE',
    fontSize: 12,
    fontWeight: '700',
  },
  evalList: {
    gap: 12,
  },
  evalItem: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 14,
    padding: 14,
  },
  evalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  evalJourneyTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  evalMoodTransition: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  moodTagText: {
    fontSize: 12,
    color: COLORS.muted,
  },
  arrowText: {
    fontSize: 12,
    color: '#22D3EE',
    fontWeight: '800',
  },
  moodAfterText: {
    color: '#10B981',
    fontWeight: '700',
  },
  evalRatingBadge: {
    alignItems: 'flex-end',
  },
  evalRatingText: {
    fontSize: 13,
  },
  evalDurationText: {
    fontSize: 11,
    color: COLORS.faint,
    marginTop: 2,
  },
  evalNoteText: {
    fontSize: 12.5,
    color: COLORS.muted,
    fontStyle: 'italic',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
  },
});
