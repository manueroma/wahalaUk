import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function TermsScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [accepted, setAccepted] = useState(false);

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;
    if (isCloseToBottom) {
      setHasScrolledToEnd(true);
    }
  };

  const handleAccept = () => {
    if (!accepted) return;
    router.push('/auth/register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>WAHALA UK</Text>
          <Text style={styles.tagline}>Find Your Love</Text>
        </View>

        <Text style={styles.lastUpdated}>Last Updated: January 2025</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Welcome to WAHALA UK</Text>
          <Text style={styles.sectionText}>
            Welcome to WAHALA UK, a dating platform designed primarily to support Black professionals in the UK, US, and Italy who are seeking serious, meaningful relationships. While our mission centers on uplifting the Black community, we welcome users of all ethnicities who share our values of respect, authenticity, and commitment.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Eligibility</Text>
          <Text style={styles.sectionText}>
            By using WAHALA UK, you confirm that:{'\n\n'}
            • You are at least 18 years of age{'\n'}
            • You are legally permitted to use the service in your jurisdiction{'\n'}
            • You will provide accurate and truthful information{'\n'}
            • You are not prohibited from using the service under any applicable laws
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Conduct</Text>
          <Text style={styles.sectionText}>
            You agree to:{'\n\n'}
            • Treat all users with respect and dignity{'\n'}
            • Not upload any nude, sexually explicit, or inappropriate content{'\n'}
            • Not engage in harassment, hate speech, or discriminatory behavior{'\n'}
            • Not use the platform for commercial purposes without authorization{'\n'}
            • Not create fake profiles or impersonate others{'\n'}
            • Report any violations using our in-app report feature
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Subscription & Payments</Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Premium Subscriptions:</Text>{'\n'}
            • Monthly: £9.99/month{'\n'}
            • Annual: £89.99/year{'\n\n'}
            <Text style={styles.bold}>Important:</Text>{'\n'}
            • Annual subscriptions are NON-REFUNDABLE{'\n'}
            • You may cancel monthly subscriptions at any time{'\n'}
            • Cancellation takes effect at the end of the current billing period{'\n'}
            • Virtual roses and other microtransactions are non-refundable
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Privacy & Data</Text>
          <Text style={styles.sectionText}>
            We value your privacy:{'\n\n'}
            • We collect profile information you provide voluntarily{'\n'}
            • We use data to improve your experience and match you with compatible users{'\n'}
            • We never sell your personal data to third parties{'\n'}
            • Payment processing is handled securely by Stripe{'\n'}
            • You can request deletion of your data at any time
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>WAHALA UK is NOT responsible for:</Text>{'\n\n'}
            • Any interactions, meetings, or events that occur outside the app{'\n'}
            • The conduct of other users{'\n'}
            • Any damages arising from your use of the platform{'\n'}
            • The accuracy of information provided by other users{'\n\n'}
            You use WAHALA UK at your own risk. Always prioritize your safety when meeting someone in person.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Account Suspension & Termination</Text>
          <Text style={styles.sectionText}>
            <Text style={styles.bold}>Our Moderation Policy:</Text>{'\n\n'}
            WAHALA UK operates a 3-strike warning system:{'\n'}
            • 1st violation: Warning{'\n'}
            • 2nd violation: 24-hour suspension{'\n'}
            • 3rd violation: Permanent ban{'\n\n'}
            <Text style={styles.bold}>Severe violations may result in immediate permanent ban, including:</Text>{'\n'}
            • Harassment or threatening behavior{'\n'}
            • Posting illegal content{'\n'}
            • Scamming or fraud{'\n'}
            • Creating fake profiles{'\n\n'}
            <Text style={styles.bold}>Important:</Text>{'\n'}
            • WAHALA UK reserves the right to ban any account at our discretion{'\n'}
            • We are NOT obligated to provide specific reasons for account termination{'\n'}
            • NO REFUNDS will be issued for banned accounts, including premium subscriptions{'\n'}
            • Banned users may not create new accounts{'\n\n'}
            You may delete your account at any time through the app settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Contact Us</Text>
          <Text style={styles.sectionText}>
            For questions or concerns:{'\n\n'}
            📧 Email: wahalauk@gmail.com{'\n\n'}
            We typically respond within 24-48 hours.
          </Text>
        </View>

        <View style={styles.agreementSection}>
          <Text style={styles.agreementText}>
            By creating an account, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
          </Text>
        </View>

        {!hasScrolledToEnd && (
          <View style={styles.scrollHint}>
            <Ionicons name="chevron-down" size={24} color="#FF6B6B" />
            <Text style={styles.scrollHintText}>Scroll to read all terms</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => hasScrolledToEnd && setAccepted(!accepted)}
          disabled={!hasScrolledToEnd}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked, !hasScrolledToEnd && styles.checkboxDisabled]}>
            {accepted && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
          </View>
          <Text style={[styles.checkboxLabel, !hasScrolledToEnd && styles.checkboxLabelDisabled]}>
            I have read and agree to the Terms & Conditions
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.acceptButton, !accepted && styles.acceptButtonDisabled]}
          onPress={handleAccept}
          disabled={!accepted}
        >
          <Text style={styles.acceptButtonText}>Accept & Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 24,
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
  agreementSection: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  agreementText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scrollHint: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  scrollHintText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginTop: 4,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#FF6B6B',
  },
  checkboxDisabled: {
    borderColor: '#CCC',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  checkboxLabelDisabled: {
    color: '#999',
  },
  acceptButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    backgroundColor: '#CCC',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
