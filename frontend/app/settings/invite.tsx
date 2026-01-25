import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
  Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function InviteFriendsScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [referralData, setReferralData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const [codeResponse, statsResponse] = await Promise.all([
        api.get('/api/referral/my-code'),
        api.get('/api/referral/stats'),
      ]);
      setReferralData(codeResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (referralData?.referral_code) {
      Clipboard.setString(referralData.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyLink = () => {
    if (referralData?.referral_link) {
      Clipboard.setString(referralData.referral_link);
      Alert.alert('Copied!', 'Referral link copied to clipboard');
    }
  };

  const shareGeneric = async () => {
    try {
      await Share.share({
        message: referralData?.share_message || '',
        title: 'Join WAHALA UK',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const shareVia = async (platform: string) => {
    const message = encodeURIComponent(referralData?.share_message || '');
    const url = encodeURIComponent(referralData?.referral_link || '');
    
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `whatsapp://send?text=${message}`;
        break;
      case 'sms':
        shareUrl = `sms:?body=${message}`;
        break;
      case 'twitter':
        shareUrl = `twitter://post?message=${message}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct text sharing, copy to clipboard instead
        Clipboard.setString(referralData?.share_message || '');
        Alert.alert(
          'Share on Instagram',
          'Your referral message has been copied! Open Instagram and paste it in your story or DMs.',
          [{ text: 'Open Instagram', onPress: () => Linking.openURL('instagram://') }]
        );
        return;
      default:
        shareGeneric();
        return;
    }
    
    try {
      const canOpen = await Linking.canOpenURL(shareUrl);
      if (canOpen) {
        await Linking.openURL(shareUrl);
      } else {
        shareGeneric();
      }
    } catch (error) {
      shareGeneric();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Friends</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="gift" size={60} color="#FF6B6B" />
          </View>
          <Text style={styles.heroTitle}>Earn 20 Roses 🌹</Text>
          <Text style={styles.heroSubtitle}>
            For every friend who joins WAHALA UK using your code
          </Text>
        </View>

        {/* Referral Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{referralData?.referral_code}</Text>
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyButton}>
              <Ionicons 
                name={copied ? "checkmark" : "copy"} 
                size={20} 
                color={copied ? "#4CAF50" : "#FF6B6B"} 
              />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={copyLink} style={styles.linkButton}>
            <Ionicons name="link" size={18} color="#666" />
            <Text style={styles.linkText} numberOfLines={1}>
              {referralData?.referral_link}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Share Buttons */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>Share Via</Text>
          <View style={styles.shareButtons}>
            <TouchableOpacity 
              style={[styles.shareButton, styles.whatsappButton]}
              onPress={() => shareVia('whatsapp')}
            >
              <Ionicons name="logo-whatsapp" size={28} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.shareButton, styles.instagramButton]}
              onPress={() => shareVia('instagram')}
            >
              <Ionicons name="logo-instagram" size={28} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Instagram</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.shareButton, styles.smsButton]}
              onPress={() => shareVia('sms')}
            >
              <Ionicons name="chatbubble" size={28} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>SMS</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.shareButton, styles.moreButton]}
              onPress={shareGeneric}
            >
              <Ionicons name="share-social" size={28} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Referral Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats?.total_referrals || 0}</Text>
              <Text style={styles.statLabel}>Total Referrals</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats?.completed_referrals || 0}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats?.pending_referrals || 0}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={[styles.statCard, styles.rosesCard]}>
              <Text style={[styles.statNumber, styles.rosesNumber]}>
                {stats?.roses_earned || 0} 🌹
              </Text>
              <Text style={styles.statLabel}>Roses Earned</Text>
            </View>
          </View>

          {/* Limits */}
          <View style={styles.limitsContainer}>
            <Text style={styles.limitsText}>
              Weekly: {stats?.weekly_referrals || 0}/{stats?.weekly_limit || 20} • 
              Lifetime: {stats?.total_referrals || 0}/{stats?.lifetime_limit || 500}
            </Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share Your Code</Text>
              <Text style={styles.stepDescription}>
                Send your unique code to friends via WhatsApp, Instagram, or SMS
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Friend Signs Up</Text>
              <Text style={styles.stepDescription}>
                They create an account and enter your referral code. They get 5 free roses!
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>They Get Active</Text>
              <Text style={styles.stepDescription}>
                Once they upload 3 photos, make a swipe, and stay active for 24 hours...
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, styles.finalStep]}>
              <Ionicons name="gift" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>You Earn 20 Roses! 🌹</Text>
              <Text style={styles.stepDescription}>
                Roses are automatically added to your account
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Referrals */}
        {stats?.recent_referrals?.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Referrals</Text>
            {stats.recent_referrals.map((referral: any, index: number) => (
              <View key={index} style={styles.referralItem}>
                <View style={styles.referralInfo}>
                  <Text style={styles.referralName}>{referral.name}</Text>
                  <Text style={styles.referralDate}>
                    {new Date(referral.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[
                  styles.referralStatus,
                  referral.status === 'completed' ? styles.statusCompleted : styles.statusPending
                ]}>
                  <Text style={styles.referralStatusText}>
                    {referral.status === 'completed' ? '+20 🌹' : 'Pending'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    alignItems: 'center',
  },
  heroIcon: {
    backgroundColor: '#FFF0F0',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  codeCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    borderStyle: 'dashed',
  },
  codeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF0F0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B6B',
    letterSpacing: 1,
  },
  copyButton: {
    padding: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  shareSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  shareButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  shareButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  instagramButton: {
    backgroundColor: '#E1306C',
  },
  smsButton: {
    backgroundColor: '#007AFF',
  },
  moreButton: {
    backgroundColor: '#666',
  },
  statsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  rosesCard: {
    width: '100%',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  rosesNumber: {
    color: '#FF6B6B',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  limitsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 12,
    marginTop: 8,
  },
  limitsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  howItWorksSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 20,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  finalStep: {
    backgroundColor: '#4CAF50',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  recentSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  referralDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  referralStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusCompleted: {
    backgroundColor: '#E8F5E9',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  referralStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});
