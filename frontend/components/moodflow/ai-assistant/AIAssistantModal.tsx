import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, Mood, moodById, ACTIVITIES } from '@/constants/moodflow';
import Icon from '@/components/moodflow/shared/Icon';
import { parsePrompt, AIParsedResult } from '@/services/ai-prompt-parser';
import { fmtMin } from '@/services/journey-generator';

interface AIAssistantModalProps {
  open: boolean;
  setOpen: (o: boolean) => void;
  applyFromAI: (parsed: AIParsedResult) => void;
  currentMood: Mood;
}

export default function AIAssistantModal({
  open,
  setOpen,
  applyFromAI,
  currentMood,
}: AIAssistantModalProps) {
  const [input, setInput] = useState('');
  const [parsed, setParsed] = useState<AIParsedResult | null>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    setParsed(parsePrompt(input));
  };

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          styles.floatingBtn,
          {
            shadowColor: currentMood.colors[0],
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.5,
            shadowRadius: 16,
          },
        ]}
      >
        <LinearGradient colors={currentMood.colors} style={styles.floatingGradient}>
          <Icon name="sparkles" size={21} color="#0A0D16" />
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <View style={styles.popover}>
      {/* Header */}
      <View style={styles.popoverHeader}>
        <View style={styles.popoverTitleRow}>
          <Icon name="sparkles" size={16} color="#67E8F9" />
          <Text style={styles.popoverTitle}>MoodFlow AI</Text>
        </View>
        <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
          <Icon name="close" size={16} color={COLORS.faint} />
        </Pressable>
      </View>

      {/* Body */}
      <View style={styles.popoverBody}>
        {!parsed ? (
          <Text style={styles.hintText}>
            Mô tả trạng thái của bạn, MoodFlow AI sẽ tự động gợi ý một Music
            Journey phù hợp.
          </Text>
        ) : (
          <View style={styles.resultList}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Mood hiện tại</Text>
              <Text style={styles.resultVal}>
                {moodById(parsed.mood).emoji} {moodById(parsed.mood).label}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Hoạt động</Text>
              <Text style={styles.resultVal}>
                {ACTIVITIES.find((a) => a.id === parsed.activity)?.label}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Mục tiêu</Text>
              <Text style={styles.resultVal}>
                {moodById(parsed.goal).emoji} {moodById(parsed.goal).label}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Thời lượng</Text>
              <Text style={styles.resultVal}>{fmtMin(parsed.duration)}</Text>
            </View>

            <Pressable
              onPress={() => {
                applyFromAI(parsed);
                setOpen(false);
                setParsed(null);
                setInput('');
              }}
              style={styles.applyBtnWrap}
            >
              <LinearGradient
                colors={moodById(parsed.goal).colors}
                style={styles.applyBtnGradient}
              >
                <Text style={styles.applyBtnText}>Tạo Music Journey</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </View>

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          placeholder="Tao đang mệt, cần học 2 tiếng..."
          placeholderTextColor={COLORS.faint}
          style={styles.input}
        />
        <Pressable onPress={handleSend} style={styles.sendBtn}>
          <Icon name="send" size={14} color="#FFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    right: 26,
    bottom: 104,
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    zIndex: 35,
  },
  floatingGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popover: {
    position: 'absolute',
    right: 26,
    bottom: 104,
    width: 340,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    zIndex: 35,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
  },
  popoverHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popoverTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popoverTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 4,
  },
  popoverBody: {
    padding: 16,
    minHeight: 120,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 20,
  },
  resultList: {
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultLabel: {
    fontSize: 13,
    color: COLORS.faint,
  },
  resultVal: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '600',
  },
  applyBtnWrap: {
    borderRadius: 11,
    overflow: 'hidden',
    marginTop: 8,
  },
  applyBtnGradient: {
    paddingVertical: 11,
    alignItems: 'center',
  },
  applyBtnText: {
    color: '#0A0D16',
    fontWeight: '800',
    fontSize: 13,
  },
  inputRow: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: COLORS.text,
    fontSize: 13,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
