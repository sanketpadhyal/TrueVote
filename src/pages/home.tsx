import React, { useEffect } from 'react';
import Lenis from 'lenis';
import './home.css';

export const HomePage: React.FC = () => {
  useEffect(() => {
    // Initialize Lenis Smooth Scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Blur-to-Normal Scroll Observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll('.blur-animate');
    elements.forEach((el) => observer.observe(el));

    return () => {
      lenis.destroy();
      observer.disconnect();
    };
  }, []);

  return (
    <div className="landing-wrapper">
      {/* Header Navigation matching Screenshot 1 */}
      <header className="header-nav blur-animate">
        <a href="/" className="brand-logo">
          <div className="logo-star-icon">✦</div>
          <span>TrueVote</span>
        </a>

        <ul className="nav-menu">
          <li><a href="#features" className="nav-item">Features</a></li>
          <li><a href="#benefits" className="nav-item">Benefits</a></li>
          <li><a href="#integrations" className="nav-item">Integrations</a></li>
          <li><a href="#pricing" className="nav-item">Pricing</a></li>
          <li><a href="#faq" className="nav-item">FAQ</a></li>
          <li><a href="#blogs" className="nav-item">Blogs</a></li>
        </ul>

        <button className="btn-header-cta">
          Get Started
        </button>

        <button className="mobile-menu-btn">☰</button>
      </header>

      {/* Hero Section matching Screenshot 1 */}
      <section className="hero-container">
        {/* Floating 3D Icon Badges */}
        <div className="floating-icon-card float-top-left blur-animate delay-1">
          <div className="float-symbol sym-blue">⚡</div>
        </div>

        <div className="floating-icon-card float-bottom-left blur-animate delay-2">
          <div className="float-symbol sym-dark">N</div>
        </div>

        <div className="floating-icon-card float-top-right blur-animate delay-1">
          <div className="float-symbol sym-orange">☤</div>
        </div>

        <div className="floating-icon-card float-bottom-right blur-animate delay-2">
          <div className="float-symbol sym-purple">⬢</div>
        </div>

        {/* Trusted Pill Badge */}
        <div className="trusted-pill blur-animate">
          <div className="avatar-group">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Voter Avatar 1" className="avatar-img" />
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Voter Avatar 2" className="avatar-img" />
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="Voter Avatar 3" className="avatar-img" />
          </div>
          <span className="trusted-text">Trusted by 100K+ voters</span>
        </div>

        {/* Hero Title & Subtitle */}
        <h1 className="main-title blur-animate delay-1">
          Turn Web3 Voting <br />
          Into Instant Decisions
        </h1>

        <p className="main-sub blur-animate delay-2">
          One simple dashboard to track your election integrity, vote tallies,
          relayer state and voter behavior—without the chaos.
        </p>

        {/* Action Button & Subtext */}
        <div className="hero-action-group blur-animate delay-3">
          <button className="btn-primary-blue">
            Get Started For Free
          </button>
          <div className="credit-caption">
            <span>💳</span>
            <span>No credit card required</span>
          </div>
        </div>

        {/* Dashboard Shell Showcase matching Screenshot 2 */}
        <div className="dashboard-shell-wrapper blur-animate delay-4">
          <div className="dashboard-outer-glow">
            <div className="dashboard-app-frame">
              {/* Left Sidebar */}
              <aside className="app-sidebar">
                <div className="sidebar-brand">
                  <div className="logo-star-icon" style={{ width: 24, height: 24, fontSize: '0.8rem' }}>✦</div>
                  <span>TrueVote</span>
                </div>

                <div className="search-box">
                  <span>🔍</span>
                  <input type="text" placeholder="Search" readOnly />
                </div>

                <ul className="sidebar-nav">
                  <li className="sidebar-item active">📊 Dashboard</li>
                  <li className="sidebar-item">👥 Voters</li>
                  <li className="sidebar-item">📑 All reports</li>
                  <li className="sidebar-item">🌐 Geography</li>
                  <li className="sidebar-item">💬 Conversations</li>
                  <li className="sidebar-item">🤝 Deals</li>
                  <li className="sidebar-item">📥 Export</li>
                </ul>
              </aside>

              {/* Main Dashboard Panel */}
              <main className="app-main-panel">
                {/* Top Metrics Grid */}
                <div className="metrics-top-grid">
                  {/* Revenue / Votes Metric Card */}
                  <div className="metric-card">
                    <div className="metric-card-header">Total Votes</div>
                    <div>
                      <div className="metric-value-row">
                        <span className="metric-number">15%</span>
                        <span className="metric-arrow">↗</span>
                      </div>
                      <span className="metric-subtitle">Increase compared to last week</span>
                    </div>
                    <a href="#reports" className="metric-link">Votes report →</a>
                  </div>

                  {/* On-Chain Finality Card */}
                  <div className="metric-card">
                    <div className="metric-card-header">Lost deals</div>
                    <div>
                      <div className="metric-value-row">
                        <span className="metric-number">4%</span>
                      </div>
                      <span className="metric-subtitle">You closed 96 out of 100 deals</span>
                    </div>
                    <a href="#deals" className="metric-link">All deals →</a>
                  </div>

                  {/* Semi-Circle Gauge Arc Card */}
                  <div className="metric-card">
                    <div className="metric-card-header">Quarter goal</div>
                    <div className="gauge-wrapper">
                      <svg className="gauge-svg" viewBox="0 0 100 50">
                        {/* Background Track Arc */}
                        <path
                          d="M 10,50 A 40,40 0 0,1 90,50"
                          fill="none"
                          stroke="#eff6ff"
                          strokeWidth="10"
                          strokeLinecap="round"
                        />
                        {/* Progress Arc (84%) */}
                        <path
                          d="M 10,50 A 40,40 0 0,1 82,24"
                          fill="none"
                          stroke="#1d6bf3"
                          strokeWidth="10"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="gauge-text">84%</div>
                    </div>
                    <a href="#goals" className="metric-link">All goals →</a>
                  </div>
                </div>

                {/* Bottom Metrics Grid */}
                <div className="metrics-bottom-grid">
                  {/* Customers / Voters List Card */}
                  <div className="content-box">
                    <div className="box-header">
                      <span className="box-title">Customers</span>
                      <select className="sort-select">
                        <option>Sort by Newest ▾</option>
                      </select>
                    </div>

                    <div className="voters-list">
                      <div className="voter-row">
                        <div className="voter-profile">
                          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80" alt="Chris" className="voter-avatar" />
                          <div className="voter-details">
                            <span className="voter-name">Chris Friedkly</span>
                            <span className="voter-org">Supermarket Villanova</span>
                          </div>
                        </div>
                      </div>

                      <div className="voter-row active-row">
                        <div className="voter-profile">
                          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80" alt="Maggie" className="voter-avatar" />
                          <div className="voter-details">
                            <span className="voter-name">Maggie Johnson</span>
                            <span className="voter-org">Oasis Organic Inc.</span>
                          </div>
                        </div>
                        <div className="row-actions">
                          <span>💬</span>
                          <span>⭐</span>
                          <span>✏️</span>
                          <span>⋮</span>
                        </div>
                      </div>

                      <div className="voter-row">
                        <div className="voter-profile">
                          <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80" alt="Gael" className="voter-avatar" />
                          <div className="voter-details">
                            <span className="voter-name">Gael Harry</span>
                            <span className="voter-org">New York Finest Fruits</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Growth Line Chart Card */}
                  <div className="content-box">
                    <div className="box-header">
                      <span className="box-title">Growth</span>
                      <select className="sort-select">
                        <option>Yearly ▾</option>
                      </select>
                    </div>

                    <div className="chart-container">
                      <svg className="chart-svg" viewBox="0 0 500 150" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1d6bf3" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#1d6bf3" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
                        <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeDasharray="4 4" />
                        <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeDasharray="4 4" />

                        {/* Area Fill */}
                        <polygon points="0,120 70,110 140,90 210,50 280,105 350,75 420,30 500,150 0,150" fill="url(#chartGradient)" />
                        
                        {/* Main Line */}
                        <path d="M 0,120 Q 70,110 140,90 T 280,105 T 420,30 L 500,15" fill="none" stroke="#1d6bf3" strokeWidth="3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
