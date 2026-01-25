import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { updateUser } = useAuthStore();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const sessionId = params.session_id as string;
    const paymentType = params.type as string;

    if (!sessionId) {
      setStatus('error');
      setMessage('Invalid payment session');
      setTimeout(() => router.replace('/premium'), 3000);
      return;
    }

    try {
      const response = await api.post('/api/payment/verify-session', {
        session_id: sessionId,
      });

      if (response.data.success) {
        setStatus('success');
        
        if (paymentType?.includes('premium')) {
          updateUser({ is_premium: true });
          setMessage('Welcome to WAHALA UK Premium! 🎉');
        } else if (paymentType === 'rose') {
          setMessage('Rose sent successfully! 🌹');
        } else if (paymentType === 'instant_chat') {
          setMessage('Chat unlocked! Start chatting now! 💬');
        } else if (paymentType === 'donation') {
          setMessage('Thank you for your generous donation! ❤️');
        } else {
          setMessage('Payment successful!');
        }

        // Redirect after showing success
        setTimeout(() => {
          if (paymentType?.includes('premium')) {
            router.replace('/(tabs)/discover');
          } else {
            router.back();
          }
        }, 3000);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.detail || 'Payment verification failed');
      setTimeout(() => router.replace('/premium'), 3000);
    }
  };

  return (
    <View style={styles.container}>
      {status === 'verifying' && (
        <>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.message}>{message}</Text>
        </>
      )}

      {status === 'success' && (
        <>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          </View>
          <Text style={styles.successTitle}>Payment Successful!</Text>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.redirect}>Redirecting you shortly...</Text>
        </>
      )}

      {status === 'error' && (
        <>
          <View style={styles.errorIcon}>
            <Ionicons name="close-circle" size={80} color="#FF6B6B" />
          </View>
          <Text style={styles.errorTitle}>Payment Issue</Text>
          <Text style={styles.message}>{message}</Text>
          <Text style={styles.redirect}>Redirecting you back...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 32,
  },
  successIcon: {
    marginBottom: 24,
  },
  errorIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 16,
  },
  message: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 26,
  },
  redirect: {
    fontSize: 14,
    color: '#999',
    marginTop: 24,
  },
});
