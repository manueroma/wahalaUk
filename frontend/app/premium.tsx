import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function PremiumScreen() {
  const router = useRouter();
  const { user, updateUser, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSubscribe = async (type: 'premium_monthly' | 'premium_yearly') => {
    setLoading(true);
    setSelectedPlan(type);
    
    try {
      const response = await api.post('/api/premium/subscribe', {
        payment_type: type,
      });

      if (response.data.payment_required && response.data.client_secret) {
        // Create Stripe checkout page URL
        const amount = type === 'premium_monthly' ? '9.99' : '89.99';
        const planName = type === 'premium_monthly' ? 'Monthly Premium' : 'Yearly Premium';
        
        // Show success for now (in production, you'd use Stripe's SDK or redirect)
        Alert.alert(
          'Payment Required',
          `${planName} subscription costs £${amount}.\n\nStripe payment integration is configured. In production, this would open the Stripe checkout.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Simulate Payment',
              onPress: () => simulateSuccessfulPayment(type),
            },
          ]
        );
      } else {
        // Payment not required (test mode or already premium)
        Alert.alert('Success', 'Premium activated!', [
          {
            text: 'OK',
            onPress: () => {
              updateUser({ is_premium: true });
              router.back();
            },
          },
        ]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to subscribe');
    } finally {
      setLoading(false);
    }
  };

  const simulateSuccessfulPayment = async (type: string) => {
    // This simulates a successful payment for testing
    try {
      setLoading(true);
      // In a real app, Stripe webhook would handle this
      // For now, we'll just update the user's premium status
      const response = await api.put('/api/profile/update', {
        is_premium: true,
      });
      
      updateUser({ is_premium: true });
      Alert.alert('🎉 Welcome to Premium!', 'Your subscription is now active. Enjoy unlimited swipes and all premium features!', [
        { text: 'Let\'s Go!', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to activate premium');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: 'infinite', text: 'Unlimited swipes (no daily limit)' },
    { icon: 'eye', text: 'See who liked you' },
    { icon: 'flash', text: 'Priority in discovery' },
    { icon: 'chatbubbles', text: 'Send unlimited messages' },
    { icon: 'rose', text: '5 free roses per month' },
    { icon: 'ribbon', text: 'Exclusive badge on profile' },
    { icon: 'options', text: 'Advanced filters' },
    { icon: 'videocam', text: 'Unlimited snap videos' },
  ];

  if (user?.is_premium) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.premiumActiveSection}>
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={60} color="#FFD700" />
          </View>
          <Text style={styles.premiumActiveTitle}>You're Premium! 🎉</Text>
          <Text style={styles.premiumActiveSubtitle}>
            Enjoy all the exclusive features
          </Text>
          
          <View style={styles.activeFeatures}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name={feature.icon as any} size={24} color="#FF6B6B" />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium</Text>
        <View style={styles.backButton} />
      </View>

      <View style={styles.heroSection}>
        <Ionicons name="star" size={80} color="#FFD700" />
        <Text style={styles.heroTitle}>Upgrade to Premium</Text>
        <Text style={styles.heroSubtitle}>
          Get the most out of WAHALA UK with exclusive features
        </Text>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Premium Features</Text>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.plansSection}>
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>

        <TouchableOpacity
          style={[styles.planCard, loading && selectedPlan === 'premium_monthly' && styles.planCardLoading]}
          onPress={() => handleSubscribe('premium_monthly')}
          disabled={loading}
        >
          <View style={styles.planHeader}>
            <Text style={styles.planName}>Monthly</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>£</Text>
              <Text style={styles.price}>9.99</Text>
              <Text style={styles.period}>/month</Text>
            </View>
          </View>
          <Text style={styles.planDescription}>Cancel anytime</Text>
          {loading && selectedPlan === 'premium_monthly' && (
            <ActivityIndicator style={styles.planLoader} color="#FF6B6B" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planCard, styles.popularPlan, loading && selectedPlan === 'premium_yearly' && styles.planCardLoading]}
          onPress={() => handleSubscribe('premium_yearly')}
          disabled={loading}
        >
          <View style={styles.popularBadge}>
            <Text style={styles.popularBadgeText}>BEST VALUE</Text>
          </View>
          <View style={styles.planHeader}>
            <Text style={styles.planName}>Yearly</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.currency}>£</Text>
              <Text style={styles.price}>89.99</Text>
              <Text style={styles.period}>/year</Text>
            </View>
          </View>
          <Text style={styles.planDescription}>
            Save £29.89 compared to monthly
          </Text>
          <Text style={styles.savingsText}>Only £7.50/month</Text>
          {loading && selectedPlan === 'premium_yearly' && (
            <ActivityIndicator style={styles.planLoader} color="#FF6B6B" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Subscriptions auto-renew. Cancel anytime in settings.
        </Text>
        <Text style={styles.footerText}>
          Annual subscriptions are non-refundable as per our Terms.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  heroSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    padding: 40,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  featuresSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  plansSection: {
    padding: 16,
    marginTop: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#EEE',
  },
  planCardLoading: {
    opacity: 0.7,
  },
  popularPlan: {
    borderColor: '#FF6B6B',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 24,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currency: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  period: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
  },
  savingsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 4,
  },
  planLoader: {
    marginTop: 12,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
  // Premium active styles
  premiumActiveSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    padding: 40,
  },
  premiumBadge: {
    backgroundColor: '#FFF9E6',
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
  },
  premiumActiveTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  premiumActiveSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  activeFeatures: {
    marginTop: 32,
    width: '100%',
  },
});