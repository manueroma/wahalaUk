import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const { width, height } = Dimensions.get('window');

interface User {
  _id: string;
  name: string;
  age: number;
  location_city: string;
  bio: string;
  photos: string[];
  interests: string[];
  roses_received: number;
  instagram?: string;
}

export default function DiscoverScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [swipesRemaining, setSwipesRemaining] = useState<number | null>(null);

  useEffect(() => {
    loadPotentialMatches();
    loadSwipeStatus();
  }, []);

  const loadSwipeStatus = async () => {
    try {
      const response = await api.get('/api/swipes/remaining');
      if (!response.data.unlimited) {
        setSwipesRemaining(response.data.remaining);
      }
    } catch (error) {
      console.error('Failed to load swipe status');
    }
  };

  const loadPotentialMatches = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/matches/potential');
      setUsers(response.data.users);
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (direction: 'left' | 'right') => {
    if (swiping || currentIndex >= users.length) return;

    setSwiping(true);
    const currentUser = users[currentIndex];

    try {
      const response = await api.post('/api/matches/swipe', {
        target_user_id: currentUser._id,
        direction,
      });

      // Update swipes remaining
      if (response.data.remaining_swipes !== null && response.data.remaining_swipes !== undefined) {
        setSwipesRemaining(response.data.remaining_swipes);
        
        if (response.data.remaining_swipes === 0) {
          Alert.alert(
            'Daily Limit Reached',
            'You\'ve used all 20 swipes for today! Upgrade to Premium for unlimited swipes.',
            [{ text: 'OK' }]
          );
        }
      }

      if (response.data.matched) {
        Alert.alert('🎉 It\'s a Match!', 'You can now start chatting!');
      }

      setCurrentIndex(currentIndex + 1);

      // Load more users if running low
      if (currentIndex >= users.length - 3) {
        loadPotentialMatches();
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        Alert.alert(
          'Upgrade to Premium',
          error.response?.data?.detail || 'Daily swipe limit reached. Upgrade for unlimited swipes!',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Error', 'Failed to swipe');
      }
    } finally {
      setSwiping(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  if (currentIndex >= users.length) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="heart-outline" size={80} color="#DDD" />
        <Text style={styles.emptyTitle}>No more profiles</Text>
        <Text style={styles.emptyText}>Check back later for new matches!</Text>
        <TouchableOpacity style={styles.reloadButton} onPress={loadPotentialMatches}>
          <Text style={styles.reloadButtonText}>Reload</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentUser = users[currentIndex];

  return (
    <View style={styles.container}>
      {/* Swipe Counter */}
      {swipesRemaining !== null && (
        <View style={styles.swipeCounter}>
          <Text style={styles.swipeCounterText}>
            {swipesRemaining} swipes left today
          </Text>
        </View>
      )}

      {/* Card */}
      <View style={styles.card}>
        <Image
          source={{ uri: currentUser.photos[0] }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        
        {/* Info Overlay */}
        <View style={styles.infoOverlay}>
          <View style={styles.userInfo}>
            <Text style={styles.name}>
              {currentUser.name}, {currentUser.age}
            </Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color="#FFFFFF" />
              <Text style={styles.location}>{currentUser.location_city}</Text>
            </View>
            {currentUser.instagram && (
              <TouchableOpacity 
                style={styles.instagramContainer}
                onPress={() => Linking.openURL(`https://instagram.com/${currentUser.instagram.replace('@', '')}`)}
              >
                <Ionicons name="logo-instagram" size={16} color="#E1306C" />
                <Text style={styles.instagramText}>@{currentUser.instagram.replace('@', '')}</Text>
              </TouchableOpacity>
            )}
            {currentUser.roses_received > 0 && (
              <View style={styles.rosesContainer}>
                <Ionicons name="rose" size={16} color="#FFD700" />
                <Text style={styles.rosesText}>{currentUser.roses_received} roses</Text>
              </View>
            )}
          </View>

          {currentUser.bio && (
            <Text style={styles.bio} numberOfLines={2}>{currentUser.bio}</Text>
          )}

          {currentUser.interests && currentUser.interests.length > 0 && (
            <View style={styles.interestsContainer}>
              {currentUser.interests.slice(0, 3).map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.passButton]}
          onPress={() => handleSwipe('left')}
          disabled={swiping}
        >
          <Ionicons name="close" size={36} color="#FF6B6B" />
          <Text style={[styles.actionText, { color: '#FF6B6B' }]}>NO WAHALA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => handleSwipe('right')}
          disabled={swiping}
        >
          <Ionicons name="heart" size={36} color="#4CAF50" />
          <Text style={[styles.actionText, { color: '#4CAF50' }]}>WAHALA</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 50,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  swipeCounter: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 12,
  },
  swipeCounterText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  card: {
    width: width - 32,
    height: height * 0.55,
    alignSelf: 'center',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  userInfo: {
    marginBottom: 6,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  rosesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rosesText: {
    fontSize: 13,
    color: '#FFD700',
    marginLeft: 4,
  },
  bio: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 6,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  interestTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestText: {
    fontSize: 11,
    color: '#FFFFFF',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 20,
    paddingBottom: 20,
  },
  actionButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 130,
  },
  actionText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  passButton: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  likeButton: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  reloadButton: {
    marginTop: 24,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  reloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});