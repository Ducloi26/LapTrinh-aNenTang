import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import DiscoverCard from '@/components/moodflow/discover/DiscoverCard';

const DISCOVER_SECTIONS = [
  {
    title: 'Vì bạn đang cảm thấy bình tĩnh',
    reason: 'Phù hợp với gu Indie + R&B của bạn.',
    moodId: 'calm',
  },
  {
    title: 'Hoàn hảo cho việc lập trình',
    reason: 'Năng lượng vừa phải, không lời, giúp giữ nhịp tập trung.',
    moodId: 'focus',
  },
  {
    title: 'Hành trình tiếp theo dành cho bạn',
    reason: 'Dựa trên hành trình bạn hoàn thành gần nhất.',
    moodId: 'dreamy',
  },
  {
    title: 'Những bài hát bạn có thể chưa biết',
    reason: 'Nằm ngoài gu quen thuộc nhưng gần với Music DNA của bạn.',
    moodId: 'romantic',
  },
  {
    title: 'Music Journey đang thịnh hành',
    reason: 'Được cộng đồng MoodFlow lưu nhiều nhất tuần này.',
    moodId: 'energetic',
  },
  {
    title: 'Người có Music DNA giống bạn',
    reason: '82% trùng khớp về thể loại và mood.',
    moodId: 'happy',
  },
];

export default function DiscoverPage() {
  return (
    <View style={styles.container}>
      <SectionTitle
        title="Khám phá"
        subtitle="Được chọn riêng theo Music DNA, tâm trạng và ngữ cảnh hiện tại của bạn."
      />

      {DISCOVER_SECTIONS.map((sec) => (
        <View key={sec.title} style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>{sec.title}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {[0, 1, 2].map((i) => (
              <DiscoverCard
                key={i}
                title={
                  i === 0
                    ? sec.title.split(' ').slice(0, 3).join(' ') + ` — Mix ${i + 1}`
                    : `Mix ${i + 1}`
                }
                reason={sec.reason}
                moodId={sec.moodId}
              />
            ))}
          </ScrollView>
        </View>
      ))}
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
  sectionWrap: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 6,
  },
});
