import React from 'react';
import bannerImg from './images/banner_illustration.png';
import bannerImgHd from './images/banner_illustration_hd.jpg';

interface HeroBannerProps {
  userName?: string;
  organizationName?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  userName = 'Agnes',
  organizationName = 'Wyborek',
}) => {
  return (
    <div className="dashboard-hero-banner">
      <div className="hero-banner-content">
        <h2 className="hero-banner-title">Hi {userName}!</h2>
        <p className="hero-banner-desc">
          Check how voting is carried out in your organization: „{organizationName}”!
        </p>
      </div>
      <div className="hero-banner-artwork">
        <img
          src={bannerImg}
          alt="Voting Illustration"
          className="hero-banner-img"
          onError={(e) => {
            (e.target as HTMLImageElement).src = bannerImgHd;
          }}
        />
      </div>
    </div>
  );
};

export default HeroBanner;
