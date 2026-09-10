import React, { useState, useEffect } from 'react';
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

  return (
    <>
      <header className={`navbar-header ${isScrolled ? 'scrolled' : ''} ${isMounted ? 'nav-visible' : 'nav-blur-initial'}`}>
        <div className="navbar-inner">
          {/* Logo with User's Brand Logo */}
          <a href="/" className="navbar-brand">
            <img 
              src="/images/logo.png" 
              alt="TrueVote Logo" 
              className="navbar-logo-img" 
            />
            <span className="navbar-brand-name">True<span className="brand-accent">Vote</span></span>
          </a>

          {/* Center Nav Links */}
          <ul className="navbar-menu">
            <li><a href="#features" className="navbar-link">Features</a></li>
            <li><a href="#benefits" className="navbar-link">Benefits</a></li>
          </ul>

          {/* Action CTA */}
          <div className="navbar-actions">
            <button className="btn-hyper-blue">
              Get Started
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
        <a href="#features" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
        <a href="#benefits" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Benefits</a>
        <button className="btn-hyper-blue" style={{ width: '100%' }}>
          Get Started
        </button>
      </div>
    </>
  );
};

export default Navbar;
