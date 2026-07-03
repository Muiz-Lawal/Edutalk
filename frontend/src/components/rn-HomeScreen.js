/**
 * React Native - HomeScreen (Dashboard)
 * Mobile home dashboard showing recent classes, enrollments, and notifications
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import api from '../utils/api';

const HomeScreen = ({ navigation, user }) => {
  const [data, setData] = useState({
    upcomingClasses: [],
    enrolledClasses: [],
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [upcomingRes, enrolledRes, activityRes] = await Promise.all([
        api.get('/streams/upcoming?limit=5'),
        api.get('/my-classes?limit=5'),
        api.get('/activity?limit=10'),
      ]);

      setData({
        upcomingClasses: upcomingRes.data || [],
        enrolledClasses: enrolledRes.data || [],
        recentActivity: activityRes.data || [],
      });
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Welcome back, {user?.name}! 👋</Text>
        <Text style={styles.welcomeSubtitle}>Ready to learn something new?</Text>
      </View>

      {/* Upcoming Classes */}
      {data.upcomingClasses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Classes</Text>
          {data.upcomingClasses.map((cls) => (
            <TouchableOpacity
              key={cls.id}
              style={styles.classCard}
              onPress={() => navigation.navigate('ClassDetails', { classId: cls.id })}
            >
              <View style={styles.classCardHeader}>
                <Text style={styles.className}>{cls.title}</Text>
                <Text style={styles.liveStatus}>📡 Live Soon</Text>
              </View>
              <Text style={styles.classHost}>Host: {cls.host?.name}</Text>
              <Text style={styles.classTime}>
                ⏰ {new Date(cls.scheduledAt).toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Browse')}
          >
            <Text style={styles.actionIcon}>🎓</Text>
            <Text style={styles.actionLabel}>Browse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('MyClasses')}
          >
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionLabel}>My Classes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionLabel}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Enrolled Classes */}
      {data.enrolledClasses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Enrolled Classes</Text>
          {data.enrolledClasses.map((cls) => (
            <TouchableOpacity
              key={cls.id}
              style={styles.enrolledCard}
              onPress={() => navigation.navigate('ClassDetails', { classId: cls.id })}
            >
              <View style={styles.enrolledHeader}>
                <Text style={styles.enrolledTitle}>{cls.title}</Text>
                <Text style={styles.progress}>🔄 {cls.progress || 0}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${cls.progress || 0}%` },
                  ]}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  classCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  className: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  liveStatus: {
    fontSize: 12,
    color: '#ff4757',
    fontWeight: '600',
  },
  classHost: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  classTime: {
    fontSize: 12,
    color: '#999',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  enrolledCard: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  enrolledHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  enrolledTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  progress: {
    fontSize: 12,
    color: '#667eea',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
  },
});

export default HomeScreen;
