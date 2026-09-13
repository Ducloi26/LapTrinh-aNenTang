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
import { validateLogin } from '@/utils/validation';
import Field from '@/components/moodflow/Field';

interface Props {
  moodColors: GradientColors;
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void;
}

export default function LoginForm({ moodColors, onSwitchToRegister, onLoginSuccess }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    const errs = validateLogin({ email, password });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess();
    }, 1100);
  };

  return (
    <View>
      <Text style={styles.subtitle}>ĐĂNG NHẬP</Text>
      <Text style={styles.title}>Tiếp tục hành trình của bạn</Text>

      <View style={styles.separator}>
        <View style={styles.line} />
        <Text style={styles.separatorText}>đăng nhập bằng email</Text>
        <View style={styles.line} />
      </View>

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

      <View style={styles.forgotRow}>
        <Pressable>
          <Text style={styles.forgotText}>Quên mật khẩu?</Text>
        </Pressable>
      </View>

      <Pressable onPress={handleSubmit} disabled={loading}>
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
              <Text style={styles.submitText}>Đăng nhập</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      <View style={styles.switchRow}>
        <Text style={styles.switchText}>Chưa có tài khoản? </Text>
        <Pressable onPress={onSwitchToRegister}>
          <Text style={styles.switchLink}>Đăng ký ngay</Text>
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
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 22,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 12,
    color: COLORS.muted,
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
