import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';
import { SavedJourney, getSavedJourneys } from '@/services/journey-service';

import { request } from '@/services/api-client';

interface ShareJourneyModalProps {
  visible: boolean;
  onClose: () => void;
  onPostSuccess: () => void;
  userId?: string;
  userName?: string;
}

export default function ShareJourneyModal({
  visible,
  onClose,
  onPostSuccess,
  userId = 'guest',
}: ShareJourneyModalProps) {
  const [caption, setCaption] = useState('');
  const [journeys, setJourneys] = useState<SavedJourney[]>([]);
  const [selectedJourney, setSelectedJourney] = useState<SavedJourney | null>(null);
  const [loadingJourneys, setLoadingJourneys] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scope = React.useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    scope.current = controller;
    setSubmitting(false);
    if (visible) {
      setErrorMsg(null); setCaption(''); setJourneys([]); setSelectedJourney(null); setLoadingJourneys(true);
      getSavedJourneys(controller.signal).then((saved) => {
        if (controller.signal.aborted) return;
        const allowed = saved.filter((item) => item.is_public === true);
        setJourneys(allowed); setSelectedJourney(allowed[0] || null);
      }).catch((error) => {
        if (!controller.signal.aborted) setErrorMsg(error instanceof Error ? error.message : 'Không tải được thư viện.');
      }).finally(() => { if (!controller.signal.aborted) setLoadingJourneys(false); });
    }
    return () => controller.abort();
  }, [visible, userId]);

  const handleSubmit = async () => {
    const signal = scope.current?.signal;
    if (!signal || signal.aborted || submitting) return;
    if (!caption.trim() || !selectedJourney) {
      setErrorMsg('Viết lời chia sẻ và chọn journey đã cho phép chia sẻ.'); return;
    }
    setSubmitting(true); setErrorMsg(null);
    try {
      await request('/community/posts', { method: 'POST', signal,
        body: JSON.stringify({ caption: caption.trim(), journeyId: selectedJourney.id }) });
      if (!signal.aborted) { onPostSuccess(); onClose(); }
    } catch (error) {
      if (!signal.aborted) setErrorMsg(error instanceof Error ? error.message : 'Không đăng được bài.');
    } finally { if (!signal.aborted) setSubmitting(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="sparkles" size={18} color="#22D3EE" />
              <Text style={styles.headerTitle}>Chia sẻ Hành trình lên Cộng đồng</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={16} color={COLORS.muted} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Đăng bài sẽ chia sẻ tiêu đề, Mood, hoạt động, thời lượng và danh sách bài hát. Bài đã thu hồi cần được đăng lại bằng bài mới.</Text>
            <Text style={styles.inputLabel}>Cảm xúc & Câu chuyện của bạn:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Chia sẻ trải nghiệm nghe nhạc, thời điểm hoặc cách hành trình này giúp bạn cải thiện tâm trạng..."
              placeholderTextColor={COLORS.faint}
              multiline
              numberOfLines={4}
              value={caption}
              onChangeText={setCaption}
            />

            {/* Chọn hành trình đính kèm */}
            <Text style={[styles.inputLabel, { marginTop: 16 }]}>
              Chọn hành trình từ Thư viện của bạn ({journeys.length}):
            </Text>

            {loadingJourneys ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#22D3EE" />
                <Text style={styles.loadingText}>Đang tải danh sách hành trình của bạn...</Text>
              </View>
            ) : journeys.length === 0 ? (
              <View style={styles.emptyJourneyBox}>
                <Text style={styles.emptyJourneyText}>
                  Chưa có journey cho phép chia sẻ. Mở Journey hoặc Thư viện và đổi quyền trước khi đăng bài.
                </Text>
              </View>
            ) : (
              <View style={styles.journeySelectWrap}>
                {journeys.map((j) => {
                  const isSelected = selectedJourney?.id === j.id;
                  return (
                    <Pressable
                      key={j.id}
                      onPress={() => setSelectedJourney(j)}
                      style={[
                        styles.journeyOption,
                        isSelected && styles.journeyOptionSelected,
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.journeyOptTitle}>{j.title}</Text>
                        <Text style={styles.journeyOptMeta}>
                          ⏱️ {j.duration_minutes || 30} phút • 4 giai đoạn • {j.avg_bpm || 75} BPM
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleActive,
                        ]}
                      >
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {errorMsg ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Hủy bỏ</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={submitting || journeys.length === 0}
              style={[
                styles.submitBtn,
                (submitting || journeys.length === 0) && { opacity: 0.5 },
              ]}
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
                    <Icon name="share" size={14} color="#FFF" />
                    <Text style={styles.submitText}>Đăng lên Cộng đồng</Text>
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
    backgroundColor: 'rgba(7, 10, 18, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '88%',
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  scrollBody: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.muted,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    color: COLORS.text,
    fontSize: 14,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  loadingBox: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12.5,
    color: COLORS.muted,
  },
  emptyJourneyBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(251, 113, 133, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.25)',
  },
  emptyJourneyText: {
    color: '#FB7185',
    fontSize: 13,
    lineHeight: 18,
  },
  journeySelectWrap: {
    gap: 10,
    marginTop: 4,
  },
  journeyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
  },
  journeyOptionSelected: {
    borderColor: '#22D3EE',
    backgroundColor: 'rgba(34, 211, 238, 0.08)',
  },
  journeyOptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 3,
  },
  journeyOptMeta: {
    fontSize: 12,
    color: COLORS.faint,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.faint,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  radioCircleActive: {
    borderColor: '#22D3EE',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22D3EE',
  },
  errorBox: {
    marginTop: 14,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12.5,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
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
  submitBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  submitText: {
    fontSize: 13.5,
    color: '#FFF',
    fontWeight: '700',
  },
});
