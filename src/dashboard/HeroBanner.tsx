import React from 'react';
import bannerImg from './images/ChatGPT Image Sep 12, 2026, 01_06_40 PM.webp';

interface HeroBannerProps {
  userName?: string;
  organizationName?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  userName,
  organizationName = 'Wyborek',
}) => {
  return (
    <div className="dashboard-hero-banner">
      <div className="hero-banner-content">
        {userName && <h2 className="hero-banner-title">Hi {userName}!</h2>}
        <p className="hero-banner-desc">
          Check how voting is carried out in your organization
        </p>
      </div>
      <div className="hero-banner-artwork">
        <img
          src={bannerImg}
          alt="Voting Illustration"
          className="hero-banner-img"
        />
      </div>
    </div>
  );
};

export default HeroBanner;
