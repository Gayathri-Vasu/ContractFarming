import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ currentUser }) => {
  return (
    <section className="page home-page">
      <div className="hero">
        <div className="hero-content">
          <h1>
            Assured Contract Farming
            <span className="hero-highlight"> for Stable Market Access</span>
          </h1>
          <p className="hero-tagline">
            Connect farmers with guaranteed buyers through transparent
            agreements, stable pricing, and secure payments. Reduce market risk
            and stabilise your income.
          </p>
          <div className="hero-actions">
            <Link to="/marketplace" className="btn-primary hero-btn">
              Explore Marketplace
            </Link>
            {!currentUser && (
              <Link to="/register" className="btn-outline hero-btn">
                Join as Farmer or Buyer
              </Link>
            )}
          </div>
          <div className="hero-metrics">
            <div className="metric">
              <span className="metric-value">0%</span>
              <span className="metric-label">Auction Anxiety</span>
            </div>
            <div className="metric">
              <span className="metric-value">100%</span>
              <span className="metric-label">Price Transparency</span>
            </div>
            <div className="metric">
              <span className="metric-value">24/7</span>
              <span className="metric-label">Secure Payments</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="orbit-card orbit-farmer">
            <h3>Farmer Circle</h3>
            <p>Collaborate, share best practices, and pool harvests.</p>
          </div>
          <div className="orbit-card orbit-buyer">
            <h3>Buyer Circle</h3>
            <p>Lock in quality supply with predictable volumes.</p>
          </div>
          <div className="orbit-center">
            <span>Smart Contracts</span>
            <span>Stable Prices</span>
            <span>Assured Off-take</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;

