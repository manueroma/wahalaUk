import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

// Generate height options from 140cm to 220cm
const heightOptions = Array.from({ length: 81 }, (_, i) => 140 + i);

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    age: '',
    gender: 'male',
    location_city: '',
    location_country: 'UK',
    height: '170',
    instagram: '',
    looking_for: 'see_where_it_goes',
    referral_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [referrerName, setReferrerName] = useState('');

  // Check for referral code from URL params
  useEffect(() => {
    if (params.ref) {
      setFormData(prev => ({ ...prev, referral_code: params.ref as string }));
      validateReferralCode(params.ref as string);
    }
  }, [params.ref]);

  const validateReferralCode = async (code: string) => {
    if (!code || code.length < 5) return;
    try {
      const response = await api.get(`/api/referral/validate/${code}`);
      if (response.data.valid) {
        setReferrerName(response.data.referrer_name);
      } else {
        setReferrerName('');
      }
    } catch (error) {
      setReferrerName('');
    }
  };

  const handleReferralCodeChange = (code: string) => {
    setFormData(prev => ({ ...prev, referral_code: code.toUpperCase() }));
    if (code.length >= 10) {
      validateReferralCode(code.toUpperCase());
    } else {
      setReferrerName('');
    }
  };

  const handleRegister = async () => {
    if (!formData.email || !formData.password || !formData.name || !formData.age || !formData.location_city || !formData.height) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (parseInt(formData.age) < 18) {
      Alert.alert('Error', 'You must be 18 or older to register');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/register', {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        location_city: formData.location_city,
        location_country: formData.location_country,
        height: `${formData.height} cm`,
        instagram: formData.instagram,
        looking_for: formData.looking_for,
        referred_by_code: formData.referral_code || null,
      });

      const { user, token, bonus_roses, referred_by } = response.data;
      await login(user, token);
      
      // Show welcome message with bonus roses if referred
      if (bonus_roses && bonus_roses > 0) {
        Alert.alert(
          '🎉 Welcome to WAHALA UK!',
          `Thanks for joining via ${referred_by}'s referral! You've received ${bonus_roses} free roses to get started! 🌹`,
          [{ text: 'Awesome!', onPress: () => router.replace('/profile/setup') }]
        );
      } else {
        router.replace('/profile/setup');
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={require('../../assets/images/wahala-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Join WAHALA UK</Text>
        <Text style={styles.subtitle}>Find serious relationships</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#999"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Age"
            placeholderTextColor="#999"
            value={formData.age}
            onChangeText={(text) => setFormData({ ...formData, age: text })}
            keyboardType="number-pad"
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.picker}>
              <Picker
                selectedValue={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="Other" value="other" />
              </Picker>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="City"
            placeholderTextColor="#999"
            value={formData.location_city}
            onChangeText={(text) => setFormData({ ...formData, location_city: text })}
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Country</Text>
            <View style={styles.picker}>
              <Picker
                selectedValue={formData.location_country}
                onValueChange={(value) => setFormData({ ...formData, location_country: value })}
              >
                <Picker.Item label="United Kingdom" value="UK" />
                <Picker.Item label="United States" value="US" />
                <Picker.Item label="Italy" value="Italy" />
              </Picker>
            </View>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Height (cm)</Text>
            <View style={styles.picker}>
              <Picker
                selectedValue={formData.height}
                onValueChange={(value) => setFormData({ ...formData, height: value })}
              >
                {heightOptions.map((h) => (
                  <Picker.Item key={h} label={`${h} cm`} value={h.toString()} />
                ))}
              </Picker>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Instagram (optional)"
            placeholderTextColor="#999"
            value={formData.instagram}
            onChangeText={(text) => setFormData({ ...formData, instagram: text })}
            autoCapitalize="none"
          />

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Looking For</Text>
            <View style={styles.picker}>
              <Picker
                selectedValue={formData.looking_for}
                onValueChange={(value) => setFormData({ ...formData, looking_for: value })}
              >
                <Picker.Item label="Fun / Casual Dating" value="fun" />
                <Picker.Item label="Dating to See Where It Goes" value="see_where_it_goes" />
                <Picker.Item label="Dating to Marry" value="marry" />
              </Picker>
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
          >
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.linkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 60,
  },
  logo: {
    width: 140,
    height: 140,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
  },
  pickerContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginLeft: 4,
  },
  picker: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
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
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#666',
    fontSize: 14,
  },
  linkBold: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
});