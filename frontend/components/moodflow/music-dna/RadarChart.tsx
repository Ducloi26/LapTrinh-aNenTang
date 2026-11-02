import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '@/constants/moodflow';

interface RadarChartProps {
  data: { label: string; value: number }[];
}

export default function RadarChart({ data }: RadarChartProps) {
  const centerX = 160;
  const centerY = 150;
  const radius = 88;
  const angles = data.map(
    (_, index) => (2 * Math.PI * index) / Math.max(data.length, 1) - Math.PI / 2
  );
  const pointFor = (angle: number, distance: number) =>
    `${centerX + distance * Math.cos(angle)},${centerY + distance * Math.sin(angle)}`;
  const points = data
    .map((item, index) => {
      const value = Math.max(0, Math.min(100, item.value));
      return pointFor(angles[index], (value / 100) * radius);
    })
    .join(' ');

  if (Platform.OS === 'web') {
    const SvgElement = 'svg' as any;
    const PolygonElement = 'polygon' as any;
    const LineElement = 'line' as any;
    const CircleElement = 'circle' as any;
    const TextElement = 'text' as any;

    return (
      <View style={styles.chartContainer}>
        <SvgElement
          width="100%"
          height="300"
          viewBox="0 0 320 300"
          role="img"
          aria-label="Biểu đồ Music DNA với năm chỉ số cá nhân"
        >
          {[0.2, 0.4, 0.6, 0.8, 1].map((scale) => (
            <PolygonElement
              key={scale}
              points={angles
                .map((angle) => pointFor(angle, radius * scale))
                .join(' ')}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          ))}
          {angles.map((angle, index) => (
            <LineElement
              key={data[index].label}
              x1={centerX}
              y1={centerY}
              x2={centerX + radius * Math.cos(angle)}
              y2={centerY + radius * Math.sin(angle)}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1"
            />
          ))}
          <PolygonElement
            points={points}
            fill="#67E8F9"
            fillOpacity="0.28"
            stroke="#67E8F9"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {data.map((item, index) => {
            const value = Math.max(0, Math.min(100, item.value));
            const distance = (value / 100) * radius;
            const x = centerX + distance * Math.cos(angles[index]);
            const y = centerY + distance * Math.sin(angles[index]);
            const labelX = centerX + (radius + 23) * Math.cos(angles[index]);
            const labelY = centerY + (radius + 23) * Math.sin(angles[index]);
            const textAnchor =
              Math.abs(labelX - centerX) < 12
                ? 'middle'
                : labelX > centerX
                  ? 'start'
                  : 'end';

            return (
              <React.Fragment key={item.label}>
                <CircleElement
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#67E8F9"
                  stroke="#080B14"
                  strokeWidth="2"
                />
                <TextElement
                  x={labelX}
                  y={labelY}
                  fill="#AEB5CA"
                  fontSize="11"
                  textAnchor={textAnchor}
                  dominantBaseline="middle"
                  fontWeight="600"
                >
                  {item.label}
                </TextElement>
              </React.Fragment>
            );
          })}
        </SvgElement>
      </View>
    );
  }

  return (
    <View style={styles.fallbackContainer}>
      {data.map((item) => {
        const value = Math.max(0, Math.min(100, item.value));
        return (
          <View key={item.label} style={styles.fallbackRow}>
            <Text style={styles.fallbackLabel}>{item.label}</Text>
            <View style={styles.fallbackBarBg}>
              <View style={[styles.fallbackBarFill, { width: `${value}%` }]} />
            </View>
            <Text style={styles.fallbackVal}>{value}%</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chartContainer: {
    width: '100%',
    alignItems: 'center',
  },
  fallbackContainer: {
    paddingVertical: 10,
    gap: 16,
  },
  fallbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fallbackLabel: {
    width: 96,
    color: COLORS.muted,
    fontSize: 12,
  },
  fallbackBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fallbackBarFill: {
    height: '100%',
    backgroundColor: '#67E8F9',
    borderRadius: 4,
  },
  fallbackVal: {
    width: 38,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
});
