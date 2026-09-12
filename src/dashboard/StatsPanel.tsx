import React, { useState, useEffect } from 'react';
import { ActivityItem, LicenseStatus, EventItem } from './types';

interface StatsPanelProps {
  licenseStatus?: LicenseStatus;
  activities?: ActivityItem[];
}

const getStoredVotesUsed = (): number => {
  if (typeof window === 'undefined') return 0;
  try {
    const stored = localStorage.getItem('truevote_votes_used');
    if (stored !== null) {
      const num = Number(stored);
      if (!isNaN(num) && num > 0) return num;
    }
    const licenseStored = localStorage.getItem('truevote_license_status');
    if (licenseStored) {
      const parsed = JSON.parse(licenseStored);
      if (typeof parsed.usedVotes === 'number' && parsed.usedVotes > 0) return parsed.usedVotes;
    }
    // Check total votes cast across all stored events
    const eventsStr = localStorage.getItem('truevote_events');
    if (eventsStr) {
      const parsed: EventItem[] = JSON.parse(eventsStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.reduce((sum, e) => sum + (e.totalVotesCast || 0), 0);
      }
    }
  } catch (e) {
    console.error('Error reading votes used:', e);
  }
  return 0;
};

const getStoredActivities = (): ActivityItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('truevote_activities');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // Synthesize activity feed from stored events if activities were cleared
    const eventsStr = localStorage.getItem('truevote_events');
    if (eventsStr) {
      const parsed: EventItem[] = JSON.parse(eventsStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 5).map((e) => ({
          id: `act-${e.id}`,
          userName: `Admin (${(e.creatorWallet || 'Web3').substring(0, 6)}...${(e.creatorWallet || 'wallet').slice(-4)})`,
          votingNumber: e.votingNumber,
          date: 'Synced from IPFS',
          type: 'announcement',
        }));
      }
    }
  } catch (e) {
    console.error('Error reading truevote_activities:', e);
  }
  return [];
};

export const StatsPanel: React.FC<StatsPanelProps> = ({
  licenseStatus,
  activities,
}) => {
  const [votesUsed, setVotesUsed] = useState<number>(() => licenseStatus?.usedVotes ?? getStoredVotesUsed());
  const [currentActivities, setCurrentActivities] = useState<ActivityItem[]>(() =>
    activities !== undefined ? activities : getStoredActivities()
  );

  useEffect(() => {
    const handleUpdate = () => {
      setVotesUsed(licenseStatus?.usedVotes ?? getStoredVotesUsed());
      setCurrentActivities(activities !== undefined ? activities : getStoredActivities());
    };

    window.addEventListener('truevote_events_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('truevote_events_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [licenseStatus, activities]);

  return (
    <aside className="wyborek-stats-panel">
      {/* License Status Widget */}
      <div className="license-status-section">
        <h3 className="stats-section-title">Current license status</h3>
        <div className="license-card">
          <div className="license-stat-number">
            <span className="stat-highlight">{votesUsed}</span>
          </div>
          <div className="license-stat-label">the votes used</div>
        </div>
      </div>

      {/* Voting Activity Feed */}
      <div className="voting-activity-section">
        <h3 className="stats-section-title">voting activity</h3>
        <div className="activity-list">
          {currentActivities.length > 0 ? (
            currentActivities.map((item) => (
              <div key={item.id} className="activity-item">
                <div className="activity-icon-container">
                  {item.type === 'announcement' ? (
                    // Megaphone icon
                    <svg
                      className="activity-icon megaphone"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1e3a8a"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 11l19-9-9 19-2-8-8-2z" />
                    </svg>
                  ) : (
                    // Ballot / Envelope icon
                    <svg
                      className="activity-icon ballot"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#1e3a8a"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  )}
                </div>
                <div className="activity-details">
                  <div className="activity-user-row">
                    <span className="activity-user-name">{item.userName}</span>
                    <span className="activity-dot">•</span>
                    <span className="activity-voting-no">{item.votingNumber}</span>
                  </div>
                  <div className="activity-timestamp">{item.date}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="activity-empty-state">
              <div className="activity-empty-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div className="activity-empty-title">No Activity Recorded</div>
              <div className="activity-empty-subtitle">Live voting transactions and ballot casts will appear here in real time.</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default StatsPanel;
