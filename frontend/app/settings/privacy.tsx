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

export default function PrivacyScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    show_online_status: true,
    show_read_receipts: true,
    show_distance: true,
    discovery_enabled: true,
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
        show_online_status: data.show_online_status ?? true,
        show_read_receipts: data.show_read_receipts ?? true,
        show_distance: data.show_distance ?? true,
        discovery_enabled: data.discovery_enabled ?? true,
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
        <Text style={styles.headerTitle}>Privacy & Safety</Text>
        <View style={styles.placeholder}>
          {saving && <ActivityIndicator size="small" color="#FF6B6B" />}
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visibility</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="eye" size={24} color="#4A90D9" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Show Online Status</Text>
                <Text style={styles.settingDescription}>Let others see when you're active</Text>
              </View>
            </View>
            <Switch
              value={settings.show_online_status}
              onValueChange={(value) => updateSetting('show_online_status', value)}
              trackColor={{ false: '#DDD', true: '#FF6B6B' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="checkmark-done" size={24} color="#27AE60" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Read Receipts</Text>
                <Text style={styles.settingDescription}>Let others see when you've read messages</Text>
              </View>
            </View>
            <Switch
              value={settings.show_read_receipts}
              onValueChange={(value) => updateSetting('show_read_receipts', value)}
              trackColor={{ false: '#DDD', true: '#FF6B6B' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="location" size={24} color="#E74C3C" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Show Distance</Text>
                <Text style={styles.settingDescription}>Show how far away you are</Text>
              </View>
            </View>
            <Switch
              value={settings.show_distance}
              onValueChange={(value) => updateSetting('show_distance', value)}
              trackColor={{ false: '#DDD', true: '#FF6B6B' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discovery</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Ionicons name="search" size={24} color="#9B59B6" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Discoverable</Text>
                <Text style={styles.settingDescription}>Allow others to find you in Discover</Text>
              </View>
            </View>
            <Switch
              value={settings.discovery_enabled}
              onValueChange={(value) => updateSetting('discovery_enabled', value)}
              trackColor={{ false: '#DDD', true: '#FF6B6B' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety</Text>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/settings/blocked-users')}
          >
            <Ionicons name="ban" size={24} color="#E74C3C" />
            <Text style={styles.menuText}>Blocked Users</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="flag" size={24} color="#F39C12" />
            <Text style={styles.menuText}>Report a Problem</Text>
            <Ionicons name="chevron-forward" size={20} color="#CCC" />
          </TouchableOpacity>
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
    marginBottom: 0,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
});
