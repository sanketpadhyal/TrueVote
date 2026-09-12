import React, { useState } from 'react';

interface Participant {
  id: string;
  name: string;
  address: string;
  zkpStatus: 'verified' | 'pending' | 'flagged';
  weight: number;
  ballotsCast: number;
  registeredDate: string;
  lastActive: string;
}

const MOCK_PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Alexandre Dubois', address: '0x71C...4f9a', zkpStatus: 'verified', weight: 1.0, ballotsCast: 14, registeredDate: '12 Jan 2026', lastActive: '2 mins ago' },
  { id: '2', name: 'Sophia Kowalska', address: '0x92B...81e2', zkpStatus: 'verified', weight: 1.5, ballotsCast: 22, registeredDate: '15 Jan 2026', lastActive: '18 mins ago' },
  { id: '3', name: 'Liam Chen', address: '0x3F8...67d1', zkpStatus: 'verified', weight: 1.0, ballotsCast: 9, registeredDate: '20 Jan 2026', lastActive: '1 hour ago' },
  { id: '4', name: 'Elena Rostova', address: '0x88A...99c4', zkpStatus: 'verified', weight: 2.0, ballotsCast: 31, registeredDate: '02 Feb 2026', lastActive: '3 hours ago' },
  { id: '5', name: 'Tariq Al-Mansoor', address: '0x14C...33f8', zkpStatus: 'pending', weight: 1.0, ballotsCast: 0, registeredDate: '28 Feb 2026', lastActive: 'Yesterday' },
  { id: '6', name: 'Chiara Moretti', address: '0x55E...12a9', zkpStatus: 'verified', weight: 1.0, ballotsCast: 18, registeredDate: '05 Mar 2026', lastActive: '2 days ago' },
  { id: '7', name: 'Mateusz Nowak', address: '0x43D...77b5', zkpStatus: 'verified', weight: 1.25, ballotsCast: 12, registeredDate: '08 Mar 2026', lastActive: '3 days ago' },
  { id: '8', name: 'Amina Diallo', address: '0x66F...08e1', zkpStatus: 'pending', weight: 1.0, ballotsCast: 0, registeredDate: '10 Mar 2026', lastActive: '4 days ago' },
  { id: '9', name: 'Vikram Patel', address: '0x99B...44c2', zkpStatus: 'verified', weight: 1.0, ballotsCast: 27, registeredDate: '11 Mar 2026', lastActive: '5 days ago' },
  { id: '10', name: 'Hanna Lindqvist', address: '0x21A...58d3', zkpStatus: 'verified', weight: 1.0, ballotsCast: 16, registeredDate: '12 Mar 2026', lastActive: 'Just now' },
];

export const ParticipantsTab: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredParticipants = MOCK_PARTICIPANTS.filter((p) => {
    const matchesFilter = filter === 'all' || p.zkpStatus === filter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="tab-pane-wrapper tab-content-animate">
      <header className="tab-header-row">
        <div>
          <h1 className="dashboard-title">Participants & Voter Registry</h1>
          <p className="tab-subtitle">
            Zero-knowledge cryptographic whitelist of verified voters and privacy-preserving ballot credentials.
          </p>
        </div>
        <div className="tab-header-actions">
          <button
            type="button"
            className="btn-secondary-tab"
            onClick={() => alert('Exporting Voter Registry CSV...')}
          >
            Export CSV
          </button>
          <button
            type="button"
            className="btn-primary-tab"
            onClick={() => alert('Add Participant / Whitelist Wallet Modal opened')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Participant
          </button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="tab-stats-grid">
        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">Total Whitelisted</span>
            <span className="tab-stat-badge badge-blue">Registry</span>
          </div>
          <div className="tab-stat-value">1,420</div>
          <div className="tab-stat-desc">Eligible voting addresses</div>
        </div>

        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">ZKP Verified</span>
            <span className="tab-stat-badge badge-green">zk-SNARK</span>
          </div>
          <div className="tab-stat-value">1,385</div>
          <div className="tab-stat-desc">97.5% verification rate</div>
        </div>

        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">Anonymous Ballots</span>
            <span className="tab-stat-badge badge-purple">On-Chain</span>
          </div>
          <div className="tab-stat-value">982</div>
          <div className="tab-stat-desc">Cryptographically shielded</div>
        </div>

        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">Pending Review</span>
            <span className="tab-stat-badge badge-amber">Awaiting ZK</span>
          </div>
          <div className="tab-stat-value">35</div>
          <div className="tab-stat-desc">Proof verification queued</div>
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
            placeholder="Search by voter name, pseudonym, or 0x address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="tab-search-input"
          />
        </div>

        <div className="tab-filter-pills">
          {(['all', 'verified', 'pending'] as const).map((key) => (
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

      {/* Participants Table */}
      <div className="events-table-container">
        <table className="events-table">
          <thead>
            <tr>
              <th className="th-event">Voter / Identity</th>
              <th className="th-voting">Wallet Address</th>
              <th className="th-activation">ZK Privacy Status</th>
              <th className="th-action-date">Ballots Cast</th>
              <th className="th-action-btn">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredParticipants.map((voter) => (
              <tr key={voter.id} className="event-row">
                <td className="td-event">
                  <div className="voter-identity-cell">
                    <div className="voter-avatar-badge">
                      {voter.name.charAt(0)}
                    </div>
                    <div>
                      <div className="event-title-text">{voter.name}</div>
                      <div className="event-date-text">Registered {voter.registeredDate}</div>
                    </div>
                  </div>
                </td>
                <td className="td-voting">
                  <code className="address-chip" title="Click to copy address">
                    {voter.address}
                  </code>
                </td>
                <td className="td-activation">
                  <span className={`status-pill status-${voter.zkpStatus}`}>
                    {voter.zkpStatus === 'verified' ? (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        ZK Verified
                      </>
                    ) : (
                      <>
                        <span className="pulse-dot-amber"></span>
                        Pending Proof
                      </>
                    )}
                  </span>
                </td>
                <td className="td-action-date">
                  <div className="event-date-cell">
                    <span className="event-date-primary">{voter.ballotsCast} votes</span>
                    <span className="event-date-time">{voter.lastActive}</span>
                  </div>
                </td>
                <td className="td-action-btn">
                  <button
                    type="button"
                    className="btn-activate-event"
                    onClick={() => alert(`Viewing cryptographic proof audit for ${voter.name} (${voter.address})`)}
                  >
                    View Proof
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParticipantsTab;
