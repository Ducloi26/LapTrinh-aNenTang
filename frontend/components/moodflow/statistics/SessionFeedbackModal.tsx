import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, MOODS, moodById } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';

interface SessionFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  onFeedbackSubmitted?: () => void;
  userId?: string;
  journey?: any;
}

export default function SessionFeedbackModal({
  visible,
  onClose,
  onFeedbackSubmitted,
  userId = 'guest',
  journey,
}: SessionFeedbackModalProps) {
  const [selectedMoodAfter, setSelectedMoodAfter] = useState<string>('calm_unwind');
  const [rating, setRating] = useState<number>(5);
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const moodBefore = journey?.mood_from || 'anxious';
  const beforeMoodObj = moodById(moodBefore);

  const ratingDescriptions: { [key: number]: string } = {
    1: 'Chưa thấy chuyển biến rõ rệt',
    2: 'Hơi êm dịu hơn lúc bắt đầu',
    3: 'Tâm trí thoải mái, dễ chịu hơn',
    4: 'Rất thư thái và giải tỏa căng thẳng',
    5: 'Tuyệt vời! Hoàn toàn hồi phục & bình an',
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          journeyId: journey?.id || null,
          journeyTitle: journey?.title || 'Hành trình trị liệu cá nhân',
          moodBefore: moodBefore,
          moodAfter: selectedMoodAfter,
          rating,
          feedbackNote: feedbackNote.trim(),
          durationMinutes: journey?.duration_minutes || 30,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg('✨ Đã lưu đánh giá thành công! Số liệu thống kê đã được cập nhật.');
        setTimeout(() => {
          setSuccessMsg(null);
          setFeedbackNote('');
          if (onFeedbackSubmitted) onFeedbackSubmitted();
          onClose();
        }, 1200);
      } else {
        setErrorMsg(data.error || 'Có lỗi xảy ra khi lưu đánh giá.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerIcon}>🧘</Text>
              <View>
                <Text style={styles.headerTitle}>Đánh giá Phiên Trị liệu</Text>
                <Text style={styles.headerSubtitle}>
                  Khảo sát cảm xúc giúp tối ưu hóa thuật toán âm nhạc cho bạn
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Icon name="close" size={16} color={COLORS.muted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 520 }}>
            {/* Journey Meta Badge */}
            {journey && (
              <View style={styles.journeyBadge}>
                <Text style={styles.journeyBadgeTitle}>🎵 {journey.title || 'Hành trình vừa nghe'}</Text>
                <Text style={styles.journeyBadgeSub}>
                  Thời lượng: {journey.duration_minutes || 30} phút · Nhịp trống: {journey.avg_bpm || 75} BPM
                </Text>
                {beforeMoodObj && (
                  <Text style={styles.moodBeforeTag}>
                    Tâm trạng trước khi nghe: {beforeMoodObj.emoji} {beforeMoodObj.label}
                  </Text>
                )}
              </View>
            )}

            {/* Step 1: Chọn tâm trạng sau khi nghe */}
            <Text style={styles.sectionLabel}>1. Tâm trạng của bạn sau khi nghe thế nào?</Text>
            <View style={styles.moodGrid}>
              {MOODS.map((m) => {
                const isSelected = selectedMoodAfter === m.id;
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => setSelectedMoodAfter(m.id)}
                    style={[
                      styles.moodItem,
                      isSelected && styles.moodItemSelected,
                    ]}
                  >
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.moodName,
                        isSelected && styles.moodNameSelected,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Step 2: Đánh giá sao */}
            <Text style={styles.sectionLabel}>2. Mức độ hiệu quả của danh sách nhạc vừa rồi?</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starBtn}
                >
                  <Text style={[styles.starIcon, rating >= star && styles.starIconActive]}>
                    ⭐
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.ratingHint}>
              {ratingDescriptions[rating] || ''}
            </Text>

            {/* Step 3: Cảm nhận ngắn */}
            <Text style={styles.sectionLabel}>3. Chia sẻ cảm nhận nhanh (Tùy chọn):</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={3}
              value={feedbackNote}
              onChangeText={setFeedbackNote}
              placeholder="Ví dụ: Giai đoạn 3 nâng đỡ tinh thần rất tốt, nhịp tim mình ổn định hơn..."
              placeholderTextColor={COLORS.faint}
            />

            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {successMsg && (
              <View style={styles.successBox}>
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Để sau</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={styles.submitBtnWrap}
            >
              <LinearGradient
                colors={['#22D3EE', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Icon name="check" size={14} color="#FFF" />
                    <Text style={styles.submitText}>Gửi đánh giá & Lưu thống kê</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 10, 18, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.7,
    shadowRadius: 36,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.faint,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  journeyBadge: {
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.25)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  journeyBadgeTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#22D3EE',
  },
  journeyBadgeSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 3,
  },
  moodBeforeTag: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '600',
    marginTop: 5,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
    marginTop: 6,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  moodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    minWidth: '47%',
    flex: 1,
  },
  moodItemSelected: {
    borderColor: '#22D3EE',
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodName: {
    fontSize: 12,
    color: COLORS.muted,
    fontWeight: '600',
    flex: 1,
  },
  moodNameSelected: {
    color: '#22D3EE',
    fontWeight: '700',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  starBtn: {
    padding: 4,
  },
  starIcon: {
    fontSize: 26,
    opacity: 0.3,
  },
  starIconActive: {
    opacity: 1,
  },
  ratingHint: {
    fontSize: 12,
    color: '#FBBF24',
    fontStyle: 'italic',
    marginBottom: 14,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  errorBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  successBox: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 211, 238, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.3)',
    marginBottom: 12,
  },
  successText: {
    color: '#22D3EE',
    fontSize: 12.5,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelText: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
  },
  submitBtnWrap: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  submitText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '700',
  },
});
