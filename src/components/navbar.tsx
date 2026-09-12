import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FlipText } from './universalbuttonshover';
import './navbar.css';
import '../styles/animations.css';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const mountTimer = setTimeout(() => {
      setIsMounted(true);
    }, 40);

    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(mountTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleBrandClick = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (location.pathname === '/') {
      if ((window as any).lenis) {
        (window as any).lenis.scrollTo(0, { duration: 1.2 });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      navigate('/');
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLElement>, target: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

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

    if (target === 'dashboard') {
      const wallet = localStorage.getItem('truevote_connected_wallet');
      if (!wallet) {
        if (location.pathname === '/') {
          window.dispatchEvent(new CustomEvent('open-auth-modal'));
        } else {
          navigate('/?login=true');
        }
      } else {
        if (location.pathname === '/dashboard') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          navigate('/dashboard');
        }
      }
      return;
    }

    if (location.pathname === '/') {
      const element = document.getElementById(target);
      if (!element) return;

      element.classList.remove('nav-highlight-animate');
      void element.offsetWidth; // Force reflow
      element.classList.add('nav-highlight-animate');
      setTimeout(() => {
        element.classList.remove('nav-highlight-animate');
      }, 1400);

      if ((window as any).lenis) {
        (window as any).lenis.scrollTo(element, { offset: -80, duration: 1.2 });
      } else {
        const navbarOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } else {
      navigate(`/#${target}`);
    }
  };

  return (
    <>
      <header className={`navbar-header ${isScrolled ? 'scrolled' : ''} ${isMounted ? 'nav-visible' : 'nav-blur-initial'} ${isMobileMenuOpen ? 'mobile-expanded' : ''}`}>
        <div className="navbar-inner">
          {/* Logo with User's Brand Logo */}
          <a href="/" className="navbar-brand" onClick={handleBrandClick}>
            <img
              src="/images/logo.png"
              alt="TrueVote Logo"
              className="navbar-logo-img"
            />
            <span className="navbar-brand-name">True<span className="brand-accent">Vote</span></span>
          </a>

          {/* Center Nav Links */}
          <ul className="navbar-menu">
            <li><a href="#features" className="navbar-link" onClick={(e) => handleNavClick(e, 'features')}>Features</a></li>
            <li><a href="#benefits" className="navbar-link" onClick={(e) => handleNavClick(e, 'benefits')}>Benefits</a></li>
            <li><a href="#how-it-works" className="navbar-link" onClick={(e) => handleNavClick(e, 'how-it-works')}>How It Works</a></li>
            <li><a href="#security" className="navbar-link" onClick={(e) => handleNavClick(e, 'security')}>Security</a></li>
            <li><a href="/faq" className={`navbar-link ${location.pathname === '/faq' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'faq')}>FAQ</a></li>
            <li><a href="/dashboard" className={`navbar-link ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'dashboard')}>Dashboard</a></li>
          </ul>

          {/* Action CTA */}
          <div className="navbar-actions">
            <button 
              className={`btn-hyper-blue framer-flip-btn ${location.pathname === '/team' ? 'active' : ''}`}
              onClick={(e) => handleNavClick(e, 'team')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M15 19.5c0-2.5-2-4.5-4.5-4.5S6 17 6 19.5" />
                <circle cx="10.5" cy="8.5" r="3.5" />
                <path d="M18 19c0-1.8-1.2-3.3-2.8-3.8" />
                <path d="M14.5 5.2a3.5 3.5 0 0 1 0 6.6" />
              </svg>
              <FlipText>About Team</FlipText>
            </button>

            <button 
              className={`mobile-toggle-btn ${isMobileMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="14" x2="13" y2="14" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Seamlessly Extending Mobile Panel inside Navbar */}
        <div className="mobile-expand-panel">
          <div className="mobile-expand-content">
            <a href="#features" className="mobile-nav-link" onClick={(e) => handleNavClick(e, 'features')}>Features</a>
            <a href="#benefits" className="mobile-nav-link" onClick={(e) => handleNavClick(e, 'benefits')}>Benefits</a>
            <a href="#how-it-works" className="mobile-nav-link" onClick={(e) => handleNavClick(e, 'how-it-works')}>How It Works</a>
            <a href="#security" className="mobile-nav-link" onClick={(e) => handleNavClick(e, 'security')}>Security</a>
            <a href="/faq" className={`mobile-nav-link ${location.pathname === '/faq' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'faq')}>FAQ</a>
            <a href="/dashboard" className={`mobile-nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`} onClick={(e) => handleNavClick(e, 'dashboard')}>Dashboard</a>
            <button 
              className={`btn-hyper-blue framer-flip-btn mobile-team-cta ${location.pathname === '/team' ? 'active' : ''}`} 
              onClick={(e) => handleNavClick(e, 'team')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M15 19.5c0-2.5-2-4.5-4.5-4.5S6 17 6 19.5" />
                <circle cx="10.5" cy="8.5" r="3.5" />
                <path d="M18 19c0-1.8-1.2-3.3-2.8-3.8" />
                <path d="M14.5 5.2a3.5 3.5 0 0 1 0 6.6" />
              </svg>
              <FlipText>About Team</FlipText>
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop for tapping outside to close */}
      <div 
        className={`navbar-backdrop ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
};

export default Navbar;
