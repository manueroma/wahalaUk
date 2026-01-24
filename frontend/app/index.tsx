import { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        if (user.profile_complete) {
          router.replace('/(tabs)/discover');
        } else {
          router.replace('/profile/setup');
        }
      } else {
        router.replace('/auth/login');
      }
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/wahala-logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#FF6B6B" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 250,
  },
  loader: {
    marginTop: 20,
  },
});