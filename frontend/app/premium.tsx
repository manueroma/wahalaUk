import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function PremiumScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const handleSubscribe = async (type: 'premium_monthly' | 'premium_yearly') => {
    try {
      const response = await api.post('/api/premium/subscribe', {
        payment_type: type,
      });

      if (!response.data.payment_required) {
        // Test mode
        Alert.alert('Success', 'Premium activated!', [
          {
            text: 'OK',
            onPress: () => {
              updateUser({ premium_status: 'premium' });
              router.back();
            },
          },
        ]);
      } else {
        // Stripe payment would be handled here
        Alert.alert('Payment', 'Stripe payment integration pending');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe');
    }
  };

  const features = [
    'Unlimited swipes (no daily limit)',
    'See who liked you',
    'Priority in discovery',
    'Send unlimited messages',
    '5 free roses per month',
    'Exclusive badge on profile',
    'Advanced filters',
    'No ads',
  ];

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
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <View style={styles.plansSection}>
        <Text style={styles.sectionTitle}>Choose Your Plan</Text>

        <TouchableOpacity
          style={styles.planCard}
          onPress={() => handleSubscribe('premium_monthly')}
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
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planCard, styles.popularPlan]}
          onPress={() => handleSubscribe('premium_yearly')}
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
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Subscriptions auto-renew. Cancel anytime in settings.
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
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});