/**
 * React Native - ProfileScreen
 * Mobile user profile and account settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  
  Switch,
} from 'react-native';
import crossAlert from '../utils/crossPlatformAlert';
import api from '../utils/api';

const ProfileScreen = ({ navigation, user, setUser, setToken }) => {
  const [profileData, setProfileData] = useState(user || {});
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [profileRes, statsRes] = await Promise.all([
        api.get('/auth/profile'),
        api.get('/users/stats'),
      ]);

      setProfileData(profileRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    crossAlert('Confirm', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.post('/auth/logout');
            setToken(null);
            setUser(null);
            navigation.replace('Login');
          } catch (error) {
            crossAlert('Error', 'Failed to logout');
          }
        },
      },
    ]);
  };

  const handleUpgradeToHost = () => {
    crossAlert(
      'Become a Host',
      'Upgrade your account to start teaching and earn money',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: () => navigation.navigate('UpgradeHost'),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.headerSection}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profileData.name?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        </View>

        <Text style={styles.name}>{profileData.name}</Text>
        <Text style={styles.email}>{profileData.email}</Text>

        {profileData.isHost && (
          <View style={styles.hostBadge}>
            <Text style={styles.hostBadgeText}>ðŸ‘¨â€ðŸ« Host</Text>
          </View>
        )}
      </View>

      {/* Statistics */}
      {Object.keys(stats).length > 0 && (
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.classesEnrolled || 0}</Text>
              <Text style={styles.statLabel}>Classes Enrolled</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.hoursWatched || 0}</Text>
              <Text style={styles.statLabel}>Hours Watched</Text>
            </View>
            {profileData.isHost && (
              <>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.classesCreated || 0}</Text>
                  <Text style={styles.statLabel}>Classes Created</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>${stats.earningsThisMonth || 0}</Text>
                  <Text style={styles.statLabel}>This Month</Text>
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* Preferences */}
      <View style={styles.preferencesSection}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.preferenceItem}>
          <View>
            <Text style={styles.preferenceName}>Push Notifications</Text>
            <Text style={styles.preferenceDesc}>Receive class reminders & messages</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#d0d0d0', true: '#81c784' }}
            thumbColor={notificationsEnabled ? '#667eea' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Account Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={styles.actionIcon}>âœï¸</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Edit Profile</Text>
            <Text style={styles.actionDesc}>Update your information</Text>
          </View>
          <Text style={styles.actionArrow}>â€º</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <Text style={styles.actionIcon}>ðŸ”</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Change Password</Text>
            <Text style={styles.actionDesc}>Update your security</Text>
          </View>
          <Text style={styles.actionArrow}>â€º</Text>
        </TouchableOpacity>

        {!profileData.isHost && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleUpgradeToHost}
          >
            <Text style={styles.actionIcon}>â­</Text>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Become a Host</Text>
              <Text style={styles.actionDesc}>Start teaching and earn</Text>
            </View>
            <Text style={styles.actionArrow}>â€º</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('PaymentMethods')}
        >
          <Text style={styles.actionIcon}>ðŸ’³</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Payment Methods</Text>
            <Text style={styles.actionDesc}>Manage your cards</Text>
          </View>
          <Text style={styles.actionArrow}>â€º</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Support')}
        >
          <Text style={styles.actionIcon}>ðŸ’¬</Text>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Help & Support</Text>
            <Text style={styles.actionDesc}>Contact our team</Text>
          </View>
          <Text style={styles.actionArrow}>â€º</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>ðŸšª Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.versionText}>EduTalk v4.5.0</Text>
        <Text style={styles.copyText}>Â© 2026 EduTalk. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  hostBadge: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#667eea',
  },
  hostBadgeText: {
    color: '#667eea',
    fontSize: 12,
    fontWeight: '600',
  },
  statsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  preferencesSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  preferenceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  preferenceDesc: {
    fontSize: 12,
    color: '#999',
  },
  actionsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
    color: '#999',
  },
  actionArrow: {
    fontSize: 18,
    color: '#ccc',
    marginLeft: 8,
  },
  logoutButton: {
    backgroundColor: '#fff3f3',
    borderBottomWidth: 0,
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: 'center',
    marginTop: 12,
  },
  logoutButtonText: {
    color: '#ff4757',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  copyText: {
    fontSize: 11,
    color: '#ccc',
  },
});

export default ProfileScreen;

