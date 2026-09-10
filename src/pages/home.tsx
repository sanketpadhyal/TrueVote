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

  const filteredVoters = voters.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.org.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="landing-wrapper">
      {/* Persistent Glass Navbar Component */}
      <Navbar />

      {/* Hero Section */}
      <section className="hero-container" style={{ paddingTop: '8.5rem' }}>
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
            <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Voter 1" className="avatar-img" />
            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Voter 2" className="avatar-img" />
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="Voter 3" className="avatar-img" />
          </div>
          <span className="trusted-text">Trusted by 100K+ voters</span>
        </div>

        {/* Main Title with Serif Accent Font from screenshot */}
        <h1 className="main-title blur-animate delay-1">
          Turn Web3 Voting <br />
          Into <span className="serif-italic-accent" style={{ color: '#1d6bf3', fontSize: '1.08em' }}>Instant Decisions</span>
        </h1>

        <p className="main-sub blur-animate delay-2">
          One simple dashboard for election security <span className="serif-italic-accent" style={{ fontSize: '1.1em', color: '#0f172a' }}>without the blind spots.</span> Track vote tallies, relayer state and voter behavior—without the chaos.
        </p>

        {/* Action Button & Caption */}
        <div className="hero-action-group blur-animate delay-3">
          <button 
            className="btn-hyper-blue"
            onClick={() => handleVoteDemo('Candidate Alpha')}
          >
            Get Started For Free
          </button>
          <div className="credit-caption">
            <span>💳</span>
            <span>No credit card required</span>
          </div>
        </div>

        {/* Dashboard Shell Showcase */}
        <div className="dashboard-shell-wrapper blur-animate delay-4">
          <div className="dashboard-outer-glow">
            <div className="dashboard-app-frame glass-panel">
              {/* Left Sidebar */}
              <aside className="app-sidebar">
                <div className="sidebar-brand">
                  <div className="navbar-star-icon" style={{ width: 24, height: 24, fontSize: '0.8rem' }}>✦</div>
                  <span>TrueVote</span>
                </div>

                <div className="search-box">
                  <span>🔍</span>
                  <input 
                    type="text" 
                    placeholder="Search voter..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <ul className="sidebar-nav">
                  <li 
                    className={`sidebar-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Dashboard')}
                  >
                    📊 Dashboard
                  </li>
                  <li 
                    className={`sidebar-item ${activeTab === 'Voters' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Voters')}
                  >
                    👥 Voters
                  </li>
                  <li 
                    className={`sidebar-item ${activeTab === 'Reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Reports')}
                  >
                    📑 All reports
                  </li>
                  <li 
                    className={`sidebar-item ${activeTab === 'Geography' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Geography')}
                  >
                    🌐 Geography
                  </li>
                  <li 
                    className={`sidebar-item ${activeTab === 'Relayer' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Relayer')}
                  >
                    💬 Conversations
                  </li>
                  <li 
                    className={`sidebar-item ${activeTab === 'Deals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('Deals')}
                  >
                    🤝 Deals
                  </li>
                  <li className="sidebar-item">📥 Export</li>
                </ul>
              </aside>

              {/* Main Panel */}
              <main className="app-main-panel">
                {/* Top Metrics Grid */}
                <div className="metrics-top-grid">
                  <div className="metric-card glass-panel">
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
                  {/* Voters List */}
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
                          style={{ cursor: 'pointer' }}
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
                  </div>

                  {/* Growth Line Chart */}
                  <div className="content-box glass-panel">
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
                            <stop offset="0%" stopColor="#1d6bf3" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#1d6bf3" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeDasharray="4 4" />
                        <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeDasharray="4 4" />
                        <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeDasharray="4 4" />

                        <polygon points="0,120 70,110 140,90 210,50 280,105 350,75 420,30 500,150 0,150" fill="url(#chartGradient)" />
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
