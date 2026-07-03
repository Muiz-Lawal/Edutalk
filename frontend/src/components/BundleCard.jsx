import React from 'react';
import { Link } from 'react-router-dom';
import DynamicPriceDisplay from './DynamicPriceDisplay';
import '../styles/BundleCard.css';

export default function BundleCard({ bundle }) {
  const formatPrice = (price) => `$${price.toFixed(2)}`;

  const calculateSavings = () => {
    const original = bundle.pricing.totalOriginalPrice;
    const bundlePrice = bundle.pricing.totalBundlePrice;
    const savings = original - bundlePrice;
    const percentage = original > 0 ? Math.round((savings / original) * 100) : 0;
    return { amount: savings, percentage };
  };

  const savings = calculateSavings();

  return (
    <div className="bundle-card">
      <div className="bundle-header">
        <div className="bundle-category">{bundle.category}</div>
        {savings.percentage > 0 && (
          <div className="bundle-discount-badge">
            Save {savings.percentage}%
          </div>
        )}
      </div>

      <div className="bundle-content">
        <h3 className="bundle-title">{bundle.title}</h3>
        <p className="bundle-description">{bundle.description}</p>

        <div className="bundle-classes">
          <h4>{bundle.classes.length} Classes Included:</h4>
          <ul className="class-list">
            {bundle.classes.slice(0, 3).map((cls, idx) => (
              <li key={idx} className="class-item">
                <span className="class-name">{cls.title}</span>
                <span className="class-price">
                  {formatPrice(cls.bundlePrice)}
                  {cls.bundlePrice < cls.originalPrice && (
                    <span className="original-price">{formatPrice(cls.originalPrice)}</span>
                  )}
                </span>
              </li>
            ))}
            {bundle.classes.length > 3 && (
              <li className="class-item more">
                +{bundle.classes.length - 3} more classes
              </li>
            )}
          </ul>
        </div>

        <div className="bundle-pricing">
          <div className="pricing-breakdown">
            <span className="original-total">
              Total: ${bundle.pricing.totalOriginalPrice.toFixed(2)}
            </span>
            <div className="dynamic-price-container">
              <span className="bundle-label">Bundle Price:</span>
              <DynamicPriceDisplay
                bundleId={bundle._id}
                basePrice={bundle.pricing.totalBundlePrice}
              />
            </div>
          </div>
          {savings.amount > 0 && (
            <div className="savings-amount">
              Base savings: ${savings.amount.toFixed(2)}
            </div>
          )}
        </div>

        <div className="bundle-meta">
          <div className="bundle-host">
            By {bundle.host?.firstName} {bundle.host?.lastName}
          </div>
          <div className="bundle-stats">
            <span className="enrollment-count">
              {bundle.settings.enrollmentCount} enrolled
            </span>
            {bundle.host?.averageRating > 0 && (
              <span className="host-rating">
                ⭐ {bundle.host.averageRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bundle-actions">
        <Link to={`/bundle/${bundle._id}`} className="btn btn-primary">
          View Bundle Details
        </Link>
        <button className="btn btn-secondary">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
