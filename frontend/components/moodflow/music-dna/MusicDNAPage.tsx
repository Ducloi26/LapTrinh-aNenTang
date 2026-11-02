import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import RadarChart from '@/components/moodflow/music-dna/RadarChart';
import DonutChart from '@/components/moodflow/music-dna/DonutChart';
import DnaSlider from '@/components/moodflow/music-dna/DnaSlider';
import {
  computeDNA,
  createDefaultDNA,
  saveDNARecommendationPreferences,
} from '@/services/dna-service';
import type {
  DNAProfile,
  DNARecommendationPreferences,
} from '@/services/dna-service';

const GENRE_COLORS: Record<string, string> = {
  'Lo-fi': '#67E8F9',
  Ambient: '#A78BFA',
  Classical: '#F472B6',
  Synthwave: '#FDBA74',
  Acoustic: '#34D399',
  Khác: '#64748B',
};

const METRICS = [
  {
    label: 'Năng lượng',
    left: 'Thấp',
    right: 'Cao',
    description: 'Mức độ sôi động và mạnh mẽ trong âm nhạc bạn yêu thích.',
    scoreKey: 'energy',
  },
  {
    label: 'Độ sâu',
    left: 'Nhẹ nhàng',
    right: 'Sâu lắng',
    description: 'Xu hướng chọn giai điệu và ca từ giàu chiều sâu cảm xúc.',
    scoreKey: 'depth',
  },
  {
    label: 'Tần số',
    left: 'Âm trầm',
    right: 'Âm cao',
    description: 'Sắc thái âm thanh bạn thường muốn nghe, từ trầm ấm đến sáng.',
    scoreKey: 'frequency',
  },
  {
    label: 'Nhịp điệu',
    left: 'Chậm',
    right: 'Nhanh',
    description: 'Tốc độ và độ rõ nét của nhịp điệu hợp với bạn.',
    scoreKey: 'rhythm',
  },
  {
    label: 'Độ tập trung',
    left: 'Thả lỏng',
    right: 'Tập trung',
    description: 'Mức độ âm nhạc giúp bạn duy trì sự chú ý khi nghe hoặc làm việc.',
    scoreKey: 'focus',
  },
] as const;

interface MusicDNAPageProps {
  userId?: string;
  preferences: DNARecommendationPreferences;
  preferencesReady: boolean;
  preferencesLoadError: string | null;
  onPreferencesChange: (preferences: DNARecommendationPreferences) => void;
}

const PREFERENCE_SLIDERS = [
  {
    key: 'energyOffset',
    label: 'Năng lượng',
    left: 'Giảm',
    right: 'Tăng',
    min: -20,
    max: 20,
    steps: [-20, -10, 0, 10, 20],
    formatValue: (value: number) =>
      value === 0 ? 'Mặc định' : `${value > 0 ? '+' : ''}${value} điểm`,
  },
  {
    key: 'tempoOffset',
    label: 'Nhịp độ',
    left: 'Chậm hơn',
    right: 'Nhanh hơn',
    min: -20,
    max: 20,
    steps: [-20, -10, 0, 10, 20],
    formatValue: (value: number) =>
      value === 0 ? 'Mặc định' : `${value > 0 ? '+' : ''}${value} BPM`,
  },
  {
    key: 'vocalPreference',
    label: 'Độ có lời',
    left: 'Không lời',
    right: 'Có lời',
    min: 0,
    max: 100,
    steps: [0, 25, 50, 75, 100],
    formatValue: (value: number) => `${value}%`,
  },
] as const;

