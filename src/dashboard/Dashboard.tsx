import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import HeroBanner from './HeroBanner';
import EventsTable from './EventsTable';
import ActionCards from './ActionCards';
import StatsPanel from './StatsPanel';
import EventsTab from './EventsTab';
import ParticipantsTab from './ParticipantsTab';
import TeamTab from './TeamTab';
import SettingsTab from './SettingsTab';
import LogoutModal from './LogoutModal';
import './dashboard.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ tab?: string }>();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

  // Helper to derive tab from route parameter or window location
  const getTabFromRoute = React.useCallback((): string => {
    if (params.tab) {
      const t = params.tab.toLowerCase();
      if (['events', 'participants', 'team', 'settings'].includes(t)) {
        return t;
      }
    }
    const path = (location?.pathname || (typeof window !== 'undefined' ? window.location.pathname : '')).toLowerCase();
    if (path.includes('/dashboard/events')) return 'events';
    if (path.includes('/dashboard/participants')) return 'participants';
    if (path.includes('/dashboard/team')) return 'team';
    if (path.includes('/dashboard/settings')) return 'settings';
    return 'dashboard';
  }, [params.tab, location?.pathname]);

  const [activeTab, setActiveTab] = useState<string>(getTabFromRoute);

  // Synchronize activeTab whenever location or params change
  useEffect(() => {
    const routeTab = getTabFromRoute();
    setActiveTab(routeTab);
  }, [getTabFromRoute]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    if (newTab === 'dashboard') {
      navigate('/dashboard');
    } else {
      navigate(`/dashboard/${newTab}`);
    }
  };

  const handleNewEvent = () => {
    alert('Create new voting event modal / action triggered!');
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem('truevote_connected_wallet');
    sessionStorage.clear();
    setIsLogoutModalOpen(false);
    window.location.href = '/';
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'events':
        return <EventsTab onCreateEvent={handleNewEvent} />;
      case 'participants':
        return <ParticipantsTab />;
      case 'team':
        return <TeamTab />;
      case 'settings':
        return <SettingsTab />;
      case 'dashboard':
      default:
        return (
          <div className="tab-pane-wrapper tab-content-animate">
            <header className="dashboard-header">
              <h1 className="dashboard-title">Dashboard</h1>
            </header>

            {/* Greeting Hero Banner */}
            <HeroBanner />

            {/* Events Table */}
            <EventsTable />

            {/* Action Cards (Bottom) */}
            <ActionCards onNewEvent={handleNewEvent} />
          </div>
        );
    }
  };

  return (
    <div className={`wyborek-dashboard-root tab-active-${activeTab}`}>
      {/* 1. Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={() => setIsLogoutModalOpen(true)}
      />

      {/* 2. Main Center Content Container */}
      <main className="wyborek-main-content">
        <div className="main-content-card" key={activeTab}>
          {renderActiveTabContent()}
        </div>
      </main>

      {/* 3. Right Stats Panel */}
      <StatsPanel />

      {/* 4. Logout Confirmation Popup Panel */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={handleConfirmLogout}
      />
    </div>
  );
};

export default Dashboard;
