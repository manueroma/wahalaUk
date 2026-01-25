import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, deleteAccount } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          }
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    // First warning
    Alert.alert(
      '⚠️ Delete Account',
      'This will PERMANENTLY delete your account and all your data including:\n\n• Your profile and photos\n• All your matches\n• All your messages\n• Your roses and transactions\n\nThis action CANNOT be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'I Understand, Continue', 
          style: 'destructive',
          onPress: () => setShowDeleteModal(true)
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    const result = await deleteAccount();
    setIsDeleting(false);

    if (result.success) {
      setShowDeleteModal(false);
      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted. We\'re sorry to see you go!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login')
          }
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to delete account. Please try again.');
    }
  };

  const handlePremium = () => {
    router.push('/premium');
  };

  if (!user) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {user.photos && user.photos[0] && (
          <Image source={{ uri: user.photos[0] }} style={styles.profilePhoto} />
        )}
        <Text style={styles.name}>{user.name}, {user.age}</Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={16} color="#666" />
          <Text style={styles.location}>
            {user.location_city}, {user.location_country}
          </Text>
        </View>
        
        {user.premium_status === 'premium' ? (
          <View style={styles.premiumBadge}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.premiumText}>Premium Member</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.upgradeBadge} onPress={handlePremium}>
            <Ionicons name="star-outline" size={16} color="#FF6B6B" />
            <Text style={styles.upgradeText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Ionicons name="rose" size={24} color="#FFD700" />
          <Text style={styles.statNumber}>{user.roses_received || 0}</Text>
          <Text style={styles.statLabel}>Roses Received</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Details</Text>
        
        {user.height && (
          <View style={styles.detailRow}>
            <Ionicons name="resize" size={20} color="#666" />
            <Text style={styles.detailLabel}>Height:</Text>
            <Text style={styles.detailValue}>{user.height}</Text>
          </View>
        )}
        
        {user.looking_for && (
          <View style={styles.detailRow}>
            <Ionicons name="heart" size={20} color="#666" />
            <Text style={styles.detailLabel}>Looking For:</Text>
            <Text style={styles.detailValue}>
              {user.looking_for === 'fun' && 'Fun / Casual Dating'}
              {user.looking_for === 'see_where_it_goes' && 'Dating to See Where It Goes'}
              {user.looking_for === 'marry' && 'Dating to Marry'}
            </Text>
          </View>
        )}
        
        {user.instagram && (
          <View style={styles.detailRow}>
            <Ionicons name="logo-instagram" size={20} color="#666" />
            <Text style={styles.detailLabel}>Instagram:</Text>
            <Text style={styles.detailValue}>@{user.instagram}</Text>
          </View>
        )}
      </View>

      {user.bio && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bioText}>{user.bio}</Text>
        </View>
      )}

      {user.interests && user.interests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsContainer}>
            {user.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.menuItem} onPress={handlePremium}>
          <Ionicons name="star-outline" size={24} color="#FF6B6B" />
          <Text style={styles.menuText}>Premium Subscription</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/edit-profile')}>
          <Ionicons name="person-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/security')}>
          <Ionicons name="shield-checkmark-outline" size={24} color="#27AE60" />
          <Text style={styles.menuText}>Security & 2FA</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/notifications')}>
          <Ionicons name="notifications-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/privacy')}>
          <Ionicons name="shield-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Privacy & Safety</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/blocked-users')}>
          <Ionicons name="eye-off-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Blocked Users</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/settings/discovery')}>
          <Ionicons name="location-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Discovery Preferences</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Language settings will be available in a future update.')}>
          <Ionicons name="language-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Language & Region</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'Payment methods will be available once Stripe is configured.')}>
          <Ionicons name="card-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Payment Methods</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('Contact Us', 'Email: wahalauk@gmail.com\n\nWe typically respond within 24 hours.')}
        >
          <Ionicons name="mail-outline" size={24} color="#666" />
          <View style={styles.menuTextContainer}>
            <Text style={styles.menuText}>Contact Us</Text>
            <Text style={styles.menuSubtext}>wahalauk@gmail.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('Help Center', 'Need help?\n\n• Email us at wahalauk@gmail.com\n• Check our FAQs below\n• Follow us on Instagram @wahalauk for tips')}
        >
          <Ionicons name="help-circle-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Help Center</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('Safety Tips', '🛡️ Stay Safe on WAHALA UK\n\n1. Never share personal info like address or bank details\n2. Video chat before meeting in person\n3. Meet in public places for first dates\n4. Tell a friend where you\'re going\n5. Trust your instincts\n6. Report suspicious behavior')}
        >
          <Ionicons name="shield-checkmark-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Safety Tips</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('FAQs', '❓ Frequently Asked Questions\n\nQ: How many free swipes do I get?\nA: 20 swipes per day for free users.\n\nQ: What is a Rose?\nA: Roses are virtual gifts (£0.10 each) that show special interest.\n\nQ: How does matching work?\nA: Swipe right (WAHALA) on someone you like. If they swipe right too, it\'s a match!\n\nQ: How do I get Premium?\nA: Go to Settings > Premium Subscription.')}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#666" />
          <Text style={styles.menuText}>FAQs</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('Terms of Service', 'By using WAHALA UK, you agree to:\n\n• Be at least 18 years old\n• Provide accurate information\n• Respect other users\n• Not share inappropriate content\n• Annual subscriptions are non-refundable\n• WAHALA UK is not responsible for events outside the app\n\nWe welcome all ethnicities while supporting the black community\'s mission to connect.')}
        >
          <Ionicons name="document-text-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('Privacy Policy', 'Your Privacy Matters\n\nWe collect:\n• Profile information you provide\n• Usage data to improve the app\n• Location (with permission)\n\nWe never:\n• Sell your personal data\n• Share your information without consent\n• Store payment details (handled by Stripe)\n\nContact: wahalauk@gmail.com')}
        >
          <Ionicons name="lock-closed-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('About WAHALA UK', '❤️ WAHALA UK\n\n"Find Your Love"\n\nA dating app built for black professionals in the UK, US, and Italy who are ready for serious relationships.\n\nSince COVID changed how we meet, WAHALA UK brings meaningful connections back.\n\nVersion 1.0.0\n\n© 2025 WAHALA UK')}
        >
          <Ionicons name="information-circle-outline" size={24} color="#666" />
          <Text style={styles.menuText}>About WAHALA UK</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="time-outline" size={24} color="#666" />
          <Text style={styles.menuText}>Deactivate Account</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
          <Text style={[styles.menuText, styles.deleteText]}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
          <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          <Ionicons name="chevron-forward" size={24} color="#DDD" />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>WAHALA UK v1.0.0</Text>
        <Text style={styles.footerText}>Made with love for the Black community</Text>
      </View>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="warning" size={48} color="#FF3B30" />
              <Text style={styles.modalTitle}>Final Confirmation</Text>
            </View>
            
            <Text style={styles.modalText}>
              This is your last chance to cancel. To confirm permanent deletion, type{' '}
              <Text style={styles.deleteWord}>DELETE</Text> below:
            </Text>
            
            <TextInput
              style={styles.deleteInput}
              placeholder="Type DELETE to confirm"
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.confirmDeleteButton,
                  deleteConfirmText !== 'DELETE' && styles.disabledButton
                ]}
                onPress={confirmDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Delete Forever</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  premiumText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 6,
  },
  upgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  upgradeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 12,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  interestText: {
    fontSize: 14,
    color: '#666',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  menuSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  deleteText: {
    color: '#FF6B6B',
  },
  logoutText: {
    color: '#FF6B6B',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  // Delete Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  deleteWord: {
    fontWeight: 'bold',
    color: '#FF3B30',
  },
  deleteInput: {
    borderWidth: 2,
    borderColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 20,
    letterSpacing: 2,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
});