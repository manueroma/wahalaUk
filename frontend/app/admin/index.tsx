import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Modal,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'reports'>('dashboard');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    try {
      const response = await api.get('/api/admin/check');
      if (response.data.is_admin) {
        setIsAdmin(true);
        fetchDashboard();
      } else {
        Alert.alert('Access Denied', 'You do not have admin privileges.');
        router.back();
      }
    } catch (error) {
      router.back();
    }
  };

  const fetchDashboard = async () => {
    try {
      const [dashResponse, usersResponse, reportsResponse] = await Promise.all([
        api.get('/api/admin/dashboard'),
        api.get('/api/admin/users?limit=20'),
        api.get('/api/admin/reports?status=pending'),
      ]);
      setStats(dashResponse.data.stats);
      setUsers(usersResponse.data.users);
      setReports(reportsResponse.data.reports);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      fetchDashboard();
      return;
    }
    try {
      const response = await api.get(`/api/admin/users?search=${encodeURIComponent(searchQuery)}`);
      setUsers(response.data.users);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const handleUserAction = async (userId: string, action: string, reason: string = '') => {
    setActionLoading(true);
    try {
      await api.post('/api/admin/action', {
        user_id: userId,
        action: action,
        reason: reason || `Admin action: ${action}`,
      });
      Alert.alert('Success', `Action "${action}" completed successfully.`);
      setSelectedUser(null);
      fetchDashboard();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportAction = async (reportId: string, action: string) => {
    setActionLoading(true);
    try {
      await api.post('/api/admin/review-report', {
        report_id: reportId,
        action: action,
        notes: '',
      });
      Alert.alert('Success', `Report ${action === 'dismiss' ? 'dismissed' : 'actioned'} successfully.`);
      setSelectedReport(null);
      fetchDashboard();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const showUserActions = (userItem: any) => {
    Alert.alert(
      `Action: ${userItem.name}`,
      `Email: ${userItem.email}\nWarnings: ${userItem.warning_count || 0}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '⚠️ Warn', onPress: () => handleUserAction(userItem._id, 'warn', 'Community guideline violation') },
        { text: '⏸️ Suspend 24h', onPress: () => handleUserAction(userItem._id, 'suspend_24h', 'Temporary suspension') },
        { text: '⏸️ Suspend 7d', onPress: () => handleUserAction(userItem._id, 'suspend_7d', 'Extended suspension') },
        userItem.is_banned 
          ? { text: '✅ Unban', style: 'default', onPress: () => handleUserAction(userItem._id, 'unban') }
          : { text: '🚫 Ban', style: 'destructive', onPress: () => handleUserAction(userItem._id, 'ban', 'Serious violation') },
      ]
    );
  };

  const showReportActions = (report: any) => {
    Alert.alert(
      `Report: ${report.reported_user_name}`,
      `Reason: ${report.reason}\n\n${report.description || 'No details provided'}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: '❌ Dismiss', onPress: () => handleReportAction(report._id, 'dismiss') },
        { text: '⚠️ Warn User', onPress: () => handleReportAction(report._id, 'warn') },
        { text: '⏸️ Suspend User', onPress: () => handleReportAction(report._id, 'suspend') },
        { text: '🚫 Ban User', style: 'destructive', onPress: () => handleReportAction(report._id, 'ban') },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading Admin Dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={20} color="#FF6B6B" />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'dashboard' && styles.activeTab]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabText, activeTab === 'dashboard' && styles.activeTabText]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'users' && styles.activeTab]}
          onPress={() => setActiveTab('users')}
        >
          <Text style={[styles.tabText, activeTab === 'users' && styles.activeTabText]}>Users</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'reports' && styles.activeTab]}
          onPress={() => setActiveTab('reports')}
        >
          <View style={styles.tabWithBadge}>
            <Text style={[styles.tabText, activeTab === 'reports' && styles.activeTabText]}>Reports</Text>
            {stats?.pending_reports > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.pending_reports}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDashboard(); }} />}
      >
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.total_users || 0}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.active_users_24h || 0}</Text>
                <Text style={styles.statLabel}>Active (24h)</Text>
              </View>
              <View style={[styles.statCard, styles.premiumCard]}>
                <Text style={styles.statNumber}>{stats?.premium_users || 0}</Text>
                <Text style={styles.statLabel}>Premium</Text>
              </View>
              <View style={[styles.statCard, styles.dangerCard]}>
                <Text style={styles.statNumber}>{stats?.banned_users || 0}</Text>
                <Text style={styles.statLabel}>Banned</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.alertCard]}>
                <Text style={styles.statNumber}>{stats?.pending_reports || 0}</Text>
                <Text style={styles.statLabel}>Pending Reports</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats?.total_matches || 0}</Text>
                <Text style={styles.statLabel}>Total Matches</Text>
              </View>
            </View>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={searchUsers}
              />
            </View>

            {users.map((userItem) => (
              <TouchableOpacity
                key={userItem._id}
                style={styles.userCard}
                onPress={() => showUserActions(userItem)}
              >
                <View style={styles.userInfo}>
                  {userItem.photos?.[0] ? (
                    <Image source={{ uri: userItem.photos[0] }} style={styles.userAvatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={24} color="#999" />
                    </View>
                  )}
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{userItem.name}</Text>
                    <Text style={styles.userEmail}>{userItem.email}</Text>
                    <Text style={styles.userMeta}>
                      {userItem.gender} • {userItem.age} • {userItem.location_city}
                    </Text>
                  </View>
                </View>
                <View style={styles.userBadges}>
                  {userItem.is_premium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                    </View>
                  )}
                  {userItem.is_banned && (
                    <View style={styles.bannedBadge}>
                      <Text style={styles.bannedText}>BANNED</Text>
                    </View>
                  )}
                  {userItem.warning_count > 0 && (
                    <View style={styles.warningBadge}>
                      <Text style={styles.warningText}>{userItem.warning_count}⚠️</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <>
            {reports.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
                <Text style={styles.emptyTitle}>No Pending Reports</Text>
                <Text style={styles.emptyDescription}>All reports have been reviewed!</Text>
              </View>
            ) : (
              reports.map((report) => (
                <TouchableOpacity
                  key={report._id}
                  style={styles.reportCard}
                  onPress={() => showReportActions(report)}
                >
                  <View style={styles.reportHeader}>
                    <View style={[styles.reasonBadge, styles[`reason_${report.reason}`]]}>
                      <Text style={styles.reasonText}>{report.reason.replace('_', ' ')}</Text>
                    </View>
                    <Text style={styles.reportDate}>
                      {new Date(report.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.reportedUser}>
                    Reported: <Text style={styles.bold}>{report.reported_user_name}</Text>
                  </Text>
                  <Text style={styles.reporter}>By: {report.reporter_name}</Text>
                  {report.description && (
                    <Text style={styles.reportDescription} numberOfLines={2}>
                      "{report.description}"
                    </Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        <View style={styles.bottomPadding} />
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
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
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
  adminBadge: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B6B',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#FF6B6B',
  },
  tabWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  premiumCard: {
    backgroundColor: '#FFF9E6',
  },
  dangerCard: {
    backgroundColor: '#FFEBEE',
  },
  alertCard: {
    backgroundColor: '#FFF3E0',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
  },
  userMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  userBadges: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumBadge: {
    marginRight: 8,
  },
  bannedBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  bannedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  warningBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 4,
  },
  warningText: {
    fontSize: 12,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reasonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFE0E0',
  },
  reason_fake_profile: {
    backgroundColor: '#E3F2FD',
  },
  reason_inappropriate_content: {
    backgroundColor: '#FCE4EC',
  },
  reason_harassment: {
    backgroundColor: '#FFEBEE',
  },
  reason_spam: {
    backgroundColor: '#FFF8E1',
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
  reportedUser: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  bold: {
    fontWeight: '600',
  },
  reporter: {
    fontSize: 13,
    color: '#666',
  },
  reportDescription: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
