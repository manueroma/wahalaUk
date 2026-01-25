import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import { useAuthStore } from '../../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export default function DiscoveryScreen() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    age_min: 18,
    age_max: 100,
    distance_max: 100,
    gender_preference: 'all',
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
        age_min: data.age_min ?? 18,
        age_max: data.age_max ?? 100,
        distance_max: data.distance_max ?? 100,
        gender_preference: data.gender_preference ?? 'all',
      }));
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      Alert.alert('Success', 'Discovery preferences saved!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const genderOptions = [
    { value: 'all', label: 'Everyone', icon: 'people' },
    { value: 'male', label: 'Men', icon: 'male' },
    { value: 'female', label: 'Women', icon: 'female' },
  ];

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
        <Text style={styles.headerTitle}>Discovery Preferences</Text>
        <TouchableOpacity onPress={saveSettings} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#FF6B6B" />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Show Me</Text>
          <View style={styles.genderOptions}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  settings.gender_preference === option.value && styles.genderOptionSelected,
                ]}
                onPress={() => setSettings(prev => ({ ...prev, gender_preference: option.value }))}
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={settings.gender_preference === option.value ? '#FF6B6B' : '#666'}
                />
                <Text
                  style={[
                    styles.genderOptionText,
                    settings.gender_preference === option.value && styles.genderOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sectionTitle}>Age Range</Text>
            <Text style={styles.sliderValue}>{settings.age_min} - {settings.age_max}</Text>
          </View>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Min Age</Text>
            <Slider
              style={styles.slider}
              minimumValue={18}
              maximumValue={settings.age_max - 1}
              step={1}
              value={settings.age_min}
              onValueChange={(value) => setSettings(prev => ({ ...prev, age_min: Math.round(value) }))}
              minimumTrackTintColor="#FF6B6B"
              maximumTrackTintColor="#DDD"
              thumbTintColor="#FF6B6B"
            />
          </View>
          
          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Max Age</Text>
            <Slider
              style={styles.slider}
              minimumValue={settings.age_min + 1}
              maximumValue={100}
              step={1}
              value={settings.age_max}
              onValueChange={(value) => setSettings(prev => ({ ...prev, age_max: Math.round(value) }))}
              minimumTrackTintColor="#FF6B6B"
              maximumTrackTintColor="#DDD"
              thumbTintColor="#FF6B6B"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sliderHeader}>
            <Text style={styles.sectionTitle}>Maximum Distance</Text>
            <Text style={styles.sliderValue}>{settings.distance_max} km</Text>
          </View>
          
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={500}
            step={1}
            value={settings.distance_max}
            onValueChange={(value) => setSettings(prev => ({ ...prev, distance_max: Math.round(value) }))}
            minimumTrackTintColor="#FF6B6B"
            maximumTrackTintColor="#DDD"
            thumbTintColor="#FF6B6B"
          />
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
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
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
    marginBottom: 16,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderOptionSelected: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FF6B6B',
  },
  genderOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginTop: 8,
  },
  genderOptionTextSelected: {
    color: '#FF6B6B',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
