import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DialogueBox from './box/dialoguebox';
import './footer.css';

interface FooterProps {
  onOpenHackathon?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenHackathon }) => {
  const [internalHackathonOpen, setInternalHackathonOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleOpenHackathon = () => {
    if (onOpenHackathon) {
      onOpenHackathon();
    } else {
      setInternalHackathonOpen(true);
    }
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    e.preventDefault();
    if (target === 'faq') {
      if (location.pathname === '/faq') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/faq');
      }
      return;
    }

    if (target === 'team') {
      if (location.pathname === '/team') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/team');
      }
      return;
    }

    if (location.pathname === '/') {
      const el = document.getElementById(target);
      if (el) {
        if ((window as any).lenis) {
          (window as any).lenis.scrollTo(el, { offset: -80, duration: 1.2 });
        } else {
          const navbarOffset = 80;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }
    } else {
      navigate(`/#${target}`);
    }
  };

  return (
    <>
      <footer className="footer-section">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand-col">
              <div 
                className="footer-brand-title" 
                onClick={() => {
                  if (location.pathname === '/') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    navigate('/');
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <img src="/images/logo.png" alt="TrueVote" className="navbar-logo-img" style={{ width: 30, height: 30 }} />
                <span>True<span className="brand-accent">Vote</span></span>
              </div>
              <p className="footer-brand-tagline">
                Democracy Reimagined on Ethereum. Cryptographically verifiable, gasless, and privacy-preserving voting powered by zk-SNARKs and Pinata IPFS.
              </p>
              <div className="footer-status-pill">
                <span className="status-dot"></span>
                <span>Sepolia Testnet Active · IPFS Synced</span>
              </div>
            </div>

            <div className="footer-links-grid">
              <div className="footer-link-col">
                <h5 className="footer-link-heading">Navigation</h5>
                <a href="#features" className="footer-link" onClick={(e) => handleLinkClick(e, 'features')}>Features</a>
                <a href="#benefits" className="footer-link" onClick={(e) => handleLinkClick(e, 'benefits')}>Benefits</a>
                <a href="#how-it-works" className="footer-link" onClick={(e) => handleLinkClick(e, 'how-it-works')}>How It Works</a>
                <a href="#security" className="footer-link" onClick={(e) => handleLinkClick(e, 'security')}>Security</a>
                <a href="/faq" className="footer-link" onClick={(e) => handleLinkClick(e, 'faq')}>FAQ</a>
              </div>

              <div className="footer-link-col">
                <h5 className="footer-link-heading">Technology</h5>
                <span className="footer-link-static">Circom zk-SNARKs</span>
                <span className="footer-link-static">Pinata IPFS Gateway</span>
                <span className="footer-link-static">EIP-712 Relayers</span>
                <span className="footer-link-static">Ethereum Sepolia</span>
              </div>

              <div className="footer-link-col">
                <h5 className="footer-link-heading">About</h5>
                <a href="/team" className="footer-link" onClick={(e) => handleLinkClick(e, 'team')}>About Team</a>
                <span 
                  className="footer-link-static" 
                  onClick={handleOpenHackathon} 
                  style={{ cursor: 'pointer', color: 'var(--brand-blue)' }}
                >
                  Hackathon Details
                </span>
                <span className="footer-link-static">Open Source MVP</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">
              © {new Date().getFullYear()} TrueVote. Built for decentralized, tamper-proof governance.
            </p>
            <div className="footer-bottom-badges">
              <span className="footer-badge-tag">Zero-Knowledge</span>
              <span className="footer-badge-tag">Decentralized IPFS</span>
              <span className="footer-badge-tag">100% Verifiable</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Internal Hackathon Dialogue Box if opened directly from footer */}
      <DialogueBox 
        isOpen={internalHackathonOpen} 
        onClose={() => setInternalHackathonOpen(false)} 
      />
    </>
  );
};

export default Footer;
