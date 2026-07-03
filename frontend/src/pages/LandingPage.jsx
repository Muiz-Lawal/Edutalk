import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Learn From Experts, Pay Only For What You Want</h1>
          <p>
            A live video conferencing platform where every class requires payment.
            No free links. No open rooms. True value for every minute learned.
          </p>
          <div className="hero-buttons">
            <Link to="/browse" className="btn btn-primary">
              Browse Classes
            </Link>
            <Link to="/signup" className="btn btn-secondary">
              Start Teaching
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2>Why EduTalk?</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">💰</div>
              <h3>Flexible Pricing</h3>
              <p>Pay for only the days you want. Start with 1-3 days, upgrade anytime.</p>
            </div>

            <div className="feature">
              <div className="feature-icon">🎓</div>
              <h3>Expert Teachers</h3>
              <p>Learn from verified professionals in any field - tech, music, fitness, and more.</p>
            </div>

            <div className="feature">
              <div className="feature-icon">🎥</div>
              <h3>Live & Recorded</h3>
              <p>Join live sessions or watch recordings with AI-generated summaries and transcripts.</p>
            </div>

            <div className="feature">
              <div className="feature-icon">🌍</div>
              <h3>Global Reach</h3>
              <p>Learn in your local currency from instructors around the world.</p>
            </div>

            <div className="feature">
              <div className="feature-icon">📊</div>
              <h3>Track Progress</h3>
              <p>Monitor attendance, completion percentage, and earn certificates of completion.</p>
            </div>

            <div className="feature">
              <div className="feature-icon">🔒</div>
              <h3>Secure Access</h3>
              <p>Access codes tied to your email ensure only you can join with your paid access.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section className="pricing-info">
        <div className="container">
          <h2>For Students</h2>
          <div className="pricing-example">
            <p>If a class costs $100/month, here's what you pay:</p>
            <div className="pricing-table">
              <div className="pricing-row">
                <span>1-3 days:</span>
                <span className="price">$6.00/day</span>
              </div>
              <div className="pricing-row">
                <span>4-6 days:</span>
                <span className="price">$5.00/day</span>
              </div>
              <div className="pricing-row">
                <span>7-13 days:</span>
                <span className="price">$4.17/day</span>
              </div>
              <div className="pricing-row">
                <span>14-20 days:</span>
                <span className="price">$3.67/day</span>
              </div>
              <div className="pricing-row">
                <span>21-30 days:</span>
                <span className="price">$3.33/day</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Start?</h2>
          <p>Join thousands of students and teachers on EduTalk today</p>
          <div className="cta-buttons">
            <Link to="/browse" className="btn btn-primary">
              Find Your First Class
            </Link>
            <Link to="/signup" className="btn btn-secondary">
              Become an Instructor
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2024 EduTalk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
