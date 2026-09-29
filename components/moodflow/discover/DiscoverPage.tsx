import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable, //bấm 
} from 'react-native';

import { COLORS } from '@/constants/moodflow';
import SectionTitle from '@/components/moodflow/shared/SectionTitle';
import DiscoverCard from '@/components/moodflow/discover/DiscoverCard';


// ===============================
// DỮ LIỆU MUSIC JOURNEY
// ===============================

const MUSIC_JOURNEYS = [
  {
    title: 'Rainy Afternoon',
    category: 'Relax',
    reason: 'Những giai điệu nhẹ nhàng cho một buổi chiều mưa.',
    moodId: 'calm',
    listens: 12580,
    emotionMatch: 92,
  },

  {
    title: 'Cyberpunk Coding',
    category: 'Coding',
    reason: 'Nhịp điện tử mạnh vừa đủ để duy trì sự tập trung khi lập trình.',
    moodId: 'focus',
    listens: 18340,
    emotionMatch: 89,
  },

  {
    title: 'Deep Sleep 432Hz',
    category: 'Sleep',
    reason: 'Âm thanh nhẹ nhàng giúp thư giãn trước khi ngủ.',
    moodId: 'dreamy',
    listens: 24680,
    emotionMatch: 95,
  },

  {
    title: 'Morning Energy',
    category: 'Energy',
    reason: 'Âm nhạc tích cực giúp bắt đầu ngày mới đầy năng lượng.',
    moodId: 'energetic',
    listens: 15420,
    emotionMatch: 87,
  },

  {
    title: 'Romantic Evening',
    category: 'Romantic',
    reason: 'Giai điệu ấm áp dành cho những khoảnh khắc thư giãn.',
    moodId: 'romantic',
    listens: 9870,
    emotionMatch: 91,
  },

  {
    title: 'Focus Flow',
    category: 'Focus',
    reason: 'Nhạc nền tối giản giúp duy trì trạng thái tập trung.',
    moodId: 'focus',
    listens: 21750,
    emotionMatch: 94,
  },
];


// Các danh mục dùng để lọc
const CATEGORIES = [
  'Tất cả',
  'Coding',
  'Sleep',
  'Relax',
  'Focus',
  'Energy',
  'Romantic',
];


export default function DiscoverPage() {

  // Từ khóa người dùng nhập vào ô tìm kiếm
  const [searchText, setSearchText] = useState('');

  // Danh mục đang được chọn
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');


  // ===============================
  // LỌC MUSIC JOURNEY
  // ===============================

  const filteredJourneys = MUSIC_JOURNEYS.filter((journey) => {

    // Kiểm tra danh mục
    const matchCategory =
      selectedCategory === 'Tất cả' ||
      journey.category === selectedCategory;

    // Kiểm tra từ khóa
    const matchSearch =
      journey.title
        .toLowerCase()
        .includes(searchText.toLowerCase());

    // Phải thỏa cả 2 điều kiện
    return matchCategory && matchSearch;
  });


  return (
    <View style={styles.container}>

      {/* ===============================
          TIÊU ĐỀ
      =============================== */}

      <SectionTitle
        title="Khám phá"
        subtitle="Khám phá những lộ trình âm nhạc được chuyên gia tuyển chọn."
      />


      {/* ===============================
          Ô TÌM KIẾM
      =============================== */}

      <TextInput
        style={styles.searchInput}
        placeholder="Tìm kiếm lộ trình âm nhạc..."
        placeholderTextColor={COLORS.faint}
        value={searchText}
        onChangeText={setSearchText}
      />


      {/* ===============================
          DANH MỤC
      =============================== */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      >

        {CATEGORIES.map((category) => (

          <Pressable
            key={category}
            style={[
              styles.categoryButton,

              selectedCategory === category &&
                styles.categoryButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >

            <Text
              style={[
                styles.categoryText,

                selectedCategory === category &&
                  styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>

          </Pressable>

        ))}

      </ScrollView>


      {/* ===============================
          DANH SÁCH LỘ TRÌNH
      =============================== */}

      <Text style={styles.sectionTitle}>
        Lộ trình âm nhạc thịnh hành
      </Text>


      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.journeyList}
      >

        {filteredJourneys.map((journey) => (

          <DiscoverCard
            key={journey.title}

            title={journey.title}

            category={journey.category}

            reason={journey.reason}

            moodId={journey.moodId}

            listens={journey.listens}

            emotionMatch={journey.emotionMatch}
          />

        ))}

      </ScrollView>


      {/* Không tìm thấy kết quả */}
      {filteredJourneys.length === 0 && (
        <Text style={styles.emptyText}>
          Không tìm thấy lộ trình phù hợp.
        </Text>
      )}

    </View>
  );
}


// ===============================
// CSS
// ===============================

const styles = StyleSheet.create({

  // Khung chính
  container: {
    maxWidth: 980,
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 60,
  },

  // Ô tìm kiếm
  searchInput: {
    height: 46,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface2,
    color: COLORS.text,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 14,
  },

  // Danh sách danh mục
  categoryList: {
    paddingBottom: 20,
  },

  // Nút danh mục
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },

  // Nút danh mục đang được chọn
  categoryButtonActive: {
    backgroundColor: COLORS.surface2,
    borderColor: COLORS.text,
  },

  // Chữ danh mục
  categoryText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  // Chữ danh mục đang chọn
  categoryTextActive: {
    color: COLORS.text,
    fontWeight: '700',
  },

  // Tiêu đề danh sách
  sectionTitle: {
    fontSize: 18,
    color: COLORS.text,
    marginBottom: 12,
    fontWeight: '600',
  },

  // Danh sách journey
  journeyList: {
    paddingBottom: 10,
  },

  // Khi không có kết quả
  emptyText: {
    color: COLORS.faint,
    fontSize: 13,
    marginTop: 10,
  },
});