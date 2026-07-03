/**
 * React Native - Browse Classes Screen
 * Browse and search available classes with filters
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import api from '../utils/api';

const BrowseClassesScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'programming', label: 'Programming' },
    { id: 'business', label: 'Business' },
    { id: 'design', label: 'Design' },
    { id: 'music', label: 'Music' },
    { id: 'fitness', label: 'Fitness' },
  ];

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    filterClasses();
  }, [searchQuery, selectedCategory, sortBy, classes]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/classes?limit=50');
      setClasses(response.data || []);
    } catch (error) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterClasses = () => {
    let result = classes;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((c) => c.category === selectedCategory);
    }

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.host?.name.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'newest') {
      result = result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'price-low') {
      result = result.sort((a, b) => a.basePriceMonth - b.basePriceMonth);
    } else if (sortBy === 'price-high') {
      result = result.sort((a, b) => b.basePriceMonth - a.basePriceMonth);
    } else if (sortBy === 'rating') {
      result = result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    setFilteredClasses(result);
  };

  const renderClassCard = ({ item }) => (
    <TouchableOpacity
      style={styles.classCard}
      onPress={() => navigation.navigate('ClassDetails', { classId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {(item.rating || 0).toFixed(1)}</Text>
        </View>
      </View>

      <Text style={styles.cardDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.cardMeta}>
        <Text style={styles.hostName}>👨‍🏫 {item.host?.name}</Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.price}>${item.basePriceMonth}/month</Text>
        <TouchableOpacity
          style={styles.enrollButton}
          onPress={() => navigation.navigate('Checkout', { classId: item.id })}
        >
          <Text style={styles.enrollText}>Enroll</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#667eea" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search classes..."
          placeholderTextColor="#ccc"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesSection}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryBadge,
                selectedCategory === cat.id && styles.categoryBadgeActive,
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort Options */}
        <View style={styles.sortSection}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <View style={styles.sortOptions}>
            {['newest', 'price-low', 'price-high', 'rating'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.sortButton,
                  sortBy === option && styles.sortButtonActive,
                ]}
                onPress={() => setSortBy(option)}
              >
                <Text
                  style={[
                    styles.sortButtonText,
                    sortBy === option && styles.sortButtonTextActive,
                  ]}
                >
                  {option === 'newest'
                    ? 'Newest'
                    : option === 'price-low'
                    ? 'Price: Low'
                    : option === 'price-high'
                    ? 'Price: High'
                    : 'Rating'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Classes List */}
        {filteredClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No classes found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search filters</Text>
          </View>
        ) : (
          <View style={styles.classList}>
            {filteredClasses.map((item) => (
              <View key={item.id}>
                {renderClassCard({ item })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  searchSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  categoriesSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  categoryBadgeActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  sortSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sortLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  sortButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  classList: {
    padding: 16,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
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
  cardDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  hostName: {
    fontSize: 12,
    color: '#999',
  },
  category: {
    fontSize: 11,
    backgroundColor: '#f0f7ff',
    color: '#667eea',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontWeight: '500',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
  enrollButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  enrollText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#999',
  },
});

export default BrowseClassesScreen;
