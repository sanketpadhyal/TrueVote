import React, { useState } from 'react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Signer' | 'Election Officer' | 'Auditor';
  wallet: string;
  status: 'Active' | 'Invited' | 'Multi-Sig Ready';
  avatarColor: string;
}

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: '1',
    name: 'Sanket Padhyal',
    email: 'sanket@truevote.org',
    role: 'Admin',
    wallet: '0x71C...399E',
    status: 'Active',
    avatarColor: 'linear-gradient(135deg, #0284c7, #2563eb)'
  },
  {
    id: '2',
    name: 'Elena Rostova',
    email: 'elena.rostova@governance.eth',
    role: 'Signer',
    wallet: '0x3a4...8b21',
    status: 'Multi-Sig Ready',
    avatarColor: 'linear-gradient(135deg, #059669, #10b981)'
  },
  {
    id: '3',
    name: 'Marcus Vance',
    email: 'marcus@cryptocouncil.io',
    role: 'Signer',
    wallet: '0x88f...4e19',
    status: 'Multi-Sig Ready',
    avatarColor: 'linear-gradient(135deg, #7c3aed, #a855f7)'
  },
  {
    id: '4',
    name: 'Aisha Al-Mansoor',
    email: 'aisha.m@electiontrust.org',
    role: 'Election Officer',
    wallet: '0x5c2...910a',
    status: 'Active',
    avatarColor: 'linear-gradient(135deg, #d97706, #f59e0b)'
  },
  {
    id: '5',
    name: 'Julian Thorne',
    email: 'j.thorne@securityaudit.zk',
    role: 'Auditor',
    wallet: '0x10d...77ca',
    status: 'Active',
    avatarColor: 'linear-gradient(135deg, #4f46e5, #6366f1)'
  }
];

export const TeamTab: React.FC = () => {
  const [members] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'Admin' | 'Signer' | 'Election Officer' | 'Auditor'>('all');

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.wallet.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="tab-pane-wrapper tab-content-animate">
      <header className="tab-header-row">
        <div>
          <h1 className="dashboard-title">Your Team & Multi-Sig Governance</h1>
          <p className="tab-subtitle">
            Manage election commissioners, multi-sig signers, and cryptographic protocol auditors.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary-tab"
          onClick={() => alert('Invite member modal triggered')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Invite Member
        </button>
      </header>

      {/* Team Stats */}
      <div className="tab-stats-grid">
        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">Multi-Sig Signers</span>
            <span className="tab-stat-badge badge-green">3 / 5 Required</span>
          </div>
          <div className="tab-stat-value">5 Keys</div>
          <div className="tab-stat-desc">Safe multi-sig contract active</div>
        </div>

        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">Active Administrators</span>
            <span className="tab-stat-badge badge-blue">Admin Tier</span>
          </div>
          <div className="tab-stat-value">2</div>
          <div className="tab-stat-desc">Hardware 2FA enforced</div>
        </div>

        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">Election Officers</span>
            <span className="tab-stat-badge badge-purple">On Duty</span>
          </div>
          <div className="tab-stat-value">4</div>
          <div className="tab-stat-desc">Monitoring active ballots</div>
        </div>

        <div className="tab-stat-card">
          <div className="tab-stat-header">
            <span className="tab-stat-label">Security Observers</span>
            <span className="tab-stat-badge badge-gray">Read-Only</span>
          </div>
          <div className="tab-stat-value">6</div>
          <div className="tab-stat-desc">Independent verified watchers</div>
        </div>
      </div>

      {/* Multi-Sig Health Banner */}
      <div className="multisig-banner-card">
        <div className="multisig-banner-content">
          <div className="multisig-icon-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div>
            <div className="multisig-banner-title">Multi-Sig Threshold Safeguard: 60% Quorum (3/5)</div>
            <div className="multisig-banner-text">
              High-impact governance actions (initiating emergency pause, changing quorum limits, finalizing zero-knowledge election contracts) require cryptographic signatures from at least 3 authorized council signers.
            </div>
          </div>
        </div>
        <div className="multisig-badge-tag">
          <span className="pulse-dot"></span> Threshold Secured
        </div>
      </div>

      {/* Toolbar */}
      <div className="tab-toolbar">
        <div className="tab-search-wrap">
          <svg className="tab-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="tab-search-input"
            placeholder="Search member by name, role, or wallet address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="tab-filter-pills">
          {(['all', 'Admin', 'Signer', 'Election Officer', 'Auditor'] as const).map((r) => (
            <button
              key={r}
              type="button"
              className={`filter-pill ${roleFilter === r ? 'active' : ''}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === 'all' ? 'All Roles' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Team Table */}
      <div className="tab-table-container">
        <table className="tab-custom-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Governance Role</th>
              <th>Wallet Address</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="member-cell-info">
                      <div
                        className="member-avatar-fallback"
                        style={{ background: m.avatarColor }}
                      >
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <div className="member-name-text">{m.name}</div>
                        <div className="member-email-text">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-tag-badge role-${m.role.toLowerCase().replace(' ', '-')}`}>
                      {m.role}
                    </span>
                  </td>
                  <td>
                    <span className="wallet-chip">
                      <code>{m.wallet}</code>
                      <button
                        type="button"
                        className="copy-chip-btn"
                        title="Copy wallet address"
                        onClick={() => navigator.clipboard?.writeText(m.wallet)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${m.status === 'Active' ? 'status-active' : 'status-multisig'}`}>
                      <span className="dot"></span>
                      {m.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-action-btns">
                      <button
                        type="button"
                        className="btn-text-action"
                        onClick={() => alert(`Permissions for ${m.name}`)}
                      >
                        Permissions
                      </button>
                      <button
                        type="button"
                        className="btn-text-action action-danger"
                        onClick={() => alert(`Revoke ${m.name}`)}
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="tab-empty-state">
                  No team members match your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamTab;
