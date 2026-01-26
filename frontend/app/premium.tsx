import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useInAppPurchases, PRODUCT_IDS } from '../hooks/useInAppPurchases';

export default function PremiumScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const {
    isReady,
    connected,
    purchasing,
    error,
    isWebPreview,
    purchaseProduct,
    restorePurchases,
    clearError,
  } = useInAppPurchases();

  const [restoring, setRestoring] = useState(false);

  // Show error alerts
  useEffect(() => {
    if (error) {
      Alert.alert('Notice', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error]);

  const handleSubscribe = async (productId: string) => {
    if (isWebPreview) {
      Alert.alert(
        '📱 Native App Required',
        'In-App Purchases are only available when you download the app from the App Store or Google Play.\n\nThis is a preview version.',
        [{ text: 'OK' }]
      );
      return;
    }

    const success = await purchaseProduct(productId);
    
    if (success) {
      updateUser({ is_premium: true });
      Alert.alert(
        '🎉 Welcome to Premium!',
        'Your subscription is now active. Enjoy unlimited swipes and all premium features!',
        [{ text: 'Awesome!', onPress: () => router.replace('/(tabs)/discover') }]
      );
    }
  };

  const handleRestorePurchases = async () => {
    if (isWebPreview) {
      Alert.alert(
        '📱 Native App Required',
        'Restore Purchases is only available in the native app.',
        [{ text: 'OK' }]
      );
      return;
    }

    setRestoring(true);
    try {
      const purchases = await restorePurchases();
      
      if (purchases && purchases.length > 0) {
        const hasActiveSubscription = purchases.some(
          (p: any) => p.productId?.includes('premium')
        );
        
        if (hasActiveSubscription) {
          updateUser({ is_premium: true });
          Alert.alert('Success', 'Your purchases have been restored!');
        } else {
          Alert.alert('No Active Subscriptions', 'No active subscriptions found to restore.');
        }
      } else {
        Alert.alert('No Purchases Found', 'No previous purchases found to restore.');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setRestoring(false);
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

  // Loading state
  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // Already premium
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

      {/* Web Preview Notice */}
      {isWebPreview && (
        <View style={styles.webNotice}>
          <Ionicons name="information-circle" size={24} color="#FF6B6B" />
          <Text style={styles.webNoticeText}>
            You're viewing the web preview. Download the app from the App Store or Google Play to subscribe.
          </Text>
        </View>
      )}

      {/* Payment Methods Badge */}
      <View style={styles.paymentMethodsSection}>
        <Text style={styles.paymentMethodsTitle}>Secure In-App Purchase</Text>
        <View style={styles.paymentIcons}>
          <View style={styles.paymentBadge}>
            <Ionicons name="logo-apple" size={20} color="#666" />
            <Text style={styles.paymentText}>App Store</Text>
          </View>
          <View style={styles.paymentBadge}>
            <Ionicons name="logo-google-playstore" size={20} color="#666" />
            <Text style={styles.paymentText}>Google Play</Text>
          </View>
        </View>
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

        {/* Monthly Plan */}
        <TouchableOpacity
          style={[
            styles.planCard, 
            purchasing === PRODUCT_IDS.PREMIUM_MONTHLY && styles.planCardLoading
          ]}
          onPress={() => handleSubscribe(PRODUCT_IDS.PREMIUM_MONTHLY)}
          disabled={!!purchasing}
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
          {purchasing === PRODUCT_IDS.PREMIUM_MONTHLY && (
            <ActivityIndicator style={styles.planLoader} color="#FF6B6B" />
          )}
        </TouchableOpacity>

        {/* Yearly Plan */}
        <TouchableOpacity
          style={[
            styles.planCard, 
            styles.popularPlan, 
            purchasing === PRODUCT_IDS.PREMIUM_YEARLY && styles.planCardLoading
          ]}
          onPress={() => handleSubscribe(PRODUCT_IDS.PREMIUM_YEARLY)}
          disabled={!!purchasing}
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
          {purchasing === PRODUCT_IDS.PREMIUM_YEARLY && (
            <ActivityIndicator style={styles.planLoader} color="#FF6B6B" />
          )}
        </TouchableOpacity>
      </View>

      {/* Restore Purchases */}
      <TouchableOpacity 
        style={styles.restoreButton}
        onPress={handleRestorePurchases}
        disabled={restoring}
      >
        {restoring ? (
          <ActivityIndicator size="small" color="#FF6B6B" />
        ) : (
          <Text style={styles.restoreButtonText}>Restore Purchases</Text>
        )}
      </TouchableOpacity>

      <View style={styles.footer}>
        <View style={styles.securePayment}>
          <Ionicons name="lock-closed" size={16} color="#4CAF50" />
          <Text style={styles.secureText}>Secured by Apple & Google</Text>
        </View>
        <Text style={styles.footerText}>
          Subscriptions auto-renew. Cancel anytime in your device settings.
        </Text>
        <Text style={styles.footerText}>
          Payment will be charged to your App Store or Google Play account.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  webNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  webNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  paymentMethodsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 2,
    padding: 16,
    alignItems: 'center',
  },
  paymentMethodsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  paymentIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  paymentText: {
    fontSize: 12,
    color: '#666',
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
  restoreButton: {
    alignItems: 'center',
    padding: 16,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  securePayment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  secureText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
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
