import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/moodflow';

interface HourlyAreaChartProps {
  data: Array<{ h: string; v: number }>;
}

export default function HourlyAreaChart({ data }: HourlyAreaChartProps) {
  if (Platform.OS === 'web') {
    const maxVal = Math.max(...data.map((d) => d.v));
    const width = 460;
    const height = 150;
    const padding = 20;

    const points = data.map((d, i) => {
      const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - (d.v / maxVal) * (height - 2 * padding);
      return { x, y };
    });

    const pathStr = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');
    const areaStr = `${pathStr} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`;

    const SvgElement = 'svg' as any;
    const PathElement = 'path' as any;
    const CircleElement = 'circle' as any;
    const TextElement = 'text' as any;
    const DefsElement = 'defs' as any;
    const LinearGrad = 'linearGradient' as any;
    const StopElement = 'stop' as any;

    return (
      <View style={{ width: '100%' }}>
        <SvgElement width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <DefsElement>
            <LinearGrad id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <StopElement offset="0%" stopColor="#67E8F9" stopOpacity="0.45" />
              <StopElement offset="100%" stopColor="#67E8F9" stopOpacity="0.0" />
            </LinearGrad>
          </DefsElement>
          <PathElement d={areaStr} fill="url(#areaFill)" />
          <PathElement d={pathStr} fill="none" stroke="#67E8F9" strokeWidth="2.5" />
          {points.map((p, i) => (
            <CircleElement key={i} cx={p.x} cy={p.y} r="3.5" fill="#67E8F9" />
          ))}
          {data.map((d, i) => {
            const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
            return (
              <TextElement
                key={i}
                x={x}
                y={height - 4}
                fill="#5C6382"
                fontSize="10.5"
                textAnchor="middle"
              >
                {d.h}
              </TextElement>
            );
          })}
        </SvgElement>
      </View>
    );
  }

  // Fallback native
  return (
    <View style={styles.fallbackRow}>
      {data.map((d) => (
        <View key={d.h} style={styles.fallbackCol}>
          <View style={[styles.fallbackBar, { height: d.v * 2 }]} />
          <Text style={styles.fallbackText}>{d.h}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingHorizontal: 10,
  },
  fallbackCol: {
    alignItems: 'center',
    gap: 6,
  },
  fallbackBar: {
    width: 8,
    backgroundColor: '#67E8F9',
    borderRadius: 4,
  },
  fallbackText: {
    fontSize: 11,
    color: COLORS.faint,
  },
});
