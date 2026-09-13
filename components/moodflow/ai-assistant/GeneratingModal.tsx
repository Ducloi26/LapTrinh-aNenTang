import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mood } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';

interface GeneratingModalProps {
  stepIndex: number;
  currentMood: Mood;
}

const STEPS = [
  'Đang thấu hiểu rung cảm hiện tại...',
  'Đối chiếu với Music DNA của bạn (R&B + Lo-fi)...',
  'Tìm kiếm các tần số âm nhạc phù hợp...',
  'Sắp đặt cấu trúc hành trình 4 giai đoạn...',
  'Hành trình âm nhạc của bạn đã sẵn sàng!',
];

export default function GeneratingModal({
  stepIndex,
  currentMood,
}: GeneratingModalProps) {
  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient
            colors={currentMood.colors}
            style={styles.circleIcon}
          >
            <Icon name="sparkles" size={32} color="#0A0D16" />
          </LinearGradient>

          <Text style={styles.title}>Đang kiến tạo Music Journey</Text>
          <Text style={styles.stepText}>{STEPS[stepIndex]}</Text>

          <View style={styles.dotsRow}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === stepIndex && styles.dotActive,
                  {
                    backgroundColor:
                      i <= stepIndex ? '#67E8F9' : 'rgba(255,255,255,0.15)',
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 18, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
  },
  circleIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: '#FFF',
    marginBottom: 12,
  },
  stepText: {
    color: '#67E8F9',
    fontSize: 14.5,
    fontWeight: '700',
    minHeight: 24,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  dot: {
    height: 7,
    width: 7,
    borderRadius: 999,
  },
  dotActive: {
    width: 22,
  },
});
