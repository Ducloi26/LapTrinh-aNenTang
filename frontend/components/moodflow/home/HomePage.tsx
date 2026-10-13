import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS,
  MOODS,
  ACTIVITIES,
  DURATIONS,
  moodById,
} from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import GhostButton from '@/components/moodflow/shared/GhostButton';
import Icon from '@/components/moodflow/shared/Icon';
import MoodCard from '@/components/moodflow/home/MoodCard';
import ActivityCard from '@/components/moodflow/home/ActivityCard';
import JourneyLine from '@/components/moodflow/home/JourneyLine';

interface HomePageProps {
  state: {
    moodFrom: string;
    moodTo: string;
    activity: string;
    duration: number;
  };
  setState: React.Dispatch<
    React.SetStateAction<{
      moodFrom: string;
      moodTo: string;
      activity: string;
      duration: number;
    }>
  >;
  onCreateJourney: () => void;
  onOpenAI?: () => void;
  userName?: string;
}

export default function HomePage({
  state,
  setState,
  onCreateJourney,
  onOpenAI,
  userName,
}: HomePageProps) {
  const currentMood = moodById(state.moodFrom);
  const goalMood = moodById(state.moodTo);

  return (
    <View style={styles.container}>
      {/* Lời chào đầu trang */}
      <View style={styles.greetingBox}>
        <Text style={styles.greetingTitle}>
          Chào bạn, {userName || 'Lợi'} 👋
        </Text>
        <Text style={styles.greetingSub}>
          Hôm nay tâm trí bạn đang tìm kiếm giai điệu như thế nào?
        </Text>
      </View>

      {/* Thanh gọi nhanh Trợ lý AI Assistant */}
      {onOpenAI && (
        <Pressable onPress={onOpenAI} style={styles.aiQuickBox}>
          <LinearGradient
            colors={['rgba(99, 102, 241, 0.16)', 'rgba(236, 72, 153, 0.12)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiQuickGradient}
          >
            <View style={styles.aiQuickLeft}>
              <View style={styles.aiIconBadge}>
                <Icon name="sparkles" size={17} color="#67E8F9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiQuickTitle}>Trợ lý Âm nhạc Thông minh (MoodFlow AI)</Text>
                <Text style={styles.aiQuickSub} numberOfLines={1}>
                  Ví dụ: "Hôm nay deadline nhiều mệt mỏi", "Vừa chia tay cần tĩnh tâm"...
                </Text>
              </View>
            </View>
            <View style={styles.aiQuickBtn}>
              <Text style={styles.aiQuickBtnText}>Tâm sự ngay ✨</Text>
            </View>
          </LinearGradient>
        </Pressable>
      )}

      {/* 1. Chọn cảm xúc hiện tại */}
      <SectionTitle
        title="1. Tâm trạng hiện tại của bạn"
        subtitle="Chọn 1 trong 8 sắc thái cảm xúc phản ánh đúng nhất trạng thái lúc này"
      />
      <View style={styles.gridWrap}>
        {MOODS.map((m) => (
          <MoodCard
            key={m.id}
            mood={m}
            selected={state.moodFrom === m.id}
            onClick={() => setState((s) => ({ ...s, moodFrom: m.id }))}
          />
        ))}
      </View>

      {/* 2. Chọn ngữ cảnh hoạt động */}
      <SectionTitle
        title="2. Mục đích hoạt động"
        subtitle="Âm nhạc sẽ tự động tối ưu dải nhịp độ BPM và tiết tấu phù hợp với hoạt động"
      />
      <View style={styles.gridWrap}>
        {ACTIVITIES.map((a) => (
          <ActivityCard
            key={a.id}
            activity={a}
            selected={state.activity === a.id}
            onClick={() => setState((s) => ({ ...s, activity: a.id }))}
          />
        ))}
      </View>

      {/* 3. Chọn tâm trạng mục tiêu & xem trước đường cong */}
      <SectionTitle
        title="3. Cảm xúc mong muốn đạt tới"
        subtitle="Đường cong năng lượng xem trước quá trình chuyển tiếp từ từ qua 4 giai đoạn"
      />
      <View style={styles.journeyCardWrap}>
        <JourneyLine from={currentMood} to={goalMood} />
      </View>
      <View style={styles.ghostList}>
        {MOODS.filter((m) => m.id !== state.moodFrom).map((m) => (
          <GhostButton
            key={m.id}
            active={state.moodTo === m.id}
            onClick={() => setState((s) => ({ ...s, moodTo: m.id }))}
          >
            {m.emoji} {m.label}
          </GhostButton>
        ))}
      </View>

      {/* 4. Chọn thời lượng */}
      <SectionTitle
        title="4. Thời lượng hành trình"
        subtitle="Thời gian lộ trình dòng chảy âm nhạc phục hồi cảm xúc"
      />
      <View style={styles.durationRow}>
        {DURATIONS.map((d) => {
          const isSelected = state.duration === d.id;
          return (
            <Pressable
              key={d.id}
              onPress={() => setState((s) => ({ ...s, duration: d.id }))}
              style={[
                styles.durationBtn,
                !isSelected && styles.durationBtnNormal,
              ]}
            >
              {isSelected ? (
                <LinearGradient
                  colors={currentMood.colors}
                  style={styles.durationGradient}
                >
                  <Text style={styles.durationTextSelected}>{d.label}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.durationTextNormal}>{d.label}</Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Nút bấm kích hoạt tạo lộ trình */}
      <Pressable onPress={onCreateJourney} style={styles.ctaWrap}>
        <LinearGradient
          colors={goalMood.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Icon name="sparkles" size={20} color="#0A0D16" />
          <Text style={styles.ctaText}>Khởi tạo Hành trình Âm nhạc</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 880,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 60,
  },
  greetingBox: {
    marginBottom: 20,
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  greetingSub: {
    color: COLORS.muted,
    marginTop: 6,
    fontSize: 15,
  },
  aiQuickBox: {
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    marginBottom: 28,
  },
  aiQuickGradient: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  aiQuickLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  aiIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiQuickTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  aiQuickSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  aiQuickBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  aiQuickBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 30,
  },
  journeyCardWrap: {
    marginBottom: 14,
  },
  ghostList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 34,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 36,
  },
  durationBtn: {
    borderRadius: 13,
    overflow: 'hidden',
  },
  durationBtnNormal: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface2,
  },
  durationGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  durationTextNormal: {
    color: COLORS.text,
    fontSize: 13.5,
    fontWeight: '600',
  },
  durationTextSelected: {
    color: '#0A0D16',
    fontSize: 13.5,
    fontWeight: '800',
  },
  ctaWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  ctaGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaText: {
    color: '#0A0D16',
    fontWeight: '800',
    fontSize: 16.5,
  },
});
