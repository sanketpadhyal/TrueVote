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

const getStoredParticipants = (): Participant[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('truevote_participants');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading participants:', e);
  }
  return [];
};

export const ParticipantsTab: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const participants = getStoredParticipants();

  const totalCount = participants.length;
  const verifiedCount = participants.filter((p) => p.zkpStatus === 'verified').length;
  const pendingCount = participants.filter((p) => p.zkpStatus === 'pending').length;
  const ballotsCastCount = participants.reduce((sum, p) => sum + (p.ballotsCast || 0), 0);

  const filteredParticipants = participants.filter((p) => {
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
          <div className="tab-stat-value">{totalCount}</div>
          <div className="tab-stat-desc">{totalCount === 0 ? 'No voters registered' : 'Eligible voting addresses'}</div>
        </div>

        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">ZKP Verified</span>
            <span className="tab-stat-badge badge-green">zk-SNARK</span>
          </div>
          <div className="tab-stat-value">{verifiedCount}</div>
          <div className="tab-stat-desc">{totalCount === 0 ? 'Zero proofs submitted' : `${((verifiedCount / totalCount) * 100).toFixed(1)}% verified`}</div>
        </div>

        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">Anonymous Ballots</span>
            <span className="tab-stat-badge badge-purple">On-Chain</span>
          </div>
          <div className="tab-stat-value">{ballotsCastCount}</div>
          <div className="tab-stat-desc">{ballotsCastCount === 0 ? 'No ballots cast yet' : 'Cryptographically shielded'}</div>
        </div>

        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">Pending Review</span>
            <span className="tab-stat-badge badge-amber">Awaiting ZK</span>
          </div>
          <div className="tab-stat-value">{pendingCount}</div>
          <div className="tab-stat-desc">{pendingCount === 0 ? 'Queue clear' : 'Proof verification queued'}</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="tab-toolbar">
        <div className="tab-search-wrap">
          <svg className="tab-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              className={`filter-pill ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Participants Table */}
      <div className="tab-table-container">
        <table className="tab-custom-table">
          <thead>
            <tr>
              <th>Voter / Pseudonym</th>
              <th>Wallet Address</th>
              <th>ZKP Status</th>
              <th>Voting Weight</th>
              <th>Ballots Cast</th>
              <th>Last Active</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredParticipants.length > 0 ? (
              filteredParticipants.map((participant) => (
                <tr key={participant.id}>
                  <td>
                    <div className="voter-name-cell">
                      <div className="voter-avatar-circle">
                        {participant.name.charAt(0)}
                      </div>
                      <span className="voter-name-bold">{participant.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="wallet-chip">
                      <code>{participant.address}</code>
                      <button
                        type="button"
                        className="copy-chip-btn"
                        title="Copy address"
                        onClick={() => navigator.clipboard?.writeText(participant.address)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${participant.zkpStatus === 'verified' ? 'status-active' : 'status-pending'}`}>
                      <span className="dot"></span>
                      {participant.zkpStatus === 'verified' ? 'ZKP Verified' : 'ZK Proof Pending'}
                    </span>
                  </td>
                  <td>{participant.weight.toFixed(2)}x</td>
                  <td>{participant.ballotsCast}</td>
                  <td>{participant.lastActive}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-text-action"
                      onClick={() => alert(`Review credentials for ${participant.name}`)}
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="tab-empty-state">
                  No whitelisted voters found. Add an eligible Ethereum address to register participants.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParticipantsTab;
