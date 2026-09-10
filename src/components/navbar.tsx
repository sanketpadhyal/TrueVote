import React, { useState, useEffect } from 'react';
import './navbar.css';
import '../styles/animations.css';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          {/* Logo */}
          <a href="/" className="navbar-brand">
            <div className="navbar-star-icon">✦</div>
            <span>TrueVote</span>
          </a>

          {/* Links matching Screenshot 3 */}
          <ul className="navbar-menu">
            <li><a href="#features" className="navbar-link">Features</a></li>
            <li><a href="#benefits" className="navbar-link">Benefits</a></li>
            <li><a href="#integrations" className="navbar-link">Integrations</a></li>
            <li><a href="#pricing" className="navbar-link">Pricing</a></li>
            <li><a href="#faq" className="navbar-link">FAQ</a></li>
            <li><a href="#blogs" className="navbar-link">Blogs</a></li>
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
        <a href="#features" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
        <a href="#benefits" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Benefits</a>
        <a href="#integrations" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Integrations</a>
        <a href="#pricing" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Pricing</a>
        <a href="#faq" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a>
        <a href="#blogs" className="mobile-nav-link" onClick={() => setIsMobileMenuOpen(false)}>Blogs</a>
        <button className="btn-hyper-blue" style={{ width: '100%' }}>
          Get Started
        </button>
      </div>
    </>
  );
};

export default Navbar;
