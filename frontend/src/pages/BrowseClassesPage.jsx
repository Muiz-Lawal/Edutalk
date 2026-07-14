import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/BrowseClasses.css';
import { useNavigate } from 'react-router-dom';
import useEventLogger from '../hooks/useEventLogger';

export default function BrowseClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationSummary, setRecommendationSummary] = useState('Recommended for you');
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const navigate = useNavigate();

  const categories = [
    'Technology',
    'Music',
    'Business',
    'Design',
    'Languages',
    'Fitness',
    'Science',
    'Arts',
    'Cooking',
    'Photography',
  ];

  useEffect(() => {
    fetchClasses();
    fetchRecommendations();
  }, [category]);

  const { logEvent } = useEventLogger();
  const recommendationViewLogged = useRef(false);

  useEffect(() => {
    // Page view event
    logEvent({ action: 'view_browse', targetType: 'page' });
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/classes', {
        params: { category, search, limit: 20 },
      });
      setClasses(response.data.classes);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    recommendationViewLogged.current = false;
    setRecommendationLoading(true);
    try {
      const response = await api.get('/classes/recommendations', {
        params: { limit: 6, category },
      });
      setRecommendations(response.data.recommendations || []);
      setRecommendationSummary(response.data.summary || 'Recommended for you');
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      setRecommendations([]);
    } finally {
      setRecommendationLoading(false);
    }
  };

  useEffect(() => {
    if (!recommendationLoading && recommendations.length > 0 && !recommendationViewLogged.current) {
      recommendationViewLogged.current = true;
      logEvent({
        action: 'view_recommendation_section',
        targetType: 'section',
        value: recommendations.length,
        metadata: { category },
      });
    }
  }, [recommendationLoading, recommendations, category, logEvent]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchClasses();
    fetchRecommendations();
  };

  return (
    <div className="browse-page">
      <div className="container">
        <div className="browse-header">
          <h1>Explore Classes</h1>
          <p>Find the perfect class to learn something new</p>
        </div>

        <div className="browse-filters">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search classes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          <div className="category-filters">
            <button
              className={`category-btn ${!category ? 'active' : ''}`}
              onClick={() => setCategory('')}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-btn ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <section className="recommendation-section">
          <div className="recommendation-header">
            <h2>{recommendationSummary}</h2>
            {recommendationLoading && <span>Loading recommendations...</span>}
          </div>
          {recommendationLoading ? (
            <LoadingSpinner variant="centered" size="medium" message="Loading recommendations..." />
          ) : recommendations.length > 0 ? (
            <div className="recommendations-grid">
              {recommendations.map((classItem) => (
                <div
                  key={classItem._id}
                  className="class-card"
                  onClick={() => { logEvent({ action: 'click_recommendation_card', targetType: 'class', targetId: classItem._id }); navigate(`/class/${classItem._id}`); }}
                >
                  <div className="class-thumbnail">
                    {classItem.thumbnailImage ? (
                      <img src={classItem.thumbnailImage} alt={classItem.title} />
                    ) : (
                      <div className="placeholder-thumbnail">📚</div>
                    )}
                  </div>
                  <div className="class-info">
                    <h3>{classItem.title}</h3>
                    <p className="host-name">{classItem.hostId?.firstName}</p>
                    <div className="class-meta">
                      <span className="price">${(classItem.monthlyPrice / 30).toFixed(2)}/day</span>
                      <span className="rating">⭐ {classItem.averageRating?.toFixed(1) || '0'}</span>
                    </div>
                    <p className="description">{classItem.description?.substring(0, 80)}...</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-results">No personalized recommendations available yet.</div>
          )}
        </section>

        {loading ? (
          <LoadingSpinner variant="centered" size="medium" message="Loading classes..." />
        ) : classes.length > 0 ? (
          <div className="classes-grid">
            {classes.map((classItem) => (
              <div
                key={classItem._id}
                className="class-card"
                onClick={() => { logEvent({ action: 'click_class_card', targetType: 'class', targetId: classItem._id }); navigate(`/class/${classItem._id}`); }}
              >
                <div className="class-thumbnail">
                  {classItem.thumbnailImage ? (
                    <img src={classItem.thumbnailImage} alt={classItem.title} />
                  ) : (
                    <div className="placeholder-thumbnail">📚</div>
                  )}
                </div>

                <div className="class-info">
                  <h3>{classItem.title}</h3>
                  <p className="host-name">{classItem.hostId?.firstName}</p>

                  <div className="class-meta">
                    <span className="price">
                      ${(classItem.monthlyPrice / 30).toFixed(2)}/day
                    </span>
                    <span className="rating">
                      ⭐ {classItem.averageRating?.toFixed(1) || '0'} ({classItem.totalReviews})
                    </span>
                  </div>

                  <p className="description">{classItem.description?.substring(0, 100)}...</p>

                  <div className="class-footer">
                    <span className="enrolled">{classItem.totalEnrolled} students</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">No classes found. Try adjusting your filters.</div>
        )}
      </div>
    </div>
  );
}
