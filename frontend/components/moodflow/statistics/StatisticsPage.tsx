import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import Icon from '@/components/moodflow/shared/Icon';
import HourlyAreaChart from '@/components/moodflow/statistics/HourlyAreaChart';
import WeeklyBarChart from '@/components/moodflow/statistics/WeeklyBarChart';
import DonutChart from '@/components/moodflow/music-dna/DonutChart';

const HOURLY = [
  { h: '06h', v: 8 },
  { h: '09h', v: 22 },
  { h: '12h', v: 15 },
  { h: '15h', v: 30 },
  { h: '18h', v: 24 },
  { h: '21h', v: 46 },
  { h: '24h', v: 18 },
];

const COMPLETION = [
  { d: 'T2', v: 62 },
  { d: 'T3', v: 74 },
  { d: 'T4', v: 58 },
  { d: 'T5', v: 81 },
  { d: 'T6', v: 69 },
  { d: 'T7', v: 90 },
  { d: 'CN', v: 77 },
];

const MOOD_DIST = [
  { genre: 'Tập trung', value: 34 },
  { genre: 'Bình tĩnh', value: 26 },
  { genre: 'Năng lượng', value: 18 },
  { genre: 'Mơ màng', value: 14 },
];
const DONUT_COLORS = ['#67E8F9', '#A78BFA', '#F472B6', '#FDBA74'];

export default function StatisticsPage() {
  return (
    <View style={styles.container}>
      <SectionTitle
        title="Thống kê"
        subtitle="Toàn cảnh hành trình âm nhạc và cảm xúc của bạn."
      />

      {/* 4 Stat Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Tổng thời gian nghe</Text>
          <Text style={styles.statVal}>128 giờ</Text>
          <View style={styles.subTrend}>
            <Icon name="trending" size={12} color="#67E8F9" />
            <Text style={styles.subTrendText}>+12% tuần này</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Journey Completion Rate</Text>
          <Text style={styles.statVal}>76%</Text>
          <View style={styles.subTrend}>
            <Icon name="trending" size={12} color="#67E8F9" />
            <Text style={styles.subTrendText}>+4%</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Mood trước</Text>
          <Text style={styles.statVal}>😰 72%</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Mood sau</Text>
          <Text style={styles.statVal}>😌 84%</Text>
          <Text style={styles.subTrendText}>Cải thiện rõ rệt</Text>
        </View>
      </View>

      {/* Hourly Area Chart + Mood Donut */}
      <View style={styles.chartsRow}>
        <View style={[styles.chartCard, { flex: 1.3 }]}>
          <Text style={styles.chartTitle}>THỜI GIAN NGHE THEO GIỜ</Text>
          <HourlyAreaChart data={HOURLY} />
        </View>

        <View style={[styles.chartCard, { flex: 1 }]}>
          <Text style={styles.chartTitle}>PHÂN BỔ MOOD</Text>
          <DonutChart data={MOOD_DIST} colors={DONUT_COLORS} />
        </View>
      </View>

      {/* Weekly Bar Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>JOURNEY COMPLETION RATE (7 NGÀY)</Text>
        <WeeklyBarChart data={COMPLETION} />
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
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 22,
  },
  statCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.faint,
    marginBottom: 8,
  },
  statVal: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '500',
  },
  subTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  subTrendText: {
    fontSize: 12,
    color: '#67E8F9',
    marginTop: 4,
  },
  chartsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
    marginBottom: 18,
  },
  chartCard: {
    minWidth: 300,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
  },
  chartTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    marginBottom: 14,
  },
});
