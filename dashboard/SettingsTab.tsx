import React, { useState } from 'react';

export const SettingsTab: React.FC = () => {
  const [orgName, setOrgName] = useState('TrueVote Governance Council');
  const [adminEmail, setAdminEmail] = useState('governance@truevote.org');
  const [quorumPercent, setQuorumPercent] = useState(25);
  const [votingDurationDays, setVotingDurationDays] = useState(7);
  const [timelockHours, setTimelockHours] = useState(48);
  const [zkpShield, setZkpShield] = useState(true);
  const [gaslessRelayer, setGaslessRelayer] = useState(true);
  const [sybilResistance, setSybilResistance] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.truevote.org/v1/elections/events');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="tab-pane-wrapper tab-content-animate">
      <header className="tab-header-row">
        <div>
          <h1 className="dashboard-title">Governance & Organization Settings</h1>
          <p className="tab-subtitle">
            Configure protocol parameters, cryptographic zero-knowledge circuits, and relayer gas sponsorship.
          </p>
        </div>
        <button
          type="submit"
          form="settings-form"
          className="btn-primary-tab"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          Save Configuration
        </button>
      </header>

      {isSaved && (
        <div className="tab-toast-success">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Protocol parameters updated & synced with smart contracts successfully!</span>
        </div>
      )}

      <form id="settings-form" onSubmit={handleSave} className="settings-grid">
        {/* Section 1: Organization Profile */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-wrap blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <div>
              <h2 className="settings-card-title">Organization Profile</h2>
              <p className="settings-card-subtitle">General council identifier and administrator contacts.</p>
            </div>
          </div>

          <div className="settings-form-body">
            <div className="settings-field">
              <label className="settings-label" htmlFor="org-name">Organization / DAO Name</label>
              <input
                id="org-name"
                type="text"
                className="settings-input"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="admin-email">Official Governance Email</label>
              <input
                id="admin-email"
                type="email"
                className="settings-input"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Consensus & Quorum Rules */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-wrap purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div>
              <h2 className="settings-card-title">Consensus & Quorum Rules</h2>
              <p className="settings-card-subtitle">Threshold parameters for legal proposal execution.</p>
            </div>
          </div>

          <div className="settings-form-body">
            <div className="settings-field">
              <div className="slider-label-row">
                <label className="settings-label" htmlFor="quorum-input">Minimum Quorum Required</label>
                <span className="slider-value-badge">{quorumPercent}%</span>
              </div>
              <input
                id="quorum-input"
                type="range"
                min="5"
                max="80"
                step="5"
                className="settings-slider"
                value={quorumPercent}
                onChange={(e) => setQuorumPercent(Number(e.target.value))}
              />
              <span className="settings-help">Percentage of eligible token holders or verified voters required for validity.</span>
            </div>

            <div className="settings-row-2col">
              <div className="settings-field">
                <label className="settings-label" htmlFor="voting-dur">Standard Voting Period (Days)</label>
                <input
                  id="voting-dur"
                  type="number"
                  min="1"
                  max="30"
                  className="settings-input"
                  value={votingDurationDays}
                  onChange={(e) => setVotingDurationDays(Number(e.target.value))}
                />
              </div>

              <div className="settings-field">
                <label className="settings-label" htmlFor="timelock-hours">Time-Lock Delay (Hours)</label>
                <input
                  id="timelock-hours"
                  type="number"
                  min="0"
                  max="168"
                  className="settings-input"
                  value={timelockHours}
                  onChange={(e) => setTimelockHours(Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Zero-Knowledge & Privacy Shield */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-wrap green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div>
              <h2 className="settings-card-title">Zero-Knowledge Proof & Privacy Shield</h2>
              <p className="settings-card-subtitle">Cryptographic nullifiers and ballot secrecy enforcement.</p>
            </div>
          </div>

          <div className="settings-form-body">
            <div className="settings-toggle-row">
              <div className="settings-toggle-info">
                <div className="toggle-title">Enforce zk-SNARK Anonymity</div>
                <div className="toggle-desc">Encrypt vote choices using Groth16 zk-circuits so choices cannot be mapped back to addresses.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={zkpShield}
                  onChange={(e) => setZkpShield(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="settings-toggle-info">
                <div className="toggle-title">Gasless Voter Sponsorship (EIP-2771)</div>
                <div className="toggle-desc">Sponsor all voting transaction gas via TrueVote meta-transaction relayers so voters pay $0.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={gaslessRelayer}
                  onChange={(e) => setGaslessRelayer(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="settings-toggle-row">
              <div className="settings-toggle-info">
                <div className="toggle-title">Sybil-Resistance Verification</div>
                <div className="toggle-desc">Require Gitcoin Passport score ≥ 20 or WorldID biometric proof to eliminate bot manipulation.</div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={sybilResistance}
                  onChange={(e) => setSybilResistance(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 4: Webhooks & Notifications */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon-wrap amber">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div>
              <h2 className="settings-card-title">Integration & Event Webhooks</h2>
              <p className="settings-card-subtitle">Push cryptographic election events to external notification endpoints.</p>
            </div>
          </div>

          <div className="settings-form-body">
            <div className="settings-field">
              <label className="settings-label" htmlFor="webhook-url">Event Dispatch Webhook URL</label>
              <input
                id="webhook-url"
                type="url"
                className="settings-input"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-domain.com/webhooks/truevote"
              />
              <span className="settings-help">Receives payload for: `proposal.created`, `ballot.cast`, `election.finalized`.</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsTab;
