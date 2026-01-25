import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

type Step = 'email' | 'code' | 'success';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/password-reset/request', { email });
      
      // For testing, show the code if returned (development only)
      if (response.data.reset_code_for_testing) {
        Alert.alert(
          'Reset Code Sent',
          `For testing, your code is: ${response.data.reset_code_for_testing}\n\nIn production, this would be sent to your email.`,
          [{ text: 'OK', onPress: () => setStep('code') }]
        );
      } else {
        Alert.alert('Success', response.data.message);
        setStep('code');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the reset code');
      return;
    }
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/password-reset/verify', {
        email,
        code,
        new_password: newPassword,
      });
      
      setStep('success');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const renderEmailStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="lock-closed-outline" size={80} color="#FF6B6B" />
      </View>
      
      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>
        No worries! Enter your email address and we'll send you a code to reset your password.
      </Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRequestReset}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Send Reset Code</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  const renderCodeStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="mail-open-outline" size={80} color="#FF6B6B" />
      </View>
      
      <Text style={styles.title}>Check Your Email</Text>
      <Text style={styles.subtitle}>
        We sent a 6-digit code to {email}. Enter the code and your new password below.
      </Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="6-Digit Reset Code"
          placeholderTextColor="#999"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="New Password"
            placeholderTextColor="#999"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Confirm New Password"
          placeholderTextColor="#999"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleRequestReset}
          disabled={loading}
        >
          <Text style={styles.resendText}>Didn't receive the code? Resend</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSuccessStep = () => (
    <>
      <View style={styles.iconContainer}>
        <Ionicons name="checkmark-circle" size={100} color="#4CAF50" />
      </View>
      
      <Text style={styles.title}>Password Reset!</Text>
      <Text style={styles.subtitle}>
        Your password has been successfully reset. You can now log in with your new password.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/auth/login')}
      >
        <Text style={styles.buttonText}>Go to Login</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (step === 'code') {
              setStep('email');
            } else {
              router.back();
            }
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        {step === 'email' && renderEmailStep()}
        {step === 'code' && renderCodeStep()}
        {step === 'success' && renderSuccessStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  eyeButton: {
    padding: 16,
  },
  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  resendText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
});
