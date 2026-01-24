import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import api from '../../services/api';

interface Match {
  _id: string;
  matched_at: string;
  chat_unlocked: boolean;
  unlock_time: string;
  other_user: {
    _id: string;
    name: string;
    age: number;
    location_city: string;
    photos: string[];
  };
}

export default function MatchesScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const response = await api.get('/api/matches/my-matches');
      setMatches(response.data.matches);
    } catch (error) {
      Alert.alert('Error', 'Failed to load matches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const handleMatchPress = (match: Match) => {
    if (match.chat_unlocked) {
      router.push(`/chat/${match._id}`);
    } else {
      const unlockTime = new Date(match.unlock_time);
      const now = new Date();
      const timeLeft = Math.ceil((unlockTime.getTime() - now.getTime()) / 1000 / 60);
      
      Alert.alert(
        'Chat Locked',
        `Chat unlocks in ${timeLeft} minutes, or pay £0.99 to unlock instantly!`,
        [
          { text: 'Wait', style: 'cancel' },
          { text: 'Unlock Now', onPress: () => handleUnlockChat(match._id) },
        ]
      );
    }
  };

  const handleUnlockChat = async (matchId: string) => {
    try {
      const response = await api.post('/api/chat/unlock-instant', {
        payment_type: 'instant_chat',
        match_id: matchId,
      });

      if (!response.data.payment_required) {
        // Test mode - chat unlocked
        Alert.alert('Success', 'Chat unlocked!', [
          { text: 'OK', onPress: () => loadMatches() },
        ]);
      } else {
        // Would integrate Stripe payment here
        Alert.alert('Payment', 'Stripe payment integration pending');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to unlock chat');
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  const renderMatch = ({ item }: { item: Match }) => (
    <TouchableOpacity
      style={styles.matchCard}
      onPress={() => handleMatchPress(item)}
    >
      <Image
        source={{ uri: item.other_user.photos[0] }}
        style={styles.matchPhoto}
      />
      <View style={styles.matchInfo}>
        <Text style={styles.matchName}>
          {item.other_user.name}, {item.other_user.age}
        </Text>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color="#666" />
          <Text style={styles.matchLocation}>{item.other_user.location_city}</Text>
        </View>
        <Text style={styles.matchDate}>
          Matched {format(new Date(item.matched_at), 'MMM d')}
        </Text>
      </View>
      {!item.chat_unlocked && (
        <View style={styles.lockBadge}>
          <Ionicons name="lock-closed" size={16} color="#FF6B6B" />
        </View>
      )}
      <Ionicons name="chevron-forward" size={24} color="#DDD" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Matches</Text>
        <Text style={styles.headerSubtitle}>{matches.length} matches</Text>
      </View>

      {matches.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-dislike-outline" size={80} color="#DDD" />
          <Text style={styles.emptyTitle}>No matches yet</Text>
          <Text style={styles.emptyText}>
            Keep swiping to find your perfect match!
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
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
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  matchPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  matchInfo: {
    flex: 1,
    marginLeft: 16,
  },
  matchName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  matchLocation: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  matchDate: {
    fontSize: 12,
    color: '#999',
  },
  lockBadge: {
    marginRight: 8,
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