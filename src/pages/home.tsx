import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import Navbar from '../components/navbar';
import { FlipText } from '../components/universalbuttonshover';
import DialogueBox from '../components/box/dialoguebox';
import AuthModal from '../components/authmodal';
import Footer from '../components/footer';
import '../styles/animations.css';
import './home.css';

export const HomePage: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHackathonModalOpen, setIsHackathonModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    el.classList.remove('nav-highlight-animate');
    void el.offsetWidth;
    el.classList.add('nav-highlight-animate');
    setTimeout(() => {
      el.classList.remove('nav-highlight-animate');
    }, 1400);

    if ((window as any).lenis) {
      (window as any).lenis.scrollTo(el, { offset: -80, duration: 1.2 });
    } else {
      const navbarOffset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    document.title = 'TrueVote | Decentralized Anonymous Voting Protocol';

    // Handle hash scroll on mount
    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      setTimeout(() => {
        scrollTo(targetId);
      }, 150);
    }

    const handleHashChange = () => {
      if (window.location.hash) {
        const targetId = window.location.hash.replace('#', '');
        scrollTo(targetId);
      }
    };
    window.addEventListener('hashchange', handleHashChange);

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
      (window as any).lenis = lenis;

      if (!window.location.hash) {
        lenis.scrollTo(0, { immediate: true });
      }

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

    // Smooth entrance on mount for hero elements only
    const heroTimer = setTimeout(() => {
      const topElements = document.querySelectorAll('.hero-container .blur-animate');
      topElements.forEach((el) => el.classList.add('visible'));
    }, 50);

    return () => {
      clearTimeout(heroTimer);
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
      if (typeof (window as any).lenis?.destroy === 'function') {
        (window as any).lenis.destroy();
      }
      (window as any).lenis = null;
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
      {/* Persistent Glass Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="hero-container">
        <div className="hero-content-area">
          {/* Floating Tech Stack Cards (Fixed Positions with Blur-to-Normal Entrance) */}
          <div className="floating-icon-card float-top-left blur-animate delay-1" title="Pinata">
            <img src="/images/stacks/Pinata.png" alt="Pinata" className="stack-logo-img" />
          </div>

          <div className="floating-icon-card float-bottom-left blur-animate delay-2" title="TypeScript">
            <img src="/images/stacks/typescript.webp" alt="TypeScript" className="stack-logo-img" />
          </div>

          <div className="floating-icon-card float-top-right blur-animate delay-1" title="Railway">
            <img src="/images/stacks/Railway.webp" alt="Railway" className="stack-logo-img" />
          </div>

          <div className="floating-icon-card float-bottom-right blur-animate delay-2" title="IPFS">
            <img src="/images/stacks/ipfs.png" alt="IPFS" className="stack-logo-img" />
          </div>

          {/* Top Hackathon Badge with Icon */}
          <div 
            className="trusted-pill blur-animate clickable-pill"
            onClick={() => setIsHackathonModalOpen(true)}
            role="button"
            tabIndex={0}
            title="This is a Hackathon Project"
          >
            <div className="hackathon-icon-box">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z" />
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
              className="btn-primary-blue framer-flip-btn"
              onClick={() => setIsAuthModalOpen(true)}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                <path d="M19.8285 6.6117l-5.52-5.535a3.1352 3.1352 0 00-4.5 0l-5.535 5.535 7.755 3.87zm2.118 2.235l1.095 1.095a3.12 3.12 0 010 4.5L14.22 23.3502a2.6846 2.6846 0 01-.72.525V13.0767zm-19.893 0l-1.095 1.095a3.1198 3.1198 0 000 4.5L9.78 23.3502c.2091.214.4525.3914.72.525V13.0767z" />
              </svg>
              <FlipText>Get Started</FlipText>
            </button>
            <div className="credit-caption">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1d6bf3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
              <span>No crypto wallet or gas fees required</span>
            </div>
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
        <h2 className="benefits-title">
          Benefits That Truly <br />
          <span className="serif-italic-accent" style={{ color: '#1d6bf3' }}>Matter To You</span>
        </h2>

        <p className="benefits-sub">
          Monitor election metrics as they happen, so you can respond quickly and keep integrity on track.
        </p>

        <div className="benefits-grid">
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

      {/* ==========================================================================
          HOW IT WORKS SECTION
          ========================================================================== */}
      <section className="workflow-section" id="how-it-works">
        <h2 className="section-title">
          How TrueVote Works <br />
          <span className="serif-italic-accent" style={{ color: '#1d6bf3' }}>In 4 Simple Steps</span>
        </h2>

        <p className="section-sub">
          From anonymous citizen verification to immutable on-chain finality — engineered for effortless civic participation.
        </p>

        <div className="workflow-steps-grid">
          <div className="workflow-step-card">
            <div className="workflow-step-header">
              <span className="workflow-step-num">01</span>
              <div className="workflow-step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
            <h3 className="workflow-step-title">Anonymous Verification</h3>
            <p className="workflow-step-desc">
              Generate a client-side Zero-Knowledge proof confirming registered voter eligibility. No national ID, email, or identity parameters are disclosed.
            </p>
            <div className="workflow-step-badge">Circom ZK Circuit</div>
          </div>

          <div className="workflow-step-card">
            <div className="workflow-step-header">
              <span className="workflow-step-num">02</span>
              <div className="workflow-step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>
            <h3 className="workflow-step-title">Client-Side Encryption</h3>
            <p className="workflow-step-desc">
              Your ballot selection is cryptographically sealed in your browser with homomorphic election public keys before any packet transmission.
            </p>
            <div className="workflow-step-badge">Browser-Only Encryption</div>
          </div>

          <div className="workflow-step-card">
            <div className="workflow-step-header">
              <span className="workflow-step-num">03</span>
              <div className="workflow-step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
            </div>
            <h3 className="workflow-step-title">Gasless Relayer Relay</h3>
            <p className="workflow-step-desc">
              Decentralized relayer nodes sponsor gas fees and dispatch the transaction directly to Ethereum Sepolia via EIP-712 meta-transactions.
            </p>
            <div className="workflow-step-badge">0 Gas Fees Required</div>
          </div>

          <div className="workflow-step-card">
            <div className="workflow-step-header">
              <span className="workflow-step-num">04</span>
              <div className="workflow-step-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>
            <h3 className="workflow-step-title">Decentralized Audit</h3>
            <p className="workflow-step-desc">
              Nullifiers prevent duplicate voting, tallies update immutably on-chain, and ballot receipts are permanently pinned to Pinata IPFS.
            </p>
            <div className="workflow-step-badge">Pinata IPFS Finality</div>
          </div>
        </div>
      </section>

      {/* ==========================================================================
          SECURITY & ARCHITECTURE SECTION
          ========================================================================== */}
      <section className="security-section" id="security">
        <h2 className="section-title">
          Mathematical Truth & <br />
          <span className="serif-italic-accent" style={{ color: '#1d6bf3' }}>Trustless Security</span>
        </h2>

        <p className="section-sub">
          Eliminating central vulnerabilities, coercion vectors, and administrative tampering with battle-tested Web3 primitives.
        </p>

        <div className="security-grid">
          <div className="security-card">
            <div className="security-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div className="security-tag">Privacy Core</div>
            <h3 className="security-card-title">zk-SNARKs Membership Proofs</h3>
            <p className="security-card-desc">
              Voter eligibility is computed via Groth16 zk-SNARK circuits. Smart contracts verify valid voter inclusion within a Merkle tree without revealing the leaf or credential.
            </p>
          </div>

          <div className="security-card">
            <div className="security-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            </div>
            <div className="security-tag">Sybil Resistance</div>
            <h3 className="security-card-title">Deterministic Nullifier Hashes</h3>
            <p className="security-card-desc">
              Each voter generates a unique nullifier derived from their secret key and election ID. Contracts enforce single-vote execution while keeping voter choice decoupled.
            </p>
          </div>

          <div className="security-card">
            <div className="security-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <div className="security-tag">Decentralized Storage</div>
            <h3 className="security-card-title">Pinata IPFS Distributed Storage</h3>
            <p className="security-card-desc">
              Election manifests, candidate metadata, and cryptographic proof commitments are pinned across redundant IPFS gateways, preventing server takedowns and data corruption.
            </p>
          </div>

          <div className="security-card">
            <div className="security-card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <div className="security-tag">Verifiable Logic</div>
            <h3 className="security-card-title">Permissionless Smart Contracts</h3>
            <p className="security-card-desc">
              All election rules and tally calculations are strictly enforced by open-source EVM contracts deployed on Ethereum Sepolia, with zero administrative backdoors.
            </p>
          </div>
        </div>
      </section>

      {/* Shared Reusable Footer */}
      <Footer onOpenHackathon={() => setIsHackathonModalOpen(true)} />
      {toastMessage && (
        <div className="vote-toast glass-panel-dark">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hackathon Prototype Dialogue Box */}
      <DialogueBox 
        isOpen={isHackathonModalOpen} 
        onClose={() => setIsHackathonModalOpen(false)} 
      />

      {/* Web3 Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onConnect={(addr) => {
          setConnectedWallet(addr);
          triggerToast(`🦊 MetaMask connected: ${addr.slice(0, 6)}...${addr.slice(-4)}`);
        }}
      />
    </div>
  );
};

export default HomePage;
