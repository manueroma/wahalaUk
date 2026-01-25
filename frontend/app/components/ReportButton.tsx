import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface ReportButtonProps {
  userId: string;
  userName: string;
  onReport?: () => void;
}

const REPORT_REASONS = [
  { id: 'fake_profile', label: 'Fake Profile', icon: 'person-remove' },
  { id: 'inappropriate_content', label: 'Inappropriate Content', icon: 'eye-off' },
  { id: 'harassment', label: 'Harassment', icon: 'hand-left' },
  { id: 'spam', label: 'Spam', icon: 'mail-unread' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function ReportButton({ userId, userName, onReport }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReport = async () => {
    if (!selectedReason) {
      Alert.alert('Error', 'Please select a reason for reporting.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/report/user', {
        reported_user_id: userId,
        reason: selectedReason,
        description: description,
      });

      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep WAHALA UK safe. We will review this report within 24 hours.',
        [{ text: 'OK', onPress: () => setShowModal(false) }]
      );
      setSelectedReason('');
      setDescription('');
      onReport?.();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.reportButton}
        onPress={() => setShowModal(true)}
      >
        <Ionicons name="flag" size={20} color="#FF6B6B" />
        <Text style={styles.reportButtonText}>Report</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report {userName}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Why are you reporting this user?</Text>

            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.id}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.id && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason.id)}
              >
                <Ionicons
                  name={reason.icon as any}
                  size={24}
                  color={selectedReason === reason.id ? '#FF6B6B' : '#666'}
                />
                <Text
                  style={[
                    styles.reasonText,
                    selectedReason === reason.id && styles.reasonTextSelected,
                  ]}
                >
                  {reason.label}
                </Text>
                {selectedReason === reason.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#FF6B6B" />
                )}
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionLabel}>Additional details (optional)</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Please provide any additional context..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleReport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit Report</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              False reports may result in action against your account.
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
  },
  reportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 12,
    marginTop: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
  },
  reasonOptionSelected: {
    backgroundColor: '#FFF0F0',
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  reasonText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  reasonTextSelected: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
  },
});
