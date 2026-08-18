import React, { useState, useEffect } from 'react';
import { getClasses, getCategories } from '../utils/api';
import ClassCard from '../components/ClassCard';
import '../styles/ClassBrowse.css';

export default function ClassBrowsePage() {
  const [classes, setClasses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    category: 'All',
    page: 1,
    limit: 12,
    search: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  // Fetch categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(['All', ...cats]);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };

    loadCategories();
  }, []);

  // Fetch classes
  useEffect(() => {
    const loadClasses = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getClasses({
          category: filters.category === 'All' ? '' : filters.category,
          page: filters.page,
          limit: filters.limit,
          search: filters.search,
        });

        setClasses(data.classes);
        setPagination(data.pagination);
      } catch (err) {
        setError(err.message || 'Failed to load classes');
        console.error('Error loading classes:', err);
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, [filters]);

  const handleCategoryChange = (category) => {
    setFilters((prev) => ({
      ...prev,
      category,
      page: 1, // Reset to first page
    }));
  };

  const handleSearchChange = (e) => {
    const search = e.target.value;
    setFilters((prev) => ({
      ...prev,
      search,
      page: 1, // Reset to first page
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="browse-page">
      <div className="browse-page__header">
        <h1 className="browse-page__title">Browse Classes</h1>
        <p className="browse-page__subtitle">Discover thousands of classes taught by experts</p>
      </div>

      <div className="browse-page__filters">
        {/* Search */}
        <input
          type="text"
          placeholder="Search classes..."
          className="browse-page__search"
          value={filters.search}
          onChange={handleSearchChange}
        />

        {/* Category Filter */}
        <div className="browse-page__categories">
          {categories.map((category) => (
            <button
              key={category}
              className={`browse-page__category-btn ${
                filters.category === category ? 'browse-page__category-btn--active' : ''
              }`}
              onClick={() => handleCategoryChange(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="browse-page__loading">
          <p>Loading classes...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="browse-page__error">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Classes Grid */}
      {!loading && classes.length > 0 && (
        <>
          <div className="browse-page__grid">
            {classes.map((classItem) => (
              <ClassCard key={classItem._id} classData={classItem} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="browse-page__pagination">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`browse-page__page-btn ${
                    pagination.currentPage === page ? 'browse-page__page-btn--active' : ''
                  }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && classes.length === 0 && (
        <div className="browse-page__empty">
          <h2>No classes found</h2>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
