import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import Navbar from '../components/navbar';
import '../styles/animations.css';
import './home.css';

export const HomePage: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check initial window width for mobile mode
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();

    window.addEventListener('resize', checkMobile);

    // Initialize Lenis Smooth Scroll on desktop
    let lenis: Lenis | null = null;
    if (window.innerWidth > 768) {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }

    // Scroll listener for 3D Back-to-Front tilt animation on desktop
    const handleScroll = () => {
      if (window.innerWidth <= 768) return;
      const scrollY = window.scrollY;
      const progress = Math.min(Math.max(scrollY / 350, 0), 1);
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

    // Smooth entrance on mount for hero elements
    const heroTimer = setTimeout(() => {
      const topElements = document.querySelectorAll('.hero-container .blur-animate');
      topElements.forEach((el) => el.classList.add('visible'));
    }, 50);

    return () => {
      clearTimeout(heroTimer);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
      lenis?.destroy();
      observer.disconnect();
    };
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 3D transformation values (bypassed on mobile)
  const rotateX = isMobile ? 0 : 16 * (1 - scrollProgress);
  const scale = isMobile ? 1 : 0.92 + 0.08 * scrollProgress;
  const translateY = isMobile ? 0 : 18 * (1 - scrollProgress);
  const opacity = isMobile ? 1 : 0.88 + 0.12 * scrollProgress;

  return (
    <div className="landing-wrapper">
      {/* Ambient Flashing / Floating Glassmorphic Orbs behind Navbar & Hero */}
      <div className="ambient-glass-lights" aria-hidden="true">
        <div className="glass-orb orb-primary" />
        <div className="glass-orb orb-secondary" />
        <div className="glass-orb orb-cyan" />
        <div className="glass-orb orb-accent" />
      </div>

      {/* Persistent Glass Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="hero-container">
        {/* Floating 3D Icon Badges */}
        <div className="floating-icon-card float-top-left blur-animate delay-1">
          <div className="float-symbol sym-blue">⚡</div>
        </div>

        <div className="floating-icon-card float-top-right blur-animate delay-1">
          <div className="float-symbol sym-orange">☤</div>
        </div>

        {/* Top Hackathon Badge with Icon */}
        <div className="trusted-pill blur-animate">
          <div className="hackathon-icon-box">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 11 3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <span className="trusted-text">This is a Hackathon Project</span>
        </div>

        {/* Main Title with Serif Accent */}
        <h1 className="main-title blur-animate delay-1">
          Turn Web3 Voting <br />
          Into <span className="serif-italic-accent" style={{ color: '#1d6bf3', fontSize: '1.08em' }}>Instant Decisions</span>
        </h1>

        <p className="main-sub blur-animate delay-2">
          One simple platform for election security <span className="serif-italic-accent" style={{ fontSize: '1.08em', color: '#0f172a' }}>without the blind spots.</span> Zero-knowledge voter privacy, decentralized records and walletless voting.
        </p>

        {/* Action Button & Caption with Tight Gap */}
        <div className="hero-action-group blur-animate delay-3">
          <button 
            className="btn-primary-blue"
            onClick={() => triggerToast('⚡ Connecting relayer: Preparing anonymous ballot token...')}
          >
            Get Started For Free
          </button>
          <div className="credit-caption">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1d6bf3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
            <span>No crypto wallet or gas fees required</span>
          </div>
        </div>

        {/* 3D PERSPECTIVE DASHBOARD SHOWCASE */}
        <div className="dashboard-perspective-wrapper blur-animate delay-4" id="features">
          <div 
            className="dashboard-shell-wrapper"
            style={{
              transform: `rotateX(${rotateX}deg) scale(${scale}) translateY(${translateY}px)`,
              opacity: opacity,
            }}
          >
            <div className="dashboard-outer-glow">
              <div className="dashboard-image-showcase glass-panel">
                <img 
                  src="/images/privacy_dashboard.webp" 
                  alt="TrueVote ZKP-Based Anonymous Voting & Cryptographic Shield" 
                  className="privacy-hero-img"
                />
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
          Monitor election metrics as they happen, so you can respond quickly and keep integrity on track.
        </p>

        <div className="benefits-grid blur-animate delay-3">
          {/* Benefit 1 */}
          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="benefit-card-title">Real-Time Tracking</h3>
            <p className="benefit-card-desc">
              Monitor election turnout and blockchain block confirmations in real time without lag.
            </p>
          </div>

          {/* Benefit 2 */}
          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
              </svg>
            </div>
            <h3 className="benefit-card-title">All-in-One View</h3>
            <p className="benefit-card-desc">
              Keep all your election data, IPFS metadata, and relayer logs in one place without switching tools.
            </p>
          </div>

          {/* Benefit 3 */}
          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" />
                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </div>
            <h3 className="benefit-card-title">Actionable Insights</h3>
            <p className="benefit-card-desc">
              Cryptographically verify turnout percentages and voting trends with tamper-evident proof.
            </p>
          </div>

          {/* Benefit 4 */}
          <div className="benefit-card">
            <div className="benefit-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3 className="benefit-card-title">Secure Data</h3>
            <p className="benefit-card-desc">
              Zero-knowledge privacy protects voter anonymity by default. No personal identity is ever stored.
            </p>
          </div>

          {/* Benefit 5 */}
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
              Generate auditable IPFS verification summaries and election certificates in seconds.
            </p>
          </div>

          {/* Benefit 6 */}
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
              Open link → choose candidate → vote. No crypto wallet, no MetaMask, and no gas fees required.
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
