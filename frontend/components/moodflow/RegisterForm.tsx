import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GradientColors } from '@/constants/moodflow';
import { validateRegister } from '@/utils/validation';
import Field from '@/components/moodflow/Field';
import PasswordStrength from '@/components/moodflow/PasswordStrength';
import { supabase } from '@/lib/supabase';

interface Props {
  moodColors: GradientColors;
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
}

export default function RegisterForm({ moodColors, onSwitchToLogin, onRegisterSuccess }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [authError, setAuthError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const errs = validateRegister({ name, email, password, confirm, agree });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setAuthError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: name } },
    });

    setLoading(false);
    if (error) {
      setAuthError(error.message === 'User already registered'
        ? 'Email này đã được đăng ký. Vui lòng đăng nhập.'
        : 'Không thể tạo tài khoản. Vui lòng thử lại.');
    } else {
      onRegisterSuccess();
    }
  };

  return (
    <View>
      <Text style={styles.subtitle}>TẠO TÀI KHOẢN</Text>
      <Text style={styles.title}>Bắt đầu hành trình của bạn</Text>

      <View style={styles.separator}>
        <View style={styles.line} />
        <Text style={styles.separatorText}>đăng ký bằng email</Text>
        <View style={styles.line} />
      </View>

      <Field
        label="Tên hiển thị"
        icon="👤"
        error={errors.name}
        inputProps={{
          placeholder: 'Ví dụ: Lợi',
          value: name,
          onChangeText: setName,
        }}
      />

      <Field
        label="Email"
        icon="✉️"
        error={errors.email}
        inputProps={{
          placeholder: 'ban@vidu.com',
          keyboardType: 'email-address',
          autoCapitalize: 'none',
          value: email,
          onChangeText: setEmail,
        }}
      />

      <Field
        label="Mật khẩu"
        icon="🔒"
        error={errors.password}
        inputProps={{
          placeholder: '••••••••',
          secureTextEntry: !showPassword,
          value: password,
          onChangeText: setPassword,
        }}
      />

      <PasswordStrength password={password} />

      <Field
        label="Xác nhận mật khẩu"
        icon="🔒"
        error={errors.confirm}
        inputProps={{
          placeholder: '••••••••',
          secureTextEntry: true,
          value: confirm,
          onChangeText: setConfirm,
        }}
      />

      <View style={styles.agreeRow}>
        <Pressable onPress={() => setAgree(!agree)}>
          {agree ? (
            <LinearGradient
              colors={moodColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.checkbox}
            >
              <Text style={styles.checkIcon}>✓</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.checkbox, styles.checkboxEmpty]} />
          )}
        </Pressable>
        <Text style={styles.agreeText}>
          Tôi đồng ý với{' '}
          <Text style={styles.agreeLink}>Điều khoản dịch vụ</Text> và{' '}
          <Text style={styles.agreeLink}>Chính sách quyền riêng tư</Text> của MoodFlow.
        </Text>
      </View>
      {errors.agree ? (
        <View style={styles.errorRow}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{errors.agree}</Text>
        </View>
      ) : null}

      {authError ? (
        <View style={styles.authErrorRow}>
          <Text style={styles.authErrorText}>⚠️  {authError}</Text>
        </View>
      ) : null}

      <Pressable onPress={handleSubmit} disabled={loading} style={{ marginTop: 16 }}>
        <LinearGradient
          colors={moodColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.submitBtn}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.bg} size="small" />
          ) : (
            <>
              <Text style={styles.submitIcon}>✨</Text>
              <Text style={styles.submitText}>Tạo tài khoản</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Đã có tài khoản? </Text>
        <Pressable onPress={onSwitchToLogin}>
          <Text style={styles.switchLink}>Đăng nhập</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.faint,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '400',
    color: COLORS.text,
    marginBottom: 28,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  separatorText: {
    fontSize: 11,
    color: COLORS.faint,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxEmpty: {
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
  },
  checkIcon: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.bg,
  },
  agreeText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
  },
  agreeLink: {
    color: COLORS.text,
    fontWeight: '700',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorIcon: {
    fontSize: 12,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
  },
  authErrorRow: {
    backgroundColor: 'rgba(251,113,133,0.12)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 10,
  },
  authErrorText: {
    color: COLORS.danger,
    fontSize: 13,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    paddingVertical: 15,
    borderRadius: 14,
  },
  submitIcon: {
    fontSize: 16,
  },
  submitText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.bg,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  switchText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  switchLink: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
});
