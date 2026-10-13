import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS } from '@/constants/moodflow';
import { useMoodCycle } from '@/hooks/use-mood-cycle';
import BrandPanel from '@/components/moodflow/BrandPanel';
import ModeSwitcher from '@/components/moodflow/ModeSwitcher';
import LoginForm from '@/components/moodflow/LoginForm';
import RegisterForm from '@/components/moodflow/RegisterForm';
import AuthSuccess from '@/components/moodflow/AuthSuccess';

import { router } from 'expo-router';

interface AuthScreenProps {
  onAuthSuccess?: (name?: string) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const { index: moodIndex, mood } = useMoodCycle();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [status, setStatus] = useState<'idle' | 'success'>('idle');
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const handleSwitch = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setStatus('idle');
  };

  const handleDismiss = () => {
    if (onAuthSuccess) {
      onAuthSuccess('Lợi');
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.root}>
      {isWide && <BrandPanel moodIndex={moodIndex} />}

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formBox}>
          {status === 'success' ? (
            <AuthSuccess
              isLogin={mode === 'login'}
              moodColors={mood.colors}
              onDismiss={handleDismiss}
            />
          ) : (
            <>
              <ModeSwitcher
                mode={mode}
                moodColors={mood.colors}
                onSwitch={handleSwitch}
              />

              {mode === 'login' ? (
                <LoginForm
                  moodColors={mood.colors}
                  onSwitchToRegister={() => handleSwitch('register')}
                  onLoginSuccess={() => setStatus('success')}
                />
              ) : (
                <RegisterForm
                  moodColors={mood.colors}
                  onSwitchToLogin={() => handleSwitch('login')}
                  onRegisterSuccess={() => setStatus('success')}
                />
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.bg,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 32,
  },
  formBox: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
});
