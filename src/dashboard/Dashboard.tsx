import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import HeroBanner from './HeroBanner';
import EventsTable from './EventsTable';
import ActionCards from './ActionCards';
import StatsPanel from './StatsPanel';
import EventsTab from './EventsTab';
import LogoutModal from './LogoutModal';
import NewEventModal from './NewEventModal';
import './dashboard.css';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ tab?: string }>();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState<boolean>(false);

  const getTabFromRoute = React.useCallback((): string => {
    if (params.tab) {
      const t = params.tab.toLowerCase();
      if (['events'].includes(t)) {
        return t;
      }
    }
    const path = (location?.pathname || (typeof window !== 'undefined' ? window.location.pathname : '')).toLowerCase();
    if (path.includes('/dashboard/events')) return 'events';
    return 'dashboard';
  }, [params.tab, location?.pathname]);

  const [activeTab, setActiveTab] = useState<string>(getTabFromRoute);

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
    setIsNewEventModalOpen(true);
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem('truevote_connected_wallet');
    localStorage.removeItem('truevote_wallet_connected_addr');
    sessionStorage.clear();
    setIsLogoutModalOpen(false);
    window.dispatchEvent(new Event('truevote_wallet_disconnected'));
    window.location.href = '/';
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'events':
        return <EventsTab onCreateEvent={handleNewEvent} />;
      case 'dashboard':
      default:
        return (
          <div className="tab-pane-wrapper tab-content-animate">
            <header className="dashboard-header">
              <h1 className="dashboard-title">Dashboard</h1>
            </header>

            <HeroBanner />

            <EventsTable />

            <ActionCards onNewEvent={handleNewEvent} />
          </div>
        );
    }
  };

  return (
    <div className={`wyborek-dashboard-root tab-active-${activeTab}`}>

      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={() => setIsLogoutModalOpen(true)}
      />

      <main className="wyborek-main-content">
        <div className="main-content-card" key={activeTab}>
          {renderActiveTabContent()}
        </div>
      </main>

      <StatsPanel />

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={handleConfirmLogout}
      />

      <NewEventModal
        isOpen={isNewEventModalOpen}
        onClose={() => setIsNewEventModalOpen(false)}
        onEventCreated={() => {

        }}
      />
    </div>
  );
};

export default Dashboard;

