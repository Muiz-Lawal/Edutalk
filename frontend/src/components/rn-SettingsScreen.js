/**
 * React Native Settings Screen
 * User preferences and app settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Switch,
  
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Linking,
} from 'react-native';
import crossAlert from '../utils/crossPlatformAlert';
import { useAuth } from '../context/RNAuthContext';
import api from '../utils/api';

export default function SettingsScreen({ navigation }) {
  const { user, logout, updateProfile } = useAuth();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
    autoPlayVideo: true,
    quality: 'auto',
    darkMode: false,
    dataUsageSaving: false,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load user settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Load settings from device storage
      const savedSettings = await getStoredSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Load settings error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStoredSettings = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const stored = await AsyncStorage.getItem('app_settings');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      setSaving(true);
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      crossAlert('Error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleQualityChange = (quality) => {
    const newSettings = { ...settings, quality };
    saveSettings(newSettings);
  };

  const handleLogout = () => {
    crossAlert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              crossAlert('Error', 'Logout failed');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    crossAlert(
      'Delete Account',
      'This action cannot be undone. All your data will be deleted.',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              setSaving(true);
              await api.delete('/auth/account');
              await logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              crossAlert('Error', error.response?.data?.message || 'Failed to delete account');
            } finally {
              setSaving(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.name}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.toggleItem}>
            <Text style={styles.label}>Push Notifications</Text>
            <Switch
              value={settings.pushNotifications}
              onValueChange={() => handleToggle('pushNotifications')}
              trackColor={{ false: '#ccc', true: '#81c784' }}
              thumbColor={settings.pushNotifications ? '#4caf50' : '#f0f0f0'}
            />
          </View>

          <View style={styles.toggleItem}>
            <Text style={styles.label}>Email Notifications</Text>
            <Switch
              value={settings.emailNotifications}
              onValueChange={() => handleToggle('emailNotifications')}
              trackColor={{ false: '#ccc', true: '#81c784' }}
              thumbColor={settings.emailNotifications ? '#4caf50' : '#f0f0f0'}
            />
          </View>

          <View style={styles.toggleItem}>
            <Text style={styles.label}>Sound</Text>
            <Switch
              value={settings.soundEnabled}
              onValueChange={() => handleToggle('soundEnabled')}
              trackColor={{ false: '#ccc', true: '#81c784' }}
              thumbColor={settings.soundEnabled ? '#4caf50' : '#f0f0f0'}
            />
          </View>
        </View>

        {/* Playback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback</Text>
          
          <View style={styles.toggleItem}>
            <Text style={styles.label}>Auto-play Videos</Text>
            <Switch
              value={settings.autoPlayVideo}
              onValueChange={() => handleToggle('autoPlayVideo')}
              trackColor={{ false: '#ccc', true: '#81c784' }}
              thumbColor={settings.autoPlayVideo ? '#4caf50' : '#f0f0f0'}
            />
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.label}>Video Quality</Text>
            <View style={styles.qualityButtons}>
              {['auto', '720p', '480p', '360p'].map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[
                    styles.qualityButton,
                    settings.quality === q && styles.qualityButtonActive,
                  ]}
                  onPress={() => handleQualityChange(q)}
                >
                  <Text
                    style={[
                      styles.qualityButtonText,
                      settings.quality === q && styles.qualityButtonTextActive,
                    ]}
                  >
                    {q === 'auto' ? 'Auto' : q}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Data Usage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Usage</Text>
          
          <View style={styles.toggleItem}>
            <Text style={styles.label}>Save Data Mode</Text>
            <Switch
              value={settings.dataUsageSaving}
              onValueChange={() => handleToggle('dataUsageSaving')}
              trackColor={{ false: '#ccc', true: '#81c784' }}
              thumbColor={settings.dataUsageSaving ? '#4caf50' : '#f0f0f0'}
            />
          </View>

          <Text style={styles.hint}>
            Reduces video quality and disables auto-play to save data
          </Text>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.toggleItem}>
            <Text style={styles.label}>Dark Mode</Text>
            <Switch
              value={settings.darkMode}
              onValueChange={() => handleToggle('darkMode')}
              trackColor={{ false: '#ccc', true: '#81c784' }}
              thumbColor={settings.darkMode ? '#4caf50' : '#f0f0f0'}
            />
          </View>
        </View>

        {/* Help & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>
          
          <TouchableOpacity 
            style={styles.link}
            onPress={() => Linking.openURL('https://edutalk.app/privacy')}
          >
            <Text style={styles.linkText}>Privacy Policy</Text>
            <Text style={styles.linkArrow}>â€º</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.link}
            onPress={() => Linking.openURL('https://edutalk.app/terms')}
          >
            <Text style={styles.linkText}>Terms of Service</Text>
            <Text style={styles.linkArrow}>â€º</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.link}
            onPress={() => Linking.openURL('https://edutalk.app/contact')}
          >
            <Text style={styles.linkText}>Contact Support</Text>
            <Text style={styles.linkArrow}>â€º</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          
          <TouchableOpacity 
            style={[styles.button, styles.dangerButton]}
            onPress={handleLogout}
            disabled={saving}
          >
            <Text style={styles.dangerButtonText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.destructiveButton]}
            onPress={handleDeleteAccount}
            disabled={saving}
          >
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.footer}>
          <Text style={styles.version}>EduTalk v1.0.0</Text>
          <Text style={styles.copyright}>Â© 2026 EduTalk. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  dangerTitle: {
    color: '#dc2626',
  },
  settingItem: {
    marginBottom: 16,
  },
  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  value: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 8,
  },
  qualityButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  qualityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    flex: 1,
  },
  qualityButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  qualityButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  qualityButtonTextActive: {
    color: '#fff',
  },
  link: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  linkText: {
    fontSize: 15,
    color: '#3b82f6',
  },
  linkArrow: {
    fontSize: 20,
    color: '#9ca3af',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  dangerButton: {
    backgroundColor: '#f97316',
  },
  destructiveButton: {
    backgroundColor: '#ef4444',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  version: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  copyright: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});

