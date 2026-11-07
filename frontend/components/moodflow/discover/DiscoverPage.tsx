import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ActivityId, ACTIVITIES, COLORS, MOODS, MoodId } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import DiscoverCard from '@/components/moodflow/discover/DiscoverCard';
import Icon from '@/components/moodflow/shared/Icon';
import {
  calculateMatchScore,
  DiscoverJourney,
  formatCount,
  getPublicDiscoverJourneys,
} from '@/services/discover-service';
import { Journey } from '@/services/journey-generator';

interface DiscoverPageProps {
  preferredMoodId?: MoodId;
  preferredActivityId?: ActivityId;
  onSelectJourney?: (journey: Journey) => void;
}

function normalizeText(value: string): string {
  return value.toLocaleLowerCase('vi').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
}

export default function DiscoverPage({
  preferredMoodId,
  preferredActivityId,
  onSelectJourney,
}: DiscoverPageProps) {
  const [journeys, setJourneys] = React.useState<DiscoverJourney[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retry, setRetry] = React.useState(0);
  const [searchText, setSearchText] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [selectedActivity, setSelectedActivity] = React.useState<ActivityId | null>(null);
  const [selectedMood, setSelectedMood] = React.useState<MoodId | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  React.useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    getPublicDiscoverJourneys(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setJourneys(result);
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setJourneys([]);
          setError(failure instanceof Error ? failure.message : 'Không tải được dữ liệu khám phá.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [retry]);

  const filteredJourneys = React.useMemo(() => {
    const query = normalizeText(debouncedSearch);
    return journeys.filter((journey) => {
      if (selectedActivity && journey.activity !== selectedActivity) return false;
      if (selectedMood && journey.moodFrom !== selectedMood && journey.moodTo !== selectedMood) return false;
      if (!query) return true;

      const searchableText = normalizeText([
        journey.title,
        ...journey.tracks.flatMap((track) => [track.title, track.artist]),
      ].join(' '));
      return searchableText.includes(query);
    }).sort((left, right) =>
      calculateMatchScore(right, preferredMoodId, preferredActivityId)
      - calculateMatchScore(left, preferredMoodId, preferredActivityId),
    );
  }, [
    debouncedSearch,
    journeys,
    preferredActivityId,
    preferredMoodId,
    selectedActivity,
    selectedMood,
  ]);

  const hasFilters = !!debouncedSearch || !!selectedActivity || !!selectedMood;

  return (
    <View style={styles.container}>
      <SectionTitle
        title="Khám phá"
        subtitle="Tìm hành trình âm nhạc công khai phù hợp với tâm trạng và hoạt động của bạn."
      />

      <View style={styles.searchBox}>
        <Icon name="search" size={18} color={COLORS.muted} />
        <TextInput
          accessibilityLabel="Tìm hành trình, bài hát hoặc nghệ sĩ"
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Tìm lộ trình, bài hát, nghệ sĩ..."
          placeholderTextColor={COLORS.faint}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {!!searchText && (
          <Pressable onPress={() => setSearchText('')} accessibilityLabel="Xóa tìm kiếm">
            <Icon name="close" size={17} color={COLORS.muted} />
          </Pressable>
        )}
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Hoạt động</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <FilterChip label="Tất cả" selected={!selectedActivity} onPress={() => setSelectedActivity(null)} />
          {ACTIVITIES.map((activity) => (
            <FilterChip
              key={activity.id}
              label={activity.label}
              selected={selectedActivity === activity.id}
              onPress={() => setSelectedActivity(selectedActivity === activity.id ? null : activity.id)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Tâm trạng</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <FilterChip label="Tất cả" selected={!selectedMood} onPress={() => setSelectedMood(null)} />
          {MOODS.map((mood) => (
            <FilterChip
              key={mood.id}
              label={`${mood.emoji} ${mood.label}`}
              selected={selectedMood === mood.id}
              onPress={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="small" color="#22D3EE" />
          <Text style={styles.stateText}>Đang tải hành trình...</Text>
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => setRetry((value) => value + 1)} style={styles.retryButton}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : filteredJourneys.length === 0 ? (
        <View style={styles.stateBox}>
          <Icon name="compass" size={30} color={COLORS.faint} />
          <Text style={styles.emptyTitle}>
            {hasFilters ? 'Không tìm thấy hành trình phù hợp' : 'Chưa có hành trình công khai'}
          </Text>
          <Text style={styles.stateText}>
            {hasFilters
              ? 'Thử từ khóa khác hoặc thay đổi bộ lọc của bạn.'
              : 'Các hành trình được chia sẻ công khai sẽ xuất hiện tại đây.'}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.resultCount}>{filteredJourneys.length} hành trình</Text>
          <View style={styles.cardGrid}>
            {filteredJourneys.map((journey) => (
              <DiscoverCard
                key={journey.id}
                title={journey.title}
                creator={journey.creator}
                moodFrom={journey.moodFrom}
                moodTo={journey.moodTo}
                activityLabel={journey.activityLabel}
                durationMinutes={journey.durationMinutes}
                listenCount={formatCount(journey.listenCount)}
                matchScore={calculateMatchScore(
                  journey,
                  preferredMoodId,
                  preferredActivityId,
                )}
                cover={journey.journey.stages.flatMap((stage) => stage.tracks)[0]?.cover}
                onPress={() => onSelectJourney?.(journey.journey)}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: 980,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 60,
  },
  searchBox: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    backgroundColor: COLORS.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    paddingVertical: 11,
  },
  filterGroup: {
    marginBottom: 14,
  },
  filterLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  chipRow: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  chipSelected: {
    borderColor: '#22D3EE',
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
  },
  chipText: {
    color: COLORS.muted,
    fontSize: 12,
  },
  chipTextSelected: {
    color: COLORS.text,
    fontWeight: '700',
  },
  stateBox: {
    minHeight: 170,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    marginTop: 10,
  },
  stateText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: COLORS.surface2,
    borderRadius: 10,
  },
  retryText: {
    color: COLORS.ok,
    fontWeight: '700',
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultCount: {
    color: COLORS.faint,
    fontSize: 12,
    marginVertical: 10,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
});
