import React, { useEffect, useState } from 'react';
import Lenis from 'lenis';
import Navbar from './navbar';
import Footer from './footer';
import DialogueBox from './box/dialoguebox';
import './team.css';

export const TeamPage: React.FC = () => {
  const [isHackathonModalOpen, setIsHackathonModalOpen] = useState<boolean>(false);

  useEffect(() => {
    document.title = 'The Builders | TrueVote - Zero-Knowledge Governance';
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      touchMultiplier: 2,
    });

    (window as any).lenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    const animTimer = setTimeout(() => {
      const elements = document.querySelectorAll('.team-page-main .blur-animate');
      elements.forEach((el) => el.classList.add('visible'));
    }, 50);

    return () => {
      clearTimeout(animTimer);
      cancelAnimationFrame(rafId);
      lenis.destroy();
      (window as any).lenis = null;
    };
  }, []);

  return (
    <div className="team-page-wrapper">
      <Navbar />

      <main className="team-page-main">
        {/* Hero Header */}
        <section className="team-hero-container">
          <div className="team-pill-badge blur-animate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>The Builders</span>
          </div>

          <h1 className="team-main-title blur-animate delay-1">
            Pioneering the Future of <br />
            <span className="serif-italic-accent" style={{ color: '#1d6bf3' }}>Verifiable Democracy</span>
          </h1>

          <p className="team-main-sub blur-animate delay-2">
            Engineers and researchers committed to advancing transparent, trustless, and censorship-resistant governance infrastructure.
          </p>
        </section>

        {/* Builder Profile Showcase */}
        <section className="team-builder-section blur-animate delay-3">
          <div className="team-card-prominent">
            <div className="team-avatar-box">
              <div className="team-avatar-gradient grad-1">
                <span>SP</span>
              </div>
            </div>

            <h2 className="team-name">Sanket Padhyal</h2>
            <span className="team-role">Core Protocol Architect</span>

            <p className="team-bio">
              Specializing in EVM smart contract state architecture, meta-transaction relayer engines, and decentralized consensus design. Dedicated to engineering cryptographic systems where integrity is mathematically enforced rather than administratively granted.
            </p>

            {/* Specialization Tags */}
            <div className="team-specializations">
              <span className="team-spec-tag">Groth16 zk-SNARKs</span>
              <span className="team-spec-tag">Circom Circuits</span>
              <span className="team-spec-tag">EIP-712 Relayers</span>
              <span className="team-spec-tag">Solidity EVM</span>
              <span className="team-spec-tag">Pinata IPFS</span>
            </div>

            {/* Social Links - Strictly NO hover movement or hover scale */}
            <div className="team-links">
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noreferrer" 
                className="team-link" 
                title="GitHub"
                aria-label="GitHub Profile"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noreferrer" 
                className="team-link" 
                title="Twitter / X"
                aria-label="Twitter X Profile"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Guiding Principles Grid */}
        <section className="team-principles-section blur-animate delay-4">
          <div className="principles-header">
            <span className="principles-sub-badge">Architectural Pillars</span>
            <h3 className="principles-title">
              What Powers Our <span className="serif-italic-accent" style={{ color: '#1d6bf3' }}>Vision</span>
            </h3>
          </div>

          <div className="principles-grid">
            <div className="principle-card">
              <div className="principle-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h4 className="principle-card-title">Mathematical Truth</h4>
              <p className="principle-card-desc">
                We replace human discretion with verifiable Circom zk-SNARK circuits. No centralized committee decides whether your ballot is valid.
              </p>
            </div>

            <div className="principle-card">
              <div className="principle-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <line x1="2" x2="22" y1="10" y2="10" />
                </svg>
              </div>
              <h4 className="principle-card-title">Zero Financial Barrier</h4>
              <p className="principle-card-desc">
                Democracy should never require gas fees or cryptocurrency holdings. Dedicated EIP-712 relayers sponsor on-chain verification costs.
              </p>
            </div>

            <div className="principle-card">
              <div className="principle-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              </div>
              <h4 className="principle-card-title">Unbreakable Anonymity</h4>
              <p className="principle-card-desc">
                Deterministic nullifiers guarantee one-person-one-vote while strictly decoupling the voter's identity from candidate choices.
              </p>
            </div>

            <div className="principle-card">
              <div className="principle-icon-circle">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                </svg>
              </div>
              <h4 className="principle-card-title">Decentralized Permanence</h4>
              <p className="principle-card-desc">
                Immutable Pinata IPFS pinning and Ethereum Sepolia contracts ensure election history cannot be retroactively altered or deleted.
              </p>
            </div>
          </div>
        </section>

        {/* Prototype CTA Banner */}
        <section className="team-cta-banner blur-animate delay-5">
          <div className="team-cta-box">
            <h3>Experience TrueVote in Action</h3>
            <p>Inspect the smart contract architecture, view the open-source MVP specifications, and test the zero-knowledge voting workflow.</p>
            <div className="team-cta-buttons">
              <button 
                type="button" 
                className="team-cta-btn-primary"
                onClick={() => setIsHackathonModalOpen(true)}
              >
                View Hackathon Details
              </button>
              <a href="/" className="team-cta-btn-secondary">
                Back to Home Page →
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer onOpenHackathon={() => setIsHackathonModalOpen(true)} />

      <DialogueBox 
        isOpen={isHackathonModalOpen} 
        onClose={() => setIsHackathonModalOpen(false)} 
      />
    </div>
  );
};

export default TeamPage;
