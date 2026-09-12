import React, { useState } from 'react';
import Sidebar from './Sidebar';
import HeroBanner from './HeroBanner';
import EventsTable from './EventsTable';
import ActionCards from './ActionCards';
import StatsPanel from './StatsPanel';
import './dashboard.css';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  const handleNewEvent = () => {
    alert('Create new voting event modal / action triggered!');
  };

  const handleNewParticipant = () => {
    alert('Add new participant modal / action triggered!');
  };

  return (
    <div className="wyborek-dashboard-root">
      {/* 1. Left Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 2. Main Center Content Container */}
      <main className="wyborek-main-content">
        <div className="main-content-card">
          <header className="dashboard-header">
            <h1 className="dashboard-title">Dashboard</h1>
          </header>

          {/* Greeting Hero Banner */}
          <HeroBanner organizationName="Wyborek" />

          {/* Events Table */}
          <EventsTable />

          {/* Action Cards (Bottom) */}
          <ActionCards
            onNewEvent={handleNewEvent}
            onNewParticipant={handleNewParticipant}
          />
        </div>
      </main>

      {/* 3. Right Stats Panel */}
      <StatsPanel />
    </div>
  );
};

export default Dashboard;
