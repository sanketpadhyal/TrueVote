import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import Navbar from '../components/navbar';
import '../styles/animations.css';
import './home.css';

interface VoterRecord {
  id: string;
  name: string;
  org: string;
  avatar: string;
  status: string;
}

export const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedVoter, setSelectedVoter] = useState<string>('Maggie Johnson');
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  const [voters] = useState<VoterRecord[]>([
    {
      id: '1',
      name: 'Chris Friedkly',
      org: 'Supermarket Villanova',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
      status: 'Verified',
    },
    {
      id: '2',
      name: 'Maggie Johnson',
      org: 'Oasis Organic Inc.',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&auto=format&fit=crop&q=80',
      status: 'Verified',
    },
    {
      id: '3',
      name: 'Gael Harry',
      org: 'New York Finest Fruits',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&auto=format&fit=crop&q=80',
      status: 'Verified',
    },
    {
      id: '4',
      name: 'Jenna Sullivan',
      org: 'Walmart',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&auto=format&fit=crop&q=80',
      status: 'Verified',
    },
  ]);

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

    // Scroll listener for 3D Back-to-Front tilt animation
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // Map scroll from 0 to 450px to a progress value from 0 to 1
      const progress = Math.min(Math.max(scrollY / 450, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

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
      window.removeEventListener('scroll', handleScroll);
      lenis.destroy();
      observer.disconnect();
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleVoteDemo = (candidateName: string) => {
    if (hasVoted) {
      triggerToast('⚠️ Device Token Consumed: You have already voted in this session.');
      return;
    }
    setHasVoted(true);
    triggerToast(`✅ Vote recorded for ${candidateName}! Relayer submitted hash to EVM.`);
  };

  const filteredVoters = voters.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.org.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate 3D transformation values for back-to-front tilt effect
  const rotateX = 22 * (1 - scrollProgress);
  const scale = 0.88 + 0.12 * scrollProgress;
  const translateY = 50 * (1 - scrollProgress);
  const opacity = 0.85 + 0.15 * scrollProgress;

  return (
    <div className="landing-wrapper">
      {/* Persistent Glass Navbar */}
      <Navbar />

      {/* Hero Section matching Screenshot 1 */}
      <section className="hero-container">
        {/* Floating 3D Icon Badges */}
        <div className="floating-icon-card float-top-left blur-animate delay-1">
          <div className="float-symbol sym-blue">⚡</div>
        </div>

        <div className="floating-icon-card float-top-right blur-animate delay-1">
          <div className="float-symbol sym-orange">☤</div>
        </div>

        {/* Top Trusted Pill Badge */}
        <div className="trusted-pill blur-animate">
          <div className="avatar-group">
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar 1" className="avatar-img" />
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Avatar 2" className="avatar-img" />
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="Avatar 3" className="avatar-img" />
          </div>
          <span className="trusted-text">Trusted by 1M+ users</span>
        </div>

        {/* Main Title with Serif Accent */}
        <h1 className="main-title blur-animate delay-1">
          Turn Web3 Voting <br />
          Into <span className="serif-italic-accent" style={{ color: '#1d6bf3', fontSize: '1.08em' }}>Instant Decisions</span>
        </h1>

        <p className="main-sub blur-animate delay-2">
          One simple dashboard to track your SaaS growth, MRR, churn and voter behavior—without the chaos.
        </p>

        {/* Action Button & Caption */}
        <div className="hero-action-group blur-animate delay-3">
          <button 
            className="btn-primary-blue"
            onClick={() => handleVoteDemo('Candidate Alpha')}
          >
            Get Started For Free
          </button>
          <div className="credit-caption">
            <span>💳</span>
            <span>No credit card required</span>
          </div>
        </div>

        {/* 3D PERSPECTIVE WRAPPER (Back to Front Coming Animation when I scroll) */}
        <div className="dashboard-perspective-wrapper blur-animate delay-4">
          <div 
            className="dashboard-shell-wrapper"
            style={{
              transform: `rotateX(${rotateX}deg) scale(${scale}) translateY(${translateY}px)`,
              opacity: opacity,
            }}
          >
            <div className="dashboard-outer-glow">
              <div className="dashboard-app-frame glass-panel">
                {/* Left Sidebar matching Screenshot 2 */}
                <aside className="app-sidebar">
                  <div className="sidebar-brand">
                    <div className="sidebar-star">✦</div>
                    <span>TrueVote</span>
                  </div>

                  <div className="search-box">
                    <span>🔍</span>
                    <input 
                      type="text" 
                      placeholder="Search" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <ul className="sidebar-nav">
                    <li 
                      className={`sidebar-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Dashboard')}
                    >
                      <div className="sidebar-item-left">
                        <span>📊</span>
                        <span>Dashboard</span>
                      </div>
                    </li>
                    <li 
                      className={`sidebar-item ${activeTab === 'Customers' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Customers')}
                    >
                      <div className="sidebar-item-left">
                        <span>👥</span>
                        <span>Customers</span>
                      </div>
                      <span>⌄</span>
                    </li>
                    <li 
                      className={`sidebar-item ${activeTab === 'Reports' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Reports')}
                    >
                      <div className="sidebar-item-left">
                        <span>📑</span>
                        <span>All reports</span>
                      </div>
                    </li>
                    <li 
                      className={`sidebar-item ${activeTab === 'Geography' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Geography')}
                    >
                      <div className="sidebar-item-left">
                        <span>🌐</span>
                        <span>Geography</span>
                      </div>
                    </li>
                    <li 
                      className={`sidebar-item ${activeTab === 'Conversations' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Conversations')}
                    >
                      <div className="sidebar-item-left">
                        <span>💬</span>
                        <span>Conversations</span>
                      </div>
                    </li>
                    <li 
                      className={`sidebar-item ${activeTab === 'Deals' ? 'active' : ''}`}
                      onClick={() => setActiveTab('Deals')}
                    >
                      <div className="sidebar-item-left">
                        <span>🤝</span>
                        <span>Deals</span>
                      </div>
                    </li>
                    <li className="sidebar-item">
                      <div className="sidebar-item-left">
                        <span>📥</span>
                        <span>Export</span>
                      </div>
                    </li>
                  </ul>
                </aside>

                {/* Main Dashboard Panel matching Screenshot 2 */}
                <main className="app-main-panel">
                  {/* Top Metrics Row */}
                  <div className="metrics-top-grid">
                    {/* Revenues Card */}
                    <div className="metric-card glass-panel">
                      <div className="metric-card-header">Revenues</div>
                      <div>
                        <div className="metric-value-row">
                          <span className="metric-number">15%</span>
                          <span className="metric-arrow">↗</span>
                        </div>
                        <span className="metric-subtitle">Increase compared to last week</span>
                      </div>
                      <a href="#revenues" className="metric-link">Revenues report →</a>
                    </div>

                    {/* Lost deals Card */}
                    <div className="metric-card glass-panel">
                      <div className="metric-card-header">Lost deals</div>
                      <div>
                        <div className="metric-value-row">
                          <span className="metric-number">4%</span>
                        </div>
                        <span className="metric-subtitle">You closed 96 out of 100 deals</span>
                      </div>
                      <a href="#deals" className="metric-link">All deals →</a>
                    </div>

                    {/* Quarter goal Gauge Card */}
                    <div className="metric-card glass-panel">
                      <div className="metric-card-header">Quarter goal</div>
                      <div className="gauge-wrapper">
                        <svg className="gauge-svg" viewBox="0 0 100 50">
                          <path
                            d="M 10,50 A 40,40 0 0,1 90,50"
                            fill="none"
                            stroke="#eff6ff"
                            strokeWidth="10"
                            strokeLinecap="round"
                          />
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
                    {/* Customers List Card */}
                    <div className="content-box glass-panel">
                      <div className="box-header">
                        <span className="box-title">Customers</span>
                        <select className="sort-select">
                          <option>Sort by Newest ▾</option>
                        </select>
                      </div>

                      <div className="voters-list">
                        {filteredVoters.map((v) => (
                          <div 
                            key={v.id} 
                            className={`voter-row ${selectedVoter === v.name ? 'active-row' : ''}`}
                            onClick={() => setSelectedVoter(v.name)}
                          >
                            <div className="voter-profile">
                              <img src={v.avatar} alt={v.name} className="voter-avatar" />
                              <div className="voter-details">
                                <span className="voter-name">{v.name}</span>
                                <span className="voter-org">{v.org}</span>
                              </div>
                            </div>

                            {selectedVoter === v.name && (
                              <div className="row-actions">
                                <span>💬</span>
                                <span>⭐</span>
                                <span>✏️</span>
                                <span>⋮</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <a href="#all-customers" className="all-customers-link">All customers →</a>
                    </div>

                    {/* Growth Chart Card with Bottom Stats */}
                    <div className="content-box glass-panel">
                      <div className="box-header">
                        <span className="box-title">Growth</span>
                        <select className="sort-select">
                          <option>Yearly ▾</option>
                        </select>
                      </div>

                      {/* Area Chart */}
                      <div className="chart-container">
                        <svg className="chart-svg" viewBox="0 0 500 140" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="chartGradient2" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#1d6bf3" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#1d6bf3" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeDasharray="4 4" />
                          <line x1="0" y1="55" x2="500" y2="55" stroke="#f1f5f9" strokeDasharray="4 4" />
                          <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeDasharray="4 4" />

                          <polygon points="0,110 70,95 140,80 210,40 280,100 350,65 420,25 500,140 0,140" fill="url(#chartGradient2)" />
                          <path d="M 0,110 Q 70,95 140,80 T 280,100 T 420,25 L 500,10" fill="none" stroke="#1d6bf3" strokeWidth="2.8" />
                        </svg>
                      </div>

                      {/* Growth Bottom Stats matching Screenshot 2 */}
                      <div className="growth-bottom-stats">
                        <div className="stat-item">
                          <span className="stat-label">Top month</span>
                          <span className="stat-val-bold">November</span>
                          <span className="stat-subtext">2019</span>
                        </div>

                        <div className="stat-item">
                          <span className="stat-label">Top year</span>
                          <span className="stat-val-bold">2023</span>
                          <span className="stat-subtext">96K sold so far</span>
                        </div>

                        <div className="stat-item">
                          <span className="stat-label">Top buyer</span>
                          <div className="buyer-profile">
                            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80" alt="Buyer" className="buyer-avatar" />
                            <div className="buyer-info">
                              <span className="buyer-name">Maggie Johnson</span>
                              <span className="buyer-org">Oasis Organic Inc.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          BENEFITS SECTION (Matching Screenshot 3)
          ========================================================================== */}
      <section className="benefits-section" id="benefits">
        <div className="benefits-pill-badge blur-animate">
          Benefits
        </div>

        <h2 className="benefits-title blur-animate delay-1">
          Benefits That Truly <br />
          <span className="serif-italic-accent" style={{ color: '#1d6bf3' }}>Matter To You</span>
        </h2>

        <p className="benefits-sub blur-animate delay-2">
          Monitor metrics as they happen, so you can respond quickly and keep your goals on track.
        </p>

        <div className="benefits-grid blur-animate delay-3">
          {/* Card 1 */}
          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="benefit-card-title">Real-Time Tracking</h3>
            <p className="benefit-card-desc">
              Monitor user activity instantly for smarter decision-making.
            </p>
          </div>

          {/* Card 2 */}
          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
              </svg>
            </div>
            <h3 className="benefit-card-title">All-in-One View</h3>
            <p className="benefit-card-desc">
              Keep all your analytics in one place, without jumping between tools.
            </p>
          </div>

          {/* Card 3 */}
          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
            <h3 className="benefit-card-title">Actionable Insights</h3>
            <p className="benefit-card-desc">
              Track the metrics that matter most for sustainable business growth.
            </p>
          </div>

          {/* Card 4 */}
          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="benefit-card-title">Secure Data</h3>
            <p className="benefit-card-desc">
              Decentralized cryptographic commitments and zero-knowledge privacy.
            </p>
          </div>

          {/* Card 5 */}
          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className="benefit-card-title">Custom Reports</h3>
            <p className="benefit-card-desc">
              Generate exportable summaries and audit trails in seconds.
            </p>
          </div>

          {/* Card 6 */}
          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </div>
            <h3 className="benefit-card-title">Simple to Use</h3>
            <p className="benefit-card-desc">
              Intuitive interface designed for effortless operation with zero friction.
            </p>
          </div>
        </div>
      </section>

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="vote-toast glass-panel-dark">
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default HomePage;
