import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  FlatList,
  SectionList,
} from 'react-native';

const LESSONS_DATA = [
  {
    id: '1',
    category: 'Cơ bản',
    title: 'Bài 1: Giới thiệu React Native & Flexbox',
    description: 'Tìm hiểu cơ chế dàn trang Flexbox trên di động.',
    duration: '45 phút',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSvmp94FzrW5Z4u80BGWOthRSTXSCP0kYCdyfOBiZeai9Pxx2e7grWGmuOP&s=10',
  },
  {
    id: '2',
    category: 'Component',
    title: 'Bài 2: Component View, Text, Image & Pressable',
    description: 'Các thành phần hiển thị và tương tác cơ bản.',
    duration: '60 phút',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnhx7KBpxnPWpxxgp3akKQScRjDkoHA7UOrIWcMCWRjQ&s',
  },
  {
    id: '3',
    category: 'Nâng cao',
    title: 'Bài 3: Cuộn nội dung với ScrollView & FlatList',
    description: 'Kỹ thuật cuộn trang và tối ưu hiệu năng danh sách.',
    duration: '50 phút',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_BomUNs5nzywKD2jiWqfKygoOk822wTIa9cF9wBsNZw&s=10',
  },
  {
    id: '4',
    category: 'Cấu trúc',
    title: 'Bài 4: Phân nhóm dữ liệu với SectionList',
    description: 'Hiển thị dữ liệu theo từng nhóm / danh mục có tiêu đề.',
    duration: '40 phút',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuYZMlLXtyxiOxwAPWkTNAvli-fBsr4RhD2vMt_Db5Ng&s=10',
  },
];

const ACTIVITIES_DATA = [
  {
    title: 'Hôm nay',
    data: [
      { id: 'act1', content: 'Nộp bài tập thực hành Flexbox', time: '08:30' },
      { id: 'act2', content: 'Điểm danh lớp Lập trình đa nền tảng', time: '13:30' },
    ],
  },
  {
    title: 'Tuần này',
    data: [
      { id: 'act3', content: 'Thuyết trình đề tài kết thúc môn', time: 'Thứ 6' },
    ],
  },
];

export default function HomeScreen() {
  const handlePressAction = (name: string) => {
    alert(`Bạn vừa nhấn: ${name}`);
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
              style={styles.avatar}
            />
            <View>
              <Text style={styles.greetingText}>Xin chào 👋</Text>
              <Text style={styles.userName}>Sinh viên K23</Text>
            </View>
          </View>

          <Pressable
            style={styles.notificationBtn}
            onPress={() => handlePressAction('Thông báo')}
          >
            <Text style={styles.iconText}>🔔</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Lập trình Đa nền tảng</Text>
          <Text style={styles.heroDescription}>
            Thực hành bố cục giao diện sử dụng Flexbox, FlatList và SectionList.
          </Text>

          <Image
            source={{ uri: 'https://reactnative.dev/img/tiny_logo.png' }}
            style={styles.heroImage}
          />

          <Pressable
            style={styles.heroBtn}
            onPress={() => handlePressAction('Bắt đầu học ngay')}
          >
            <Text style={styles.heroBtnText}>Bắt đầu học ngay</Text>
          </Pressable>
        </View>

        <View style={styles.actionRow}>
          <Pressable
            style={styles.actionBtn}
            onPress={() => handlePressAction('Lịch học')}
          >
            <Text style={styles.actionBtnText}>📅 Lịch học</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => handlePressAction('Điểm số')}
          >
            <Text style={styles.actionBtnText}>📊 Điểm số</Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => handlePressAction('Tài liệu')}
          >
            <Text style={styles.actionBtnText}>📁 Tài liệu</Text>
          </Pressable>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Danh sách bài học (FlatList)</Text>

          <FlatList
            data={LESSONS_DATA}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.cardItem}>
                <Image source={{ uri: item.image }} style={styles.cardImage} />

                <View style={styles.cardBody}>
                  <Text style={styles.cardCategory}>{item.category}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardDescription}>{item.description}</Text>
                  <Text style={styles.cardDuration}>⏱ Thời lượng: {item.duration}</Text>

                  <Pressable
                    style={styles.cardBtn}
                    onPress={() => handlePressAction(item.title)}
                  >
                    <Text style={styles.cardBtnText}>Xem bài học</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Hoạt động theo ngày (SectionList)</Text>

          <SectionList
            sections={ACTIVITIES_DATA}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>📌 {title}</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={styles.activityItem}>
                <Text style={styles.activityContent}>{item.content}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            )}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eee',
  },
  greetingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  notificationBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  heroCard: {
    backgroundColor: '#2563eb',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroDescription: {
    fontSize: 13,
    color: '#dbeafe',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 18,
  },
  heroImage: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  heroBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  heroBtnText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 14,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  cardItem: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  cardBody: {
    flex: 1,
  },
  cardCategory: {
    fontSize: 11,
    color: '#2563eb',
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 3,
  },
  cardDescription: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 4,
  },
  cardDuration: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 6,
  },
  cardBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  cardBtnText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
  sectionHeader: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginTop: 6,
    marginBottom: 6,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
  },
  activityItem: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  activityContent: {
    fontSize: 13,
    color: '#333',
  },
  activityTime: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '600',
  },
});
