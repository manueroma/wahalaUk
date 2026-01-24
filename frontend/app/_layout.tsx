import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);

  useEffect(() => {
    loadAuth();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}