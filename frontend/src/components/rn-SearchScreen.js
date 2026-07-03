/**
 * React Native - Search Screen
 * Search for classes with real-time filtering
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import api from '../utils/api';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      performSearch();
    } else {
      setResults([]);
    }
  }, [searchQuery]);

  const loadRecentSearches = async () => {
    try {
      // Load from local storage
      // For now, use mock data
      setRecentSearches(['JavaScript', 'Python', 'Design', 'Business']);
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/classes/search', {
        params: {
          q: searchQuery,
          limit: 20,
        },
      });

      setResults(response.data || []);
    } catch (err) {
      setError('Search failed. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Save to recent searches
    if (!recentSearches.includes(query)) {
      setRecentSearches([query, ...recentSearches.slice(0, 4)]);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={() => navigation.navigate('ClassDetails', { classId: item.id })}
    >
      <View>
        <Text style={styles.resultTitle}>{item.title}</Text>
        <Text style={styles.resultHost}>by {item.host?.name}</Text>
        <Text style={styles.resultCategory}>{item.category}</Text>
      </View>
      <View style={styles.resultPrice}>
        <Text style={styles.price}>${item.basePriceMonth}</Text>
        <Text style={styles.perMonth}>/mo</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentSearch = (query) => (
    <TouchableOpacity
      key={query}
      style={styles.recentBadge}
      onPress={() => handleSearch(query)}
    >
      <Text style={styles.recentText}>🕐 {query}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search classes..."
            placeholderTextColor="#ccc"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results or Recent Searches */}
      {searchQuery.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Search Classes</Text>
          <Text style={styles.emptySubtitle}>
            Find courses by title, category, or instructor
          </Text>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.recentTitle}>Recent Searches</Text>
              <View style={styles.recentList}>
                {recentSearches.map(renderRecentSearch)}
              </View>
            </View>
          )}

          {/* Suggested Categories */}
          <View style={styles.suggestedSection}>
            <Text style={styles.suggestedTitle}>Popular Categories</Text>
            <View style={styles.categoryGrid}>
              {['Programming', 'Design', 'Business', 'Music'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.categoryCard}
                  onPress={() => handleSearch(cat)}
                >
                  <Text style={styles.categoryName}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.resultsSection}>
          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#667eea" />
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.noResults}>
                No classes found for "{searchQuery}"
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              scrollEnabled
            />
          )}
        </View>
      )}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  clearButton: {
    fontSize: 18,
    color: '#999',
    padding: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 32,
  },
  recentSection: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 24,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  recentList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentBadge: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0ff',
  },
  recentText: {
    fontSize: 12,
    color: '#667eea',
  },
  suggestedSection: {
    width: '100%',
    paddingHorizontal: 16,
    marginTop: 32,
  },
  suggestedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  resultsSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#ff4757',
    textAlign: 'center',
  },
  noResults: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultHost: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resultCategory: {
    fontSize: 11,
    backgroundColor: '#f0f7ff',
    color: '#667eea',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  resultPrice: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
  perMonth: {
    fontSize: 11,
    color: '#999',
  },
});

export default SearchScreen;
