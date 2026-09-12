import React, { useState } from 'react';
import EventsTable from './EventsTable';

interface EventsTabProps {
  onCreateEvent?: () => void;
}

export const EventsTab: React.FC<EventsTabProps> = ({ onCreateEvent }) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreate = () => {
    if (onCreateEvent) {
      onCreateEvent();
    } else {
      alert('Create new voting event modal / action triggered!');
    }
  };

  return (
    <div className="tab-pane-wrapper tab-content-animate">
      <header className="tab-header-row">
        <div>
          <h1 className="dashboard-title">Voting & Events</h1>
          <p className="tab-subtitle">
            Manage active election polls, community referendums, and cryptographic governance proposals.
          </p>
        </div>
        <button type="button" className="btn-primary-tab" onClick={handleCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Event
        </button>
      </header>

      {/* Quick Metrics Bar */}
      <div className="tab-stats-grid">
        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">Total Events</span>
            <span className="tab-stat-badge badge-blue">Registry</span>
          </div>
          <div className="tab-stat-value">40</div>
          <div className="tab-stat-desc">Across all categories</div>
        </div>

        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">Active Voting</span>
            <span className="tab-stat-badge badge-green">
              <span className="pulse-dot"></span> Live
            </span>
          </div>
          <div className="tab-stat-value">12</div>
          <div className="tab-stat-desc">Accepting ballots now</div>
        </div>

        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">Upcoming</span>
            <span className="tab-stat-badge badge-amber">Scheduled</span>
          </div>
          <div className="tab-stat-value">8</div>
          <div className="tab-stat-desc">Starts within 7 days</div>
        </div>

        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">Avg. Turnout</span>
            <span className="tab-stat-badge badge-purple">ZKP Verified</span>
          </div>
          <div className="tab-stat-value">94.2%</div>
          <div className="tab-stat-desc">+3.8% from last month</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="tab-toolbar">
        <div className="tab-search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search events, mayor elections, meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tab-search-input"
          />
        </div>

        <div className="tab-filter-pills">
          {(['all', 'active', 'upcoming', 'completed'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={`tab-filter-pill ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table Container */}
      <div className="tab-table-wrapper">
        <EventsTable />
      </div>
    </div>
  );
};

export default EventsTab;
