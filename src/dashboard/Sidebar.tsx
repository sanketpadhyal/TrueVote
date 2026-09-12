import React from 'react';

interface SidebarProps {
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab = 'dashboard',
  onTabChange,
  onLogout,
}) => {
  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  const handleBrandClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onTabChange) {
      onTabChange('dashboard');
    } else {
      window.location.href = '/dashboard';
    }
  };

  const menuItems = [
    {
      id: 'dashboard',
      label: 'dashboard',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1.5"></rect>
          <rect x="14" y="3" width="7" height="5" rx="1.5"></rect>
          <rect x="14" y="12" width="7" height="9" rx="1.5"></rect>
          <rect x="3" y="16" width="7" height="5" rx="1.5"></rect>
        </svg>
      ),
    },
    {
      id: 'events',
      label: 'voting and events',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <path d="m9 15 2 2 4-4"></path>
        </svg>
      ),
    },
  ];

  return (
    <aside className="wyborek-sidebar">
      <div className="wyborek-logo-wrap">
        <button
          type="button"
          onClick={handleBrandClick}
          className="wyborek-brand"
          title="TrueVote"
        >
          <img
            src="/images/logo.png"
            alt="TrueVote Logo"
            className="sidebar-logo-img"
          />
          <span className="brand-text sidebar-brand-text">
            True<span className="brand-accent">Vote</span>
          </span>
        </button>
      </div>

      <nav className="wyborek-nav">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange && onTabChange(item.id)}
            >
              <div className="nav-icon-wrap">{item.icon}</div>
              <span className="nav-label">{item.label}</span>
              {isActive && <div className="nav-active-pill" />}
            </button>
          );
        })}
      </nav>

      {/* Log Out Button at the bottom of the sidebar */}
      <div className="wyborek-sidebar-footer">
        <button
          type="button"
          className="logout-btn"
          onClick={handleLogoutClick}
          title="Log out"
          aria-label="Log out"
        >
          <div className="logout-icon-wrap">
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </div>
          <span className="logout-label">log out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
