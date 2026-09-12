import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);

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
        onTabChange={setActiveTab}
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
