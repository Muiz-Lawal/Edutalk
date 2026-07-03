import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import BundleCard from '../components/BundleCard';
import 'C:/Users/abdul/Desktop/class/frontend/src/styles/BundleBrowser.css';

export default function BundleBrowser() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'newest'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchBundles();
  }, [filters, pagination.page]);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        sortBy: filters.sortBy,
        ...(filters.category && { category: filters.category }),
        ...(filters.minPrice && { minPrice: filters.minPrice }),
        ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await api.get(`/bundles?${params}`);
      setBundles(response.data.bundles);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (err) {
      setError('Failed to load bundles');
      console.error('Fetch bundles error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchBundles();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const categories = [
    'All Categories',
    'Technology',
    'Business',
    'Design',
    'Marketing',
    'Language',
    'Science',
    'Arts',
    'Health & Fitness',
    'Other'
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'rating', label: 'Highest Rated' }
  ];

  if (loading && bundles.length === 0) {
    return (
      <div className="bundle-browser">
        <div className="loading">Loading bundles...</div>
      </div>
    );
  }

  return (
    <div className="bundle-browser">
      <div className="browser-header">
        <h1>Course Bundles</h1>
        <p>Save money by purchasing multiple courses together</p>
      </div>

      <div className="browser-controls">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search bundles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">Search</button>
        </form>

        <div className="filters">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="filter-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat === 'All Categories' ? '' : cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="filter-select"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchBundles} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      <div className="bundles-grid">
        {bundles.length === 0 && !loading ? (
          <div className="no-bundles">
            <h3>No bundles found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        ) : (
          bundles.map(bundle => (
            <BundleCard key={bundle._id} bundle={bundle} />
          ))
        )}
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            className="page-btn"
          >
            Previous
          </button>

          <span className="page-info">
            Page {pagination.page} of {pagination.pages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
            className="page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
