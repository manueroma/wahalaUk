import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface LeaderboardUser {
  _id: string;
  name: string;
  location_city: string;
  photos: string[];
  roses_received: number;
}

export default function RosesScreen() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const response = await api.get('/api/roses/leaderboard');
      setLeaderboard(response.data.leaderboard);
    } catch (error) {
      Alert.alert('Error', 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  const renderUser = ({ item, index }: { item: LeaderboardUser; index: number }) => (
    <View style={styles.userCard}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      <Image
        source={{ uri: item.photos[0] }}
        style={styles.userPhoto}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userLocation}>{item.location_city}</Text>
      </View>
      <View style={styles.rosesContainer}>
        <Ionicons name="rose" size={24} color="#FFD700" />
        <Text style={styles.rosesCount}>{item.roses_received}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="rose" size={32} color="#FF6B6B" />
        <Text style={styles.headerTitle}>Rose Leaderboard</Text>
        <Text style={styles.headerSubtitle}>
          Top users who received the most roses
        </Text>
      </View>

      {leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="rose-outline" size={80} color="#DDD" />
          <Text style={styles.emptyTitle}>No roses sent yet</Text>
          <Text style={styles.emptyText}>
            Be the first to send a rose to someone special!
          </Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          renderItem={renderUser}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  userPhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginHorizontal: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#666',
  },
  rosesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rosesCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
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
    textAlign: 'center',
  },
});