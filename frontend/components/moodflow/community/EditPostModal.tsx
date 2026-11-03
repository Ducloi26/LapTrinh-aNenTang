import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';

import { ApiError, request } from '@/services/api-client';

interface EditPostModalProps {
  visible: boolean;
  post: any | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
  onUnavailable: (message: string) => void;
}

export default function EditPostModal({
  visible,
  post,
  onClose,
  onUpdateSuccess,
  onUnavailable,
}: EditPostModalProps) {
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const scope = React.useRef<AbortController | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    scope.current = controller;
    setCaption(post?.caption || ''); setErrorMsg(null); setSubmitting(false);
    return () => controller.abort();
  }, [post, visible]);

  const handleUpdate = async () => {
    const signal = scope.current?.signal;
    if (!post || !signal || signal.aborted || submitting) return;
    if (!caption.trim()) { setErrorMsg('Nội dung bài viết không được để trống.'); return; }
    setSubmitting(true); setErrorMsg(null);
    try {
      await request('/community/posts/' + encodeURIComponent(post.id), {
        method: 'PUT', signal, body: JSON.stringify({ caption: caption.trim() }),
      });
      if (!signal.aborted) { onUpdateSuccess(); onClose(); }
    } catch (error) {
      if (signal.aborted) return;
      const message = error instanceof Error ? error.message : 'Không cập nhật được bài.';
      if (error instanceof ApiError && (error.status === 404 || error.status >= 500)) onUnavailable(message);
      else setErrorMsg(message);
    } finally { if (!signal.aborted) setSubmitting(false); }
  };

  if (!post) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="edit" size={17} color="#22D3EE" />
              <Text style={styles.headerTitle}>Chỉnh sửa bài viết</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={16} color={COLORS.muted} />
            </Pressable>
          </View>

          {/* Journey info info badge */}
          {post.journey && (
            <View style={styles.journeyBadge}>
              <Text style={styles.journeyBadgeText}>
                🎵 {post.journey.title}
              </Text>
            </View>
          )}

          {/* Caption Input */}
          <Text style={styles.inputLabel}>Nội dung bài viết:</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            value={caption}
            onChangeText={setCaption}
            placeholder="Cập nhật lời chia sẻ của bạn..."
            placeholderTextColor={COLORS.faint}
          />

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Hủy</Text>
            </Pressable>

            <Pressable
              onPress={handleUpdate}
              disabled={submitting}
              style={styles.saveBtn}
            >
              <LinearGradient
                colors={['#22D3EE', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveGradient}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Icon name="check" size={14} color="#FFF" />
                    <Text style={styles.saveText}>Lưu thay đổi</Text>
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
    maxWidth: 520,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
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
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  journeyBadgeText: {
    color: '#22D3EE',
    fontSize: 13,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12.5,
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  errorBox: {
    marginTop: 12,
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
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  cancelText: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '600',
  },
  saveBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 20,
  },
  saveText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '700',
  },
});
