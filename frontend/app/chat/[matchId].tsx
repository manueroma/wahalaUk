import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

interface Message {
  _id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string;
  created_at: string;
}

export default function ChatScreen() {
  const { matchId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const response = await api.get(`/api/chat/messages/${matchId}`);
      setMessages(response.data.messages);
    } catch (error: any) {
      if (error.response?.status === 403) {
        Alert.alert('Chat Locked', 'This chat is not unlocked yet');
        router.back();
      }
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    setSending(true);
    try {
      await api.post('/api/chat/send-message', {
        match_id: matchId,
        content: inputText,
        message_type: 'text',
      });
      setInputText('');
      await loadMessages();
      flatListRef.current?.scrollToEnd();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const sendSnapVideo = async () => {
    // Check snap status first
    try {
      const statusResponse = await api.get(`/api/chat/snap-status/${matchId}`);
      const snapStatus = statusResponse.data;
      
      if (!snapStatus.can_send_snap) {
        Alert.alert(
          'Premium Feature',
          'You\'ve already used your free snap! Upgrade to Premium for unlimited snaps.',
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade', onPress: () => {/* Navigate to premium */} }
          ]
        );
        return;
      }
    } catch (error) {
      console.error('Failed to check snap status:', error);
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      videoMaxDuration: 9,  // Changed to 9 seconds
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Video = `data:video/mp4;base64,${result.assets[0].base64}`;
      
      try {
        await api.post('/api/chat/send-message', {
          match_id: matchId,
          content: base64Video,
          message_type: 'snap',
        });
        await loadMessages();
        
        Alert.alert(
          'Snap Sent!', 
          '9-second snap video sent successfully! It can only be viewed once.'
        );
      } catch (error: any) {
        if (error.response?.status === 403) {
          Alert.alert(
            'Upgrade Required',
            error.response?.data?.detail || 'Premium required for more snaps',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Go Premium', onPress: () => {/* Navigate to premium */} }
            ]
          );
        } else {
          Alert.alert('Error', 'Failed to send snap');
        }
      }
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === user?._id;
    const isSnap = item.message_type === 'snap';

    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessage : styles.theirMessage
      ]}>
        {isSnap ? (
          <View style={styles.snapContainer}>
            <Ionicons name="videocam" size={20} color="#FFFFFF" />
            <Text style={styles.snapText}>
              {item.content === '[Snap expired]' ? 'Snap expired' : '7s Snap Video'}
            </Text>
          </View>
        ) : (
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.content}
          </Text>
        )}
        <Text style={[
          styles.timeText,
          isMyMessage ? styles.myTimeText : styles.theirTimeText
        ]}>
          {format(new Date(item.created_at), 'HH:mm')}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <TouchableOpacity style={styles.reportButton}>
          <Ionicons name="flag-outline" size={24} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.snapButton} onPress={sendSnapVideo}>
          <Ionicons name="videocam" size={24} color="#FF6B6B" />
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  reportButton: {
    padding: 8,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    maxWidth: '75%',
    marginBottom: 12,
    borderRadius: 16,
    padding: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF6B6B',
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#333',
  },
  snapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  snapText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 10,
    marginTop: 4,
  },
  myTimeText: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  theirTimeText: {
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  snapButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    color: '#333',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});