/**
 * React Native Notifications Screen
 * Display user notifications and manage them
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  FlatList,
  
  RefreshControl,
} from 'react-native';
import crossAlert from '../utils/crossPlatformAlert';
import { useFocusEffect } from '@react-navigation/native';
import api from '../utils/api';
import { useAuth } from '../context/RNAuthContext';

export default function NotificationsScreen({ navigation }) {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data);

      // Count unread
      const unread = response.data.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Fetch notifications error:', error);
      crossAlert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}`, { read: true });
      
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Mark all as read error:', error);
      crossAlert('Error', 'Failed to mark all as read');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      
      setNotifications(prev =>
        prev.filter(n => n._id !== notificationId)
      );

      const deletedNotification = notifications.find(n => n._id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Delete notification error:', error);
      crossAlert('Error', 'Failed to delete notification');
    }
  };

  const deleteAllNotifications = async () => {
    crossAlert(
      'Delete All',
      'Are you sure you want to delete all notifications?',
      [
        { text: 'Cancel', onPress: () => {}, style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              await api.delete('/notifications');
              setNotifications([]);
              setUnreadCount(0);
            } catch (error) {
              crossAlert('Error', 'Failed to delete notifications');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const getFilteredNotifications = () => {
    if (filter === 'unread') {
      return notifications.filter(n => !n.read);
    }
    if (filter === 'read') {
      return notifications.filter(n => n.read);
    }
    return notifications;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return 'ðŸ’¬';
      case 'alert':
        return 'âš ï¸';
      case 'info':
        return 'â„¹ï¸';
      case 'success':
        return 'âœ…';
      case 'error':
        return 'âŒ';
      default:
        return 'ðŸ””';
    }
  };

  const handleNotificationPress = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate to relevant screen based on notification type
    if (notification.link) {
      navigation.navigate('ClassDetails', { classId: notification.link });
    }
  };

  const filteredNotifications = getFilteredNotifications();

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.read && styles.notificationCardUnread,
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationTitle}>
          <Text style={styles.notificationIcon}>
            {getNotificationIcon(item.type)}
          </Text>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.notificationHeading,
                !item.read && styles.notificationHeadingBold,
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={styles.notificationTime}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>

        {!item.read && (
          <View style={styles.unreadIndicator} />
        )}
      </View>

      <Text
        style={styles.notificationMessage}
        numberOfLines={2}
      >
        {item.message}
      </Text>

      <View style={styles.notificationFooter}>
        <TouchableOpacity
          onPress={() => handleNotificationPress(item)}
          disabled={item.read}
        >
          <Text style={styles.notificationAction}>
            {item.read ? 'View' : 'Mark as read'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => deleteNotification(item._id)}
        >
          <Text style={styles.notificationDelete}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllButton}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {['all', 'unread', 'read'].map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterTab,
              filter === filterOption && styles.filterTabActive,
            ]}
            onPress={() => setFilter(filterOption)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === filterOption && styles.filterTabTextActive,
              ]}
            >
              {filterOption === 'all'
                ? 'All'
                : filterOption === 'unread'
                ? `Unread (${notifications.filter(n => !n.read).length})`
                : `Read (${notifications.filter(n => n.read).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>ðŸ””</Text>
          <Text style={styles.emptyStateTitle}>
            {filter === 'unread'
              ? 'No unread notifications'
              : filter === 'read'
              ? 'No read notifications'
              : 'No notifications yet'}
          </Text>
          <Text style={styles.emptyStateSubtitle}>
            {filter === 'all'
              ? 'You're all caught up!'
              : 'Check back later'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Delete All Button */}
      {notifications.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.deleteAllButton}
            onPress={deleteAllNotifications}
          >
            <Text style={styles.deleteAllButtonText}>Delete All Notifications</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  unreadBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  markAllButton: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  filterTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  filterTabTextActive: {
    color: '#3b82f6',
  },
  listContent: {
    padding: 8,
  },
  notificationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 8,
    marginVertical: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#e5e7eb',
  },
  notificationCardUnread: {
    borderLeftColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationHeading: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  notificationHeadingBold: {
    color: '#111827',
    fontWeight: '700',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8,
    marginTop: 4,
  },
  notificationMessage: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  notificationAction: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  notificationDelete: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  deleteAllButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteAllButtonText: {
    color: '#991b1b',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

