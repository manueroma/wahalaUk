import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function NotificationsScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifications_matches: true,
    notifications_messages: true,
    notifications_roses: true,
    notifications_promotions: false,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setSettings(prev => ({
        ...prev,
        notifications_matches: data.notifications_matches ?? true,
        notifications_messages: data.notifications_messages ?? true,
        notifications_roses: data.notifications_roses ?? true,
        notifications_promotions: data.notifications_promotions ?? false,
      }));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    try {
      setSaving(true);
      await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [key]: value }),
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save setting');
      setSettings(prev => ({ ...prev, [key]: !value }));
    } finally {
      setSaving(false);
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
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.placeholder}>
          {saving && <ActivityIndicator size="small" color="#FF6B6B" />}
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Push Notifications</Text>
          <Text style={styles.sectionDescription}>
            Choose what notifications you'd like to receive
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="heart" size={24} color="#FF6B6B" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>New Matches</Text>
                <Text style={styles.settingDescription}>When someone likes you back</Text>
              </View>
            </View>
            <Switch
              value={settings.notifications_matches}
              onValueChange={(value) => updateSetting('notifications_matches', value)}
              trackColor={{ false: '#DDD', true: '#FF6B6B' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="chatbubble" size={24} color="#4A90D9" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Messages</Text>
                <Text style={styles.settingDescription}>When you receive a new message</Text>
              </View>
            </View>
            <Switch
              value={settings.notifications_messages}
              onValueChange={(value) => updateSetting('notifications_messages', value)}
              trackColor={{ false: '#DDD', true: '#FF6B6B' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="rose" size={24} color="#FFD700" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Roses</Text>
                <Text style={styles.settingDescription}>When someone sends you a rose</Text>
              </View>
            </View>
            <Switch
              value={settings.notifications_roses}
              onValueChange={(value) => updateSetting('notifications_roses', value)}
              trackColor={{ false: '#DDD', true: '#FF6B6B' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="megaphone" size={24} color="#9B59B6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Promotions & Tips</Text>
                <Text style={styles.settingDescription}>Special offers and dating tips</Text>
              </View>
            </View>
            <Switch
              value={settings.notifications_promotions}
              onValueChange={(value) => updateSetting('notifications_promotions', value)}
              trackColor={{ false: '#DDD', true: '#FF6B6B' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
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
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
});
