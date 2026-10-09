import React from 'react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-container">
      <section className="landing-hero">
        <div className="landing-illustration">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary-accent)' }}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M8 11h8" />
            <path d="M12 15V7" />
          </svg>
        </div>
        <h1>Secure File Sharing with Encryption</h1>
        <h2>IT303 Software Engineering Course Project</h2>
        <p>Under the guidance of Dr. Jaidhar C D</p>
        <p>Experience true zero-knowledge end-to-end encryption. Your files are encrypted locally in your browser before they ever touch the network, ensuring complete privacy and security.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/login" className="btn-primary">Login</Link>
          <Link to="/register" className="btn-secondary">Register</Link>
        </div>
      </section>

      <section className="features-grid">
        <div className="landing-card">
          <div className="landing-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h3>E2E Encryption</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Files are encrypted in your browser using AES-GCM before upload.</p>
        </div>
        <div className="landing-card">
          <div className="landing-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <h3>Zero-Knowledge</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>The server never sees your plaintext files or your encryption keys.</p>
        </div>
        <div className="landing-card">
          <div className="landing-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h3>Secure Delivery</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>Only the intended recipient can decrypt and download the files.</p>
        </div>
      </section>

      <section className="team-section">
        <h2>Meet the Team</h2>
        <div className="team-grid">
          <div className="team-member">
            <div className="team-avatar">CG</div>
            <h3>Chandan Gowda C</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>241IT016</p>
          </div>
          <div className="team-member">
            <div className="team-avatar">PP</div>
            <h3>Prabhav P</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>241IT053</p>
          </div>
          <div className="team-member">
            <div className="team-avatar">SK</div>
            <h3>Sucheth K Katte</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>241IT078</p>
          </div>
        </div>
      </section>
    </div>
  );
};
