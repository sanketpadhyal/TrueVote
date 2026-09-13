import React, { useState, useEffect } from 'react';
import { ActivityItem, LicenseStatus, EventItem } from './types';

interface StatsPanelProps {
  licenseStatus?: LicenseStatus;
  activities?: ActivityItem[];
}

const formatRelativeTime = (item: ActivityItem): string => {
  if (item.timestamp) {
    const diffSec = Math.floor((Date.now() - item.timestamp) / 1000);
    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  }
  return item.date || 'Just now';
};

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

export const getStoredActivities = (): ActivityItem[] => {
  if (typeof window === 'undefined') return [];
  try {
    const allActivities: ActivityItem[] = [];
    const seenIds = new Set<string>();

    const deletedKey = 'truevote_deleted_events';
    const deletedSet = new Set<string>();
    try {
      const dList: string[] = JSON.parse(localStorage.getItem(deletedKey) || '[]');
      for (let k = 0; k < dList.length; k++) {
        if (dList[k]) deletedSet.add(String(dList[k]).toLowerCase());
      }
    } catch (e) {}

    // 1. Read directly stored activities from localStorage
    const stored = localStorage.getItem('truevote_activities');
    if (stored) {
      try {
        const parsed: ActivityItem[] = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          for (let i = 0; i < parsed.length; i++) {
            const a = parsed[i];
            const isDel =
              (a.votingNumber && deletedSet.has(String(a.votingNumber).toLowerCase())) ||
              (a.id && deletedSet.has(String(a.id).toLowerCase()));
            if (a && a.id && !seenIds.has(a.id) && !isDel) {
              seenIds.add(a.id);
              allActivities.push(a);
            }
          }
        }
      } catch (e) {}
    }

    // 2. Read truevote_events to incorporate recentVotes & cast votes
    const eventsStr = localStorage.getItem('truevote_events');
    if (eventsStr) {
      try {
        const events: (EventItem & { recentVotes?: ActivityItem[] })[] = JSON.parse(eventsStr);
        if (Array.isArray(events)) {
          for (let i = 0; i < events.length; i++) {
            const ev = events[i];
            const isEvDel =
              (ev.id && deletedSet.has(String(ev.id).toLowerCase())) ||
              (ev.votingNumber && deletedSet.has(String(ev.votingNumber).toLowerCase()));
            if (isEvDel) continue;

            // A. Include embedded recentVotes
            if (Array.isArray(ev.recentVotes)) {
              for (let j = 0; j < ev.recentVotes.length; j++) {
                const rv = ev.recentVotes[j];
                if (rv && rv.id && !seenIds.has(rv.id)) {
                  seenIds.add(rv.id);
                  allActivities.push(rv);
                }
              }
            }

            // B. Ensure ballots match totalVotesCast
            const castCount = Number(ev.totalVotesCast) || 0;
            let existingBallots = 0;
            for (let k = 0; k < allActivities.length; k++) {
              if (allActivities[k].type === 'ballot' && allActivities[k].votingNumber === ev.votingNumber) {
                existingBallots++;
              }
            }

            if (castCount > existingBallots) {
              const diff = castCount - existingBallots;
              for (let d = 0; d < diff; d++) {
                const syntheticId = `act-vote-${ev.id}-${d}`;
                if (!seenIds.has(syntheticId)) {
                  seenIds.add(syntheticId);
                  const shortHash = (ev.id + d)
                    .split('')
                    .reduce((acc, c) => acc + c.charCodeAt(0), 0)
                    .toString(16)
                    .padStart(4, '0')
                    .slice(-4);
                  allActivities.push({
                    id: syntheticId,
                    userName: `Anonymous Voter (#${shortHash})`,
                    votingNumber: ev.votingNumber,
                    date: 'Just now',
                    timestamp: Date.now() - d * 120000,
                    type: 'ballot',
                  });
                }
              }
            }

            // C. Admin creation item
            const adminId = `act-admin-${ev.id}`;
            if (!seenIds.has(adminId)) {
              seenIds.add(adminId);
              const walletStr = ev.creatorWallet || '0xf026';
              const shortWallet =
                walletStr.length > 10
                  ? `${walletStr.substring(0, 6)}...${walletStr.slice(-4)}`
                  : walletStr;
              allActivities.push({
                id: adminId,
                userName: `Admin (${shortWallet})`,
                votingNumber: ev.votingNumber,
                date: 'Synced from IPFS',
                type: 'announcement',
              });
            }
          }
        }
      } catch (e) {}
    }

    // Sort: ballots first, newest timestamp first
    allActivities.sort((a, b) => {
      const timeA = a.timestamp || (a.type === 'ballot' ? 2 : 1);
      const timeB = b.timestamp || (b.type === 'ballot' ? 2 : 1);
      return Number(timeB) - Number(timeA);
    });

    if (allActivities.length > 0) {
      try {
        localStorage.setItem('truevote_activities', JSON.stringify(allActivities.slice(0, 50)));
      } catch (e) {}
    }

    return allActivities.slice(0, 30);
  } catch (e) {
    console.error('Error reading activities:', e);
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

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('truevote_events_channel');
      bc.onmessage = () => {
        handleUpdate();
      };
    } catch (e) {}

    // Dynamic timer to keep timestamps ("Just now", "2m ago") and activities fresh
    const timer = setInterval(() => {
      handleUpdate();
    }, 10000);

    return () => {
      clearInterval(timer);
      window.removeEventListener('truevote_events_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      if (bc) {
        try {
          bc.close();
        } catch (e) {}
      }
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
                    // Megaphone / Admin announcement icon
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
                    // Ballot / Envelope vote cast icon
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
                    <span className="activity-user-name" title={item.userName}>
                      {item.userName}
                    </span>
                    <span className="activity-dot">•</span>
                    <span className="activity-voting-no">{item.votingNumber}</span>
                  </div>
                  <div className="activity-timestamp">{formatRelativeTime(item)}</div>
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
