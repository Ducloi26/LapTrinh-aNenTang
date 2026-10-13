import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, moodById } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import RadarChart from '@/components/moodflow/music-dna/RadarChart';
import DonutChart from '@/components/moodflow/music-dna/DonutChart';
import DnaSlider from '@/components/moodflow/music-dna/DnaSlider';

const GENRE_DATA = [
  { genre: 'R&B', value: 42 },
  { genre: 'Pop', value: 28 },
  { genre: 'Indie', value: 18 },
  { genre: 'Rock', value: 12 },
];
const DONUT_COLORS = ['#67E8F9', '#A78BFA', '#F472B6', '#FDBA74'];

export default function MusicDNAPage() {
  const [energy, setEnergy] = useState(46);
  const [tempo, setTempo] = useState(38);

  return (
    <View style={styles.container}>
      <SectionTitle
        title="Music DNA của bạn"
        subtitle="Gu âm nhạc của bạn thay đổi theo từng trải nghiệm."
      />

      {/* Charts 2 Columns */}
      <View style={styles.twoCols}>
        {/* Radar */}
        <View style={styles.chartCard}>
          <Text style={styles.cardHeader}>THỂ LOẠI (RADAR COMPOSITION)</Text>
          <RadarChart data={GENRE_DATA} />
        </View>

        {/* Donut */}
        <View style={styles.chartCard}>
          <Text style={styles.cardHeader}>PHÂN BỔ (DISTRIBUTION)</Text>
          <DonutChart data={GENRE_DATA} colors={DONUT_COLORS} />
          <View style={styles.legendWrap}>
            {GENRE_DATA.map((g, i) => (
              <View key={g.genre} style={styles.legendRow}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: DONUT_COLORS[i] },
                  ]}
                />
                <Text style={styles.legendText}>{g.genre}</Text>
                <Text style={styles.legendVal}>{g.value}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Sliders & Context */}
      <View style={styles.twoCols}>
        {/* Sliders */}
        <View style={styles.chartCard}>
          <DnaSlider
            label="ENERGY"
            left="Thấp"
            right="Cao"
            value={energy}
            onChange={setEnergy}
          />
          <DnaSlider
            label="TEMPO"
            left="Chậm"
            right="Nhanh"
            value={tempo}
            onChange={setTempo}
          />

          <Text style={[styles.cardHeader, { marginTop: 14 }]}>
            MOOD YÊU THÍCH
          </Text>
          <View style={styles.tagWrap}>
            {['calm', 'focus', 'dreamy'].map((id) => {
              const m = moodById(id);
              return (
                <View key={id} style={styles.moodTag}>
                  <Text style={styles.moodTagText}>
                    {m.emoji} {m.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Listen Time Peak */}
        <View style={[styles.chartCard, { justifyContent: 'space-between' }]}>
          <View>
            <Text style={styles.cardHeader}>THỜI GIAN NGHE THƯỜNG XUYÊN</Text>
            <Text style={styles.peakHour}>22:00 – 00:00</Text>
          </View>
          <Text style={styles.dnaQuote}>
            Bạn thường tìm đến MoodFlow vào cuối ngày, khi cần chuyển từ trạng
            thái căng thẳng sang tập trung sâu hoặc thư giãn.
          </Text>
        </View>
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
  cardHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    marginBottom: 12,
  },
  legendWrap: {
    gap: 6,
    marginTop: 14,
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
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  moodTag: {
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moodTagText: {
    fontSize: 12.5,
    color: COLORS.text,
  },
  peakHour: {
    fontSize: 30,
    color: COLORS.text,
    fontWeight: '400',
    marginTop: 6,
  },
  dnaQuote: {
    color: COLORS.faint,
    fontSize: 12.5,
    marginTop: 18,
    lineHeight: 20,
  },
});
