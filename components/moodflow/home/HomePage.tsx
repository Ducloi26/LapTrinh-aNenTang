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
  userName?: string;
}

export default function HomePage({
  state,
  setState,
  onCreateJourney,
  userName,
}: HomePageProps) {
  const currentMood = moodById(state.moodFrom);
  const goalMood = moodById(state.moodTo);

  return (
    <View style={styles.container}>
      {/* Greeting */}
      <View style={styles.greetingBox}>
        <Text style={styles.greetingTitle}>
          Chào buổi chiều, {userName || 'Lợi'} 👋
        </Text>
        <Text style={styles.greetingSub}>
          Hôm nay bạn muốn âm nhạc mang lại cảm giác gì?
        </Text>
      </View>

      {/* 1. Current Mood */}
      <SectionTitle title="Tâm trạng hiện tại của bạn" />
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

      {/* 2. Activity */}
      <SectionTitle title="Bạn đang làm gì?" />
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

      {/* 3. Goal Mood */}
      <SectionTitle title="Bạn muốn cảm thấy như thế nào?" />
      <View style={styles.journeyCard}>
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

      {/* 4. Duration */}
      <SectionTitle title="Bạn muốn nghe trong bao lâu?" />
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

      {/* Submit CTA */}
      <Pressable onPress={onCreateJourney} style={styles.ctaWrap}>
        <LinearGradient
          colors={goalMood.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Icon name="sparkles" size={20} color="#0A0D16" />
          <Text style={styles.ctaText}>Tạo Music Journey của tôi</Text>
        </LinearGradient>
      </Pressable>
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
  greetingBox: {
    marginBottom: 30,
  },
  greetingTitle: {
    fontSize: 34,
    fontWeight: '400',
    color: COLORS.text,
  },
  greetingSub: {
    color: COLORS.muted,
    marginTop: 8,
    fontSize: 15.5,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 34,
  },
  journeyCard: {
    backgroundColor: COLORS.surface2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  ghostList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 34,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 40,
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
  },
  durationGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  durationTextNormal: {
    color: COLORS.text,
    fontSize: 13.5,
    fontWeight: '700',
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
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
