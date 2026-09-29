import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, moodById } from '@/constants/moodflow';


// Dữ liệu mà DiscoverCard nhận vào
interface DiscoverCardProps {
  title: string;          // Tên lộ trình
  category: string;       // Danh mục
  reason: string;         // Mô tả lộ trình
  moodId: string;         // Mood của lộ trình
  listens: number;        // Số lượt nghe
  emotionMatch: number;   // % tương thích cảm xúc
}


// Component hiển thị 1 lộ trình âm nhạc
export default function DiscoverCard({
  title,
  category,
  reason,
  moodId,
  listens,
  emotionMatch,
}: DiscoverCardProps) {

  // Lấy màu dựa vào moodId
  const m = moodById(moodId);

  return (
    <Pressable style={styles.card}>

      {/* Phần màu đại diện cho mood */}
      <LinearGradient
        colors={m.colors}
        style={styles.cardCover}
      />

      {/* Tên lộ trình */}
      <Text style={styles.title}>
        {title}
      </Text>

      {/* Danh mục */}
      <Text style={styles.category}>
        {category}
      </Text>

      {/* Mô tả */}
      <Text style={styles.reason}>
        {reason}
      </Text>

      {/* Thông tin lượt nghe và tương thích cảm xúc */}
      <View style={styles.stats}>

        <Text style={styles.stat}>
          🎧 {listens.toLocaleString()} lượt nghe
        </Text>

        <Text style={styles.stat}>
          ♥ {emotionMatch}% cảm xúc
        </Text>

      </View>

    </Pressable>
  );
}


const styles = StyleSheet.create({

  // Khung card
  card: {
    width: 250,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 18,
    marginRight: 14,
  },

  // Hình/gradient đại diện cho journey
  cardCover: {
    width: '100%',
    height: 88,
    borderRadius: 12,
    marginBottom: 14,
    opacity: 0.9,
  },

  // Tên journey
  title: {
    fontWeight: '800',
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 5,
  },

  // Danh mục
  category: {
    fontSize: 11,
    color: COLORS.muted,
    marginBottom: 7,
  },

  // Mô tả
  reason: {
    fontSize: 12,
    color: COLORS.faint,
    lineHeight: 18,
    marginBottom: 12,
  },

  // Khu vực thống kê
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // Lượt nghe + tương thích cảm xúc
  stat: {
    fontSize: 10.5,
    color: COLORS.muted,
  },
});