import React from 'react';
import { ActivityItem, LicenseStatus } from './types';

interface StatsPanelProps {
  licenseStatus?: LicenseStatus;
  activities?: ActivityItem[];
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: '1',
    userName: 'Paul Krzciuk',
    votingNumber: 'Voting no 1',
    date: '01 mar 2021 10:00',
    type: 'announcement',
  },
  {
    id: '2',
    userName: 'Mat Streszewski',
    votingNumber: 'Voting no 1',
    date: '01 mar 2021 10:01',
    type: 'ballot',
  },
  {
    id: '3',
    userName: 'Jacob Krzciuk',
    votingNumber: 'Voting no 1',
    date: '01 mar 2021 10:30',
    type: 'announcement',
  },
  {
    id: '4',
    userName: 'Magda Sadlik',
    votingNumber: 'Voting no 1',
    date: '01 mar 2021 11:03',
    type: 'ballot',
  },
  {
    id: '5',
    userName: 'Nicole Knapik',
    votingNumber: 'Voting no 1',
    date: '01 mar 2021 11:20',
    type: 'announcement',
  },
  {
    id: '6',
    userName: 'Andrew Sadlik',
    votingNumber: 'Voting no 1',
    date: '01 mar 2021 15:01',
    type: 'ballot',
  },
  {
    id: '7',
    userName: 'Christopher Serwatka',
    votingNumber: 'Voting no 2',
    date: '02 mar 2021 09:07',
    type: 'announcement',
  },
  {
    id: '8',
    userName: 'Paul Krzciuk',
    votingNumber: 'Voting no 2',
    date: '02 mar 2021 11:14',
    type: 'ballot',
  },
  {
    id: '9',
    userName: 'Agnes Krzciuk',
    votingNumber: 'Voting no 2',
    date: '02 mar 2021 19:09',
    type: 'announcement',
  },
];

export const StatsPanel: React.FC<StatsPanelProps> = ({
  licenseStatus = { usedVotes: 220, totalVotes: 500 },
  activities = DEFAULT_ACTIVITIES,
}) => {
  return (
    <aside className="wyborek-stats-panel">
      {/* License Status Widget */}
      <div className="license-status-section">
        <h3 className="stats-section-title">Current license status</h3>
        <div className="license-card">
          <div className="license-stat-number">
            <span className="stat-highlight">{licenseStatus.usedVotes}</span>
            <span className="stat-total"> out of {licenseStatus.totalVotes}</span>
          </div>
          <div className="license-stat-label">the votes used</div>
        </div>
      </div>

      {/* Voting Activity Feed */}
      <div className="voting-activity-section">
        <h3 className="stats-section-title">voting activity</h3>
        <div className="activity-list">
          {activities.map((item) => (
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
          ))}
        </div>
      </div>
    </aside>
  );
};

export default StatsPanel;
