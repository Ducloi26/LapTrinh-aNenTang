import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, Mood } from '@/constants/moodflow';

interface JourneyLineProps {
  from: Mood;
  to: Mood;
}

export default function JourneyLine({ from, to }: JourneyLineProps) {
  const fromEnergy = from.targetEnergy ?? 40;
  const toEnergy = to.targetEnergy ?? 70;

  // 4 điểm năng lượng tương ứng 4 giai đoạn
  // 1. Thấu cảm (20%) -> 2. Chuyển tiếp (30%) -> 3. Nâng đỡ (30%) -> 4. Thăng hoa (20%)
  const e1 = fromEnergy;
  const e2 = Math.round(fromEnergy + (toEnergy - fromEnergy) * 0.35);
  const e3 = Math.round(fromEnergy + (toEnergy - fromEnergy) * 0.75);
  const e4 = toEnergy;

  const stages = [
    { name: 'Thấu cảm', energy: e1, percent: '20%' },
    { name: 'Chuyển tiếp', energy: e2, percent: '50%' },
    { name: 'Nâng đỡ', energy: e3, percent: '80%' },
    { name: 'Thăng hoa', energy: e4, percent: '100%' },
  ];

  const renderSvgCurve = () => {
    if (Platform.OS !== 'web') {
      // Fallback native
      return (
        <View style={styles.nativeLineWrap}>
          <LinearGradient
            colors={[from.colors[0], to.colors[to.colors.length - 1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nativeGradient}
          />
        </View>
      );
    }

    const width = 420;
    const height = 90;
    const paddingX = 35;
    const paddingY = 16;

    // Tọa độ 4 điểm trên canvas SVG
    // Năng lượng 0..100 map vào Y từ (height - paddingY) đến paddingY
    const getY = (energy: number) => {
      const clamped = Math.max(10, Math.min(95, energy));
      return height - paddingY - (clamped / 100) * (height - 2 * paddingY);
    };

    const xCoords = [
      paddingX,
      paddingX + (width - 2 * paddingX) * 0.32,
      paddingX + (width - 2 * paddingX) * 0.68,
      width - paddingX,
    ];

    const pts = [
      { x: xCoords[0], y: getY(e1) },
      { x: xCoords[1], y: getY(e2) },
      { x: xCoords[2], y: getY(e3) },
      { x: xCoords[3], y: getY(e4) },
    ];

    // Đường cong cubic bezier mượt mà qua 4 điểm
    const pathD = `M ${pts[0].x} ${pts[0].y} ` +
      `C ${pts[0].x + 40} ${pts[0].y}, ${pts[1].x - 40} ${pts[1].y}, ${pts[1].x} ${pts[1].y} ` +
      `C ${pts[1].x + 40} ${pts[1].y}, ${pts[2].x - 40} ${pts[2].y}, ${pts[2].x} ${pts[2].y} ` +
      `C ${pts[2].x + 40} ${pts[2].y}, ${pts[3].x - 40} ${pts[3].y}, ${pts[3].x} ${pts[3].y}`;

    const areaD = `${pathD} L ${pts[3].x} ${height - 4} L ${pts[0].x} ${height - 4} Z`;

    const SvgEl = 'svg' as any;
    const PathEl = 'path' as any;
    const CircleEl = 'circle' as any;
    const DefsEl = 'defs' as any;
    const LinearGrad = 'linearGradient' as any;
    const StopEl = 'stop' as any;

    return (
      <View style={styles.svgContainer}>
        <SvgEl width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <DefsEl>
            <LinearGrad id="journeyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <StopEl offset="0%" stopColor={from.colors[0]} stopOpacity="1" />
              <StopEl offset="50%" stopColor={to.colors[0]} stopOpacity="0.9" />
              <StopEl offset="100%" stopColor={to.colors[to.colors.length - 1]} stopOpacity="1" />
            </LinearGrad>
            <LinearGrad id="areaGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <StopEl offset="0%" stopColor={to.colors[0]} stopOpacity="0.25" />
              <StopEl offset="100%" stopColor={to.colors[0]} stopOpacity="0.0" />
            </LinearGrad>
          </DefsEl>

          {/* Vùng bóng mờ bên dưới đường cong */}
          <PathEl d={areaD} fill="url(#areaGlow)" />

          {/* Đường cong năng lượng chính */}
          <PathEl
            d={pathD}
            fill="none"
            stroke="url(#journeyGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* 4 nốt tròn tại 4 mốc giai đoạn */}
          {pts.map((pt, idx) => (
            <React.Fragment key={idx}>
              <CircleEl
                cx={pt.x}
                cy={pt.y}
                r="6"
                fill="#0F1424"
                stroke={idx === 0 ? from.colors[0] : to.colors[0]}
                strokeWidth="2.5"
              />
              <CircleEl
                cx={pt.x}
                cy={pt.y}
                r="2.5"
                fill="#FFFFFF"
              />
            </React.Fragment>
          ))}
        </SvgEl>

        {/* 4 nhãn chú thích giai đoạn bên dưới đường cong */}
        <View style={styles.stageLabelsRow}>
          {stages.map((st, i) => (
            <View key={i} style={styles.stageLabelCol}>
              <Text style={styles.stageIndexText}>GĐ {i + 1}</Text>
              <Text style={styles.stageNameText}>{st.name}</Text>
              <Text style={styles.stageEnergyText}>{st.energy}% NL</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.rootCard}>
      {/* Cột tâm trạng xuất phát */}
      <View style={styles.moodCol}>
        <View style={[styles.emojiWrap, { borderColor: from.colors[0] }]}>
          <Text style={styles.emoji}>{from.emoji}</Text>
        </View>
        <Text style={styles.moodTitle} numberOfLines={1}>{from.label}</Text>
        <Text style={styles.moodEnergyBadge}>Khởi đầu {fromEnergy}%</Text>
      </View>

      {/* Vùng biểu đồ đường cong ở giữa */}
      <View style={styles.curveArea}>
        <Text style={styles.curveHeader}>ĐƯỜNG CONG CHUYỂN TIẾP NĂNG LƯỢNG 4 GIAI ĐOẠN</Text>
        {renderSvgCurve()}
      </View>

      {/* Cột tâm trạng mục tiêu */}
      <View style={styles.moodCol}>
        <View style={[styles.emojiWrap, { borderColor: to.colors[to.colors.length - 1] }]}>
          <Text style={styles.emoji}>{to.emoji}</Text>
        </View>
        <Text style={styles.moodTitle} numberOfLines={1}>{to.label}</Text>
        <Text style={[styles.moodEnergyBadge, styles.targetBadge]}>Mục tiêu {toEnergy}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    gap: 12,
  },
  moodCol: {
    alignItems: 'center',
    width: 95,
    gap: 6,
  },
  emojiWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 26,
  },
  moodTitle: {
    fontSize: 12.5,
    color: COLORS.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  moodEnergyBadge: {
    fontSize: 11,
    color: COLORS.muted,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    fontWeight: '600',
  },
  targetBadge: {
    color: '#67E8F9',
    backgroundColor: 'rgba(103, 232, 249, 0.12)',
  },
  curveArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  curveHeader: {
    fontSize: 10,
    color: COLORS.faint,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  svgContainer: {
    width: '100%',
    alignItems: 'center',
  },
  stageLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 14,
    marginTop: 4,
  },
  stageLabelCol: {
    alignItems: 'center',
  },
  stageIndexText: {
    fontSize: 9.5,
    color: COLORS.faint,
    fontWeight: '700',
  },
  stageNameText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '600',
  },
  stageEnergyText: {
    fontSize: 9.5,
    color: '#67E8F9',
  },
  nativeLineWrap: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 14,
  },
  nativeGradient: {
    width: '100%',
    height: '100%',
  },
});
