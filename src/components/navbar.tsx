import React, { useState, useEffect } from 'react';
import { FlipText } from './universalbuttonshover';
import './navbar.css';
import '../styles/animations.css';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

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

  const scrollToTop = (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    if ((window as any).lenis) {
      (window as any).lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLElement>, id: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (!element) return;

    // Trigger blur-to-normal animation on target section when navigating from navbar
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
  };

  return (
    <>
      <header className={`navbar-header ${isScrolled ? 'scrolled' : ''} ${isMounted ? 'nav-visible' : 'nav-blur-initial'}`}>
        <div className="navbar-inner">
          {/* Logo with User's Brand Logo */}
          <a href="/" className="navbar-brand" onClick={scrollToTop}>
            <img
              src="/images/logo.png"
              alt="TrueVote Logo"
              className="navbar-logo-img"
            />
            <span className="navbar-brand-name">True<span className="brand-accent">Vote</span></span>
          </a>

          {/* Center Nav Links */}
          <ul className="navbar-menu">
            <li><a href="#features" className="navbar-link" onClick={(e) => scrollToSection(e, 'features')}>Features</a></li>
            <li><a href="#benefits" className="navbar-link" onClick={(e) => scrollToSection(e, 'benefits')}>Benefits</a></li>
            <li><a href="#how-it-works" className="navbar-link" onClick={(e) => scrollToSection(e, 'how-it-works')}>How It Works</a></li>
            <li><a href="#security" className="navbar-link" onClick={(e) => scrollToSection(e, 'security')}>Security</a></li>
            <li><a href="#faq" className="navbar-link" onClick={(e) => scrollToSection(e, 'faq')}>FAQ</a></li>
          </ul>

          {/* Action CTA */}
          <div className="navbar-actions">
            <button 
              className="btn-hyper-blue framer-flip-btn"
              onClick={(e) => scrollToSection(e, 'team')}
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
              className="mobile-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <div className={`mobile-drawer ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-drawer-brand">
          <img src="/images/logo.png" alt="TrueVote" className="navbar-logo-img" style={{ width: 28, height: 28 }} />
          <span className="navbar-brand-name">True<span className="brand-accent">Vote</span></span>
        </div>
        <a href="#features" className="mobile-nav-link" onClick={(e) => scrollToSection(e, 'features')}>Features</a>
        <a href="#benefits" className="mobile-nav-link" onClick={(e) => scrollToSection(e, 'benefits')}>Benefits</a>
        <a href="#how-it-works" className="mobile-nav-link" onClick={(e) => scrollToSection(e, 'how-it-works')}>How It Works</a>
        <a href="#security" className="mobile-nav-link" onClick={(e) => scrollToSection(e, 'security')}>Security</a>
        <a href="#faq" className="mobile-nav-link" onClick={(e) => scrollToSection(e, 'faq')}>FAQ</a>
        <button 
          className="btn-hyper-blue framer-flip-btn" 
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={(e) => scrollToSection(e, 'team')}
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
    </>
  );
};

export default Navbar;