export default function MusicDNAPage({
  userId = 'guest',
  preferences,
  preferencesReady,
  preferencesLoadError,
  onPreferencesChange,
}: MusicDNAPageProps) {
  const [profile, setProfile] = useState<DNAProfile>(createDefaultDNA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferencesStatus, setPreferencesStatus] = useState<string | null>(null);
  const lastSavedPreferences = useRef<string | null>(null);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    computeDNA(userId)
      .then((result) => {
        if (active) setProfile(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Không thể tải dữ liệu Music DNA.'
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!preferencesReady) return;

    const snapshot = JSON.stringify(preferences);
    if (lastSavedPreferences.current === null) {
      lastSavedPreferences.current = snapshot;
      return;
    }
    if (snapshot === lastSavedPreferences.current) return;
    if (preferencesLoadError) {
      setPreferencesStatus('Không lưu được vì chưa tải được tùy chỉnh đã lưu.');
      return;
    }
    if (!userId || userId === 'guest') {
      setPreferencesStatus('Đăng nhập để lưu tùy chỉnh cho lần sau.');
      return;
    }

    let active = true;
    const timeout = setTimeout(() => {
      saveQueue.current = saveQueue.current.then(async () => {
        if (!active) return;
        setPreferencesStatus('Đang lưu tùy chỉnh...');
        try {
          const savedPreferences = await saveDNARecommendationPreferences(
            userId,
            preferences
          );
          if (!active) return;
          lastSavedPreferences.current = JSON.stringify(savedPreferences);
          setPreferencesStatus('Đã lưu tùy chỉnh.');
        } catch (cause: unknown) {
          if (!active) return;
          setPreferencesStatus(
            cause instanceof Error
              ? cause.message
              : 'Không thể lưu tùy chỉnh Music DNA.'
          );
        }
      });
    }, 500);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [preferences, preferencesReady, preferencesLoadError, userId]);

  const metrics = METRICS.map((metric) => ({
    ...metric,
    value: profile.scores[metric.scoreKey],
  }));
  const strongestMetric = metrics.reduce((strongest, metric) =>
    metric.value > strongest.value ? metric : strongest
  );
  const quietestMetric = metrics.reduce((quietest, metric) =>
    metric.value < quietest.value ? metric : quietest
  );

  return (
    <View style={styles.container}>
      <SectionTitle
        eyebrow="HỒ SƠ ÂM NHẠC CÁ NHÂN"
        title="Bản đồ Gene Âm nhạc"
        subtitle="Khám phá 5 nét trong gu nghe nhạc của bạn, được tính từ lịch sử nghe 30 ngày gần nhất."
      />

      {error ? (
        <View style={[styles.notice, styles.errorNotice]}>
          <Text style={styles.noticeText}>{error}</Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingNotice}>
          <ActivityIndicator color="#67E8F9" />
          <Text style={styles.noticeText}>
            Đang phân tích lịch sử nghe 30 ngày gần nhất...
          </Text>
        </View>
      ) : !profile.hasHistory ? (
        <View style={styles.notice}>
          <Text style={styles.noticeIcon}>ⓘ</Text>
          <Text style={styles.noticeText}>
            Nghe thêm để MoodFlow hiểu bạn hơn. Bản đồ đang hiển thị DNA mặc
            định; chỉ số sẽ được tính từ các bài đã nghe trong 30 ngày gần nhất.
          </Text>
        </View>
      ) : (
        <View style={styles.notice}>
          <Text style={styles.noticeIcon}>♫</Text>
          <Text style={styles.noticeText}>
            Được tính từ {profile.trackCount} lượt nghe (
            {Math.round(profile.listeningSeconds / 60)} phút) trong 30 ngày gần
            nhất, có trọng số theo thời gian nghe.
          </Text>
        </View>
      )}

      <View style={styles.twoCols}>
        <View style={[styles.chartCard, styles.radarCard]}>
          <Text style={styles.cardHeader}>5 CHỈ SỐ ÂM NHẠC CỦA BẠN</Text>
          <RadarChart data={metrics} />
          <Text style={styles.chartHint}>
            Các chỉ số được chuẩn hóa theo thang điểm 0–100.
          </Text>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.cardHeader}>THỜI GIAN NGHE THEO THỂ LOẠI</Text>
          <DonutChart
            data={profile.genreDistribution}
            colors={profile.genreDistribution.map(
              (item) => GENRE_COLORS[item.genre] ?? GENRE_COLORS.Khác
            )}
          />
          <View style={styles.legendWrap}>
            {profile.genreDistribution.map((genre, index) => (
              <View key={genre.genre} style={styles.legendRow}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor:
                        GENRE_COLORS[genre.genre] ?? GENRE_COLORS.Khác,
                    },
                  ]}
                />
                <Text style={styles.legendText}>{genre.genre}</Text>
                <Text style={styles.legendVal}>{genre.value}%</Text>
              </View>
            ))}
          </View>
          <Text style={styles.chartHint}>
            Tỷ lệ theo thời gian nghe trong 30 ngày gần nhất.
          </Text>
        </View>
      </View>

      <View style={styles.twoCols}>
        <View style={[styles.chartCard, styles.metricsCard]}>
          <Text style={styles.cardHeader}>CHI TIẾT 5 CHỈ SỐ</Text>
          <Text style={styles.cardDescription}>
            Các điểm số được suy ra từ đặc trưng bài hát và thời lượng nghe.
          </Text>
          {metrics.map((metric) => (
            <DnaSlider
              key={metric.label}
              label={metric.label}
              left={metric.left}
              right={metric.right}
              value={metric.value}
            />
          ))}
          <View style={styles.preferenceDivider} />
          <Text style={styles.preferenceTitle}>SỞ THÍCH CHO BÀI ĐƯỢC GỢI Ý</Text>
          <Text style={styles.cardDescription}>
            Tùy chỉnh sẽ điều chỉnh mức năng lượng, BPM mục tiêu và ưu tiên bài
            có lời khi tạo hành trình mới.
          </Text>
          {PREFERENCE_SLIDERS.map((slider) => (
            <DnaSlider
              key={slider.key}
              label={slider.label}
              left={slider.left}
              right={slider.right}
              min={slider.min}
              max={slider.max}
              steps={[...slider.steps]}
              value={preferences[slider.key]}
              formatValue={slider.formatValue}
              onChange={(value) =>
                onPreferencesChange({ ...preferences, [slider.key]: value })
              }
            />
          ))}
          {preferencesLoadError ? (
            <Text style={styles.preferenceError}>{preferencesLoadError}</Text>
          ) : preferencesStatus ? (
            <Text style={styles.preferenceStatus}>{preferencesStatus}</Text>
          ) : (
            <Text style={styles.preferenceStatus}>
              Thay đổi được lưu tự động sau 500 ms.
            </Text>
          )}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.cardHeader}>CÁCH ĐỌC BẢN ĐỒ</Text>
          <Text style={styles.cardDescription}>
            Mỗi trục thể hiện một khía cạnh khác nhau. Điểm càng cao, đặc điểm
            đó càng rõ trong các bài bạn đã nghe.
          </Text>

          <View style={styles.insightCard}>
            <Text style={styles.insightEyebrow}>ĐIỂM NỔI BẬT</Text>
            <Text style={styles.insightTitle}>
              {strongestMetric.label} · {strongestMetric.value}%
            </Text>
            <Text style={styles.insightText}>
              {strongestMetric.description}
            </Text>
          </View>

          <View style={styles.insightCard}>
            <Text style={styles.insightEyebrow}>GÓC ĐỐI LẬP</Text>
            <Text style={styles.insightTitle}>
              {quietestMetric.label} · {quietestMetric.value}%
            </Text>
            <Text style={styles.insightText}>
              Đây là khía cạnh nhẹ nhất trong hồ sơ Music DNA hiện tại của bạn.
            </Text>
          </View>

          <Text style={styles.chartHint}>
            Tần số dùng tỷ lệ thời gian nghe nhạc Binaural; nếu dữ liệu này
            không có, hệ thống quy đổi loudness từ -60 đến 0 dB.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 60,
  },
  twoCols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 20,
  },
  chartCard: {
    flex: 1,
    minWidth: 300,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
  },
  radarCard: {
    flex: 1.4,
  },
  metricsCard: {
    flex: 1.2,
  },
  cardHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  cardDescription: {
    color: COLORS.faint,
    fontSize: 13,
    lineHeight: 19,
    marginTop: -4,
    marginBottom: 20,
  },
  chartHint: {
    color: COLORS.faint,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  preferenceDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginTop: 4,
    marginBottom: 18,
  },
  preferenceTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 10,
  },
  preferenceStatus: {
    color: COLORS.faint,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -6,
  },
  preferenceError: {
    color: COLORS.danger,
    fontSize: 12,
    lineHeight: 18,
    marginTop: -6,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.2)',
    backgroundColor: 'rgba(103,232,249,0.06)',
    padding: 13,
    marginBottom: 20,
  },
  noticeIcon: {
    color: '#67E8F9',
    fontSize: 15,
    fontWeight: '700',
  },
  noticeText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 12.5,
    lineHeight: 19,
  },
  errorNotice: {
    borderColor: 'rgba(251,113,133,0.3)',
    backgroundColor: 'rgba(251,113,133,0.08)',
  },
  loadingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface2,
    padding: 13,
    marginBottom: 20,
  },
  legendWrap: {
    gap: 8,
    marginTop: 18,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: COLORS.muted,
    fontSize: 12.5,
  },
  legendVal: {
    marginLeft: 'auto',
    color: COLORS.text,
    fontWeight: '700',
    fontSize: 12.5,
  },
  insightCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  insightEyebrow: {
    color: COLORS.faint,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  insightTitle: {
    color: '#67E8F9',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 7,
  },
  insightText: {
    color: COLORS.muted,
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: 6,
  },
});
