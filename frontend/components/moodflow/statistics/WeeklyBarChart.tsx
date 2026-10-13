import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/moodflow';

interface WeeklyBarChartProps {
  data: Array<{ d: string; v: number }>;
}

export default function WeeklyBarChart({ data }: WeeklyBarChartProps) {
  if (Platform.OS === 'web') {
    const maxVal = 100;
    const width = 460;
    const height = 150;
    const padding = 24;
    const barWidth = 26;

    const SvgElement = 'svg' as any;
    const LineElement = 'line' as any;
    const RectElement = 'rect' as any;
    const TextElement = 'text' as any;
    const GroupElement = 'g' as any;

    return (
      <View style={{ width: '100%' }}>
        <SvgElement width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <LineElement
            x1={padding}
            x2={width - padding}
            y1={padding}
            y2={padding}
            stroke="rgba(255,255,255,0.06)"
          />
          <LineElement
            x1={padding}
            x2={width - padding}
            y1={height / 2}
            y2={height / 2}
            stroke="rgba(255,255,255,0.06)"
          />
          {data.map((d, i) => {
            const x =
              padding +
              (i / (data.length - 1)) * (width - 2 * padding - barWidth);
            const barH = (d.v / maxVal) * (height - 2 * padding);
            const y = height - padding - barH;
            return (
              <GroupElement key={d.d}>
                <RectElement
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="6"
                  fill="#A78BFA"
                />
                <TextElement
                  x={x + barWidth / 2}
                  y={height - 5}
                  fill="#5C6382"
                  fontSize="10.5"
                  textAnchor="middle"
                >
                  {d.d}
                </TextElement>
              </GroupElement>
            );
          })}
        </SvgElement>
      </View>
    );
  }

  // Fallback native
  return (
    <View style={styles.container}>
      {data.map((d) => (
        <View key={d.d} style={styles.col}>
          <View style={[styles.bar, { height: (d.v / 100) * 80 }]} />
          <Text style={styles.text}>{d.d}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: 12,
  },
  col: {
    alignItems: 'center',
    gap: 6,
  },
  bar: {
    width: 22,
    backgroundColor: '#A78BFA',
    borderRadius: 6,
  },
  text: {
    fontSize: 11,
    color: COLORS.faint,
  },
});
