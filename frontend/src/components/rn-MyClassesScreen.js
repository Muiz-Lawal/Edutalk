/**
 * React Native - MyClassesScreen
 * Display user's enrolled and created classes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/RNAuthContext';
import api from '../utils/api';

const { width: screenWidth } = Dimensions.get('window');

const MyClassesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('enrolled');

  useEffect(() => {
    loadClasses();
  }, [selectedTab]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      
      let url = '/my-classes';
      if (selectedTab === 'created' && user?.isHost) {
        url = '/my-classes?type=created';
      } else if (selectedTab === 'enrolled') {
        url = '/my-classes?type=enrolled';
      }

      const response = await api.get(url);
      setClasses(response.data || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClasses();
    setRefreshing(false);
  };

  const renderClassCard = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.classCard}
      onPress={() => navigation.navigate('ClassDetails', { classId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleArea}>
          <Text style={styles.classTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.instructor}>
            {selectedTab === 'created' ? '👨‍🏫 Your Class' : `by ${item.host?.name}`}
          </Text>
        </View>
        {item.rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {item.rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* Progress Bar (for enrolled) */}
      {selectedTab === 'enrolled' && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${(item.progress || 0)}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {item.progress || 0}% Complete
          </Text>
        </View>
      )}

      {/* Class Info */}
      <View style={styles.cardFooter}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>📚 {item.lessonsCount || 0} lessons</Text>
          <Text style={styles.infoLabel}>⏱️ {item.duration || 'Self-paced'}</Text>
        </View>

        {selectedTab === 'enrolled' && item.lastAccessed && (
          <Text style={styles.lastAccessed}>
            Last accessed: {new Date(item.lastAccessed).toLocaleDateString()}
          </Text>
        )}

        {selectedTab === 'created' && (
          <View style={styles.statsRow}>
            <Text style={styles.stat}>
              👥 {item.enrolledCount || 0} students
            </Text>
            <Text style={styles.stat}>
              💰 ${item.earnings || 0} earned
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {selectedTab === 'enrolled' ? (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, styles.continueBtn]}
              onPress={() => navigation.navigate('ClassDetails', { classId: item.id })}
            >
              <Text style={styles.continueBtnText}>Continue Learning</Text>
            </TouchableOpacity>
            {item.hasLiveSession && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.joinBtn]}
                onPress={() => navigation.navigate('LiveStream', { classId: item.id })}
              >
                <Text style={styles.joinBtnText}>Join Live 🔴</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={() => navigation.navigate('EditClass', { classId: item.id })}
            >
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.analyticsBtn]}
              onPress={() => navigation.navigate('ClassAnalytics', { classId: item.id })}
            >
              <Text style={styles.analyticsBtnText}>📊 Analytics</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'enrolled' && styles.tabActive]}
          onPress={() => setSelectedTab('enrolled')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'enrolled' && styles.tabTextActive,
            ]}
          >
            📚 Enrolled
          </Text>
        </TouchableOpacity>
        {user?.isHost && (
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'created' && styles.tabActive]}
            onPress={() => setSelectedTab('created')}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === 'created' && styles.tabTextActive,
              ]}
            >
              👨‍🏫 Created
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      ) : classes.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>
            {selectedTab === 'enrolled' ? '📚' : '👨‍🏫'}
          </Text>
          <Text style={styles.emptyText}>
            {selectedTab === 'enrolled'
              ? 'No enrolled classes yet'
              : 'No created classes yet'}
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() =>
              navigation.navigate('BrowseTab', {
                screen: 'Browse',
              })
            }
          >
            <Text style={styles.browseBtnText}>
              {selectedTab === 'enrolled'
                ? '🎓 Browse Classes'
                : '➕ Create a Class'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.classList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {classes.map(renderClassCard)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabActive: {
    borderBottomColor: '#667eea',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  tabTextActive: {
    color: '#667eea',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  browseBtn: {
    backgroundColor: '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  classList: {
    padding: 16,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleArea: {
    flex: 1,
    marginRight: 8,
  },
  classTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  instructor: {
    fontSize: 12,
    color: '#666',
  },
  ratingBadge: {
    backgroundColor: '#fff3cd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ff6b00',
  },
  progressSection: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
  },
  progressText: {
    fontSize: 11,
    color: '#999',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
  },
  lastAccessed: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    fontSize: 12,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtn: {
    backgroundColor: '#667eea',
  },
  continueBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  joinBtn: {
    backgroundColor: '#ff4757',
  },
  joinBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  editBtn: {
    backgroundColor: '#f0f7ff',
  },
  editBtnText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 12,
  },
  analyticsBtn: {
    backgroundColor: '#f0f7ff',
  },
  analyticsBtnText: {
    color: '#667eea',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default MyClassesScreen;
