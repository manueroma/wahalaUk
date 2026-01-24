import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [photos, setPhotos] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    if (photos.length >= 10) {
      Alert.alert('Maximum Reached', 'You can upload up to 10 photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setPhotos([...photos, base64Image]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleComplete = async () => {
    if (photos.length < 3) {
      Alert.alert('More Photos Needed', 'Please upload at least 3 photos');
      return;
    }

    setLoading(true);
    try {
      // Upload photos
      await api.post('/api/profile/upload-photos', { photos });

      // Update profile with bio and interests
      const interestsArray = interests.split(',').map(i => i.trim()).filter(i => i);
      await api.put('/api/profile/update', {
        bio,
        interests: interestsArray,
      });

      updateUser({ photos, bio, interests: interestsArray, profile_complete: true });
      router.replace('/(tabs)/discover');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>Let's make your profile stand out!</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Photos ({photos.length}/10)</Text>
        <Text style={styles.sectionSubtitle}>Upload 3-10 photos</Text>

        <View style={styles.photosGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={styles.photoContainer}>
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(index)}
              >
                <Text style={styles.removeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}

          {photos.length < 10 && (
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <Text style={styles.addPhotoText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About You</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Write a short bio..."
          placeholderTextColor="#999"
          value={bio}
          onChangeText={setBio}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <TextInput
          style={styles.input}
          placeholder="Travel, Music, Fitness, Cooking..."
          placeholderTextColor="#999"
          value={interests}
          onChangeText={setInterests}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonText}>Complete Profile</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 130,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B6B',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addPhotoButton: {
    width: 100,
    height: 130,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 48,
    color: '#DDD',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});