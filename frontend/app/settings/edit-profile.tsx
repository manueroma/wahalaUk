import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { useAuthStore } from '../../store/authStore';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

// Generate height options from 140cm to 220cm
const heightOptions = Array.from({ length: 81 }, (_, i) => 140 + i);

// Extract numeric height from string like "170 cm" or "170cm"
const extractHeight = (heightStr: string): string => {
  const match = heightStr?.match(/(\d+)/);
  return match ? match[1] : '170';
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, token, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    height: extractHeight(user?.height || '170'),
    job: user?.job || '',
    education: user?.education || '',
    instagram: user?.instagram || '',
    looking_for: user?.looking_for || 'see_where_it_goes',
  });

  const lookingForOptions = [
    { value: 'fun', label: 'Fun / Casual Dating', emoji: '😊' },
    { value: 'see_where_it_goes', label: 'See Where It Goes', emoji: '🤔' },
    { value: 'marry', label: 'Looking to Marry', emoji: '💍' },
  ];

  const saveProfile = async () => {
    if (!profile.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/api/profile/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profile,
          height: `${profile.height} cm`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        updateUser(data);
        Alert.alert('Success', 'Profile updated successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={saveProfile} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#FF6B6B" />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Info</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={profile.name}
                onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
                placeholder="Your name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={profile.bio}
                onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
                placeholder="Tell others about yourself..."
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>{profile.bio.length}/500</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={profile.height}
                  onValueChange={(value) => setProfile(prev => ({ ...prev, height: value }))}
                  style={styles.picker}
                >
                  {heightOptions.map((h) => (
                    <Picker.Item key={h} label={`${h} cm`} value={h.toString()} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Job Title</Text>
              <TextInput
                style={styles.input}
                value={profile.job}
                onChangeText={(text) => setProfile(prev => ({ ...prev, job: text }))}
                placeholder="What do you do?"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Education</Text>
              <TextInput
                style={styles.input}
                value={profile.education}
                onChangeText={(text) => setProfile(prev => ({ ...prev, education: text }))}
                placeholder="University or school"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Instagram Handle</Text>
              <View style={styles.inputWithPrefix}>
                <Text style={styles.inputPrefix}>@</Text>
                <TextInput
                  style={styles.inputAfterPrefix}
                  value={profile.instagram}
                  onChangeText={(text) => setProfile(prev => ({ ...prev, instagram: text }))}
                  placeholder="username"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Looking For</Text>
            {lookingForOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.lookingForOption,
                  profile.looking_for === option.value && styles.lookingForOptionSelected,
                ]}
                onPress={() => setProfile(prev => ({ ...prev, looking_for: option.value }))}
              >
                <Text style={styles.lookingForEmoji}>{option.emoji}</Text>
                <Text
                  style={[
                    styles.lookingForText,
                    profile.looking_for === option.value && styles.lookingForTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {profile.looking_for === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color="#FF6B6B" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  keyboardView: {
    flex: 1,
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
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  inputWithPrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
  },
  inputPrefix: {
    paddingLeft: 16,
    fontSize: 16,
    color: '#666',
  },
  inputAfterPrefix: {
    flex: 1,
    padding: 16,
    paddingLeft: 4,
    fontSize: 16,
    color: '#333',
  },
  lookingForOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  lookingForOptionSelected: {
    backgroundColor: '#FFF0F0',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  lookingForEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  lookingForText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  lookingForTextSelected: {
    fontWeight: '600',
    color: '#FF6B6B',
  },
  bottomPadding: {
    height: 40,
  },
});
