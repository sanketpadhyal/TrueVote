import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatsPanel } from './dashboard/StatsPanel';

describe('StatsPanel Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders license status title and votes used count', () => {
    localStorage.setItem('truevote_votes_used', '42');
    render(<StatsPanel />);

    expect(screen.getByText(/Current license status/i)).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText(/the votes used/i)).toBeInTheDocument();
  });

  test('renders voting activity section with anonymous voter items', () => {
    const mockActivities = [
      {
        id: 'act-1',
        userName: 'Anonymous Voter (#04eb)',
        votingNumber: 'VOTE-7738',
        date: 'Just now',
        type: 'ballot',
      },
      {
        id: 'act-2',
        userName: 'Admin (0xf026...5b0c)',
        votingNumber: 'VOTE-7738',
        date: 'Synced from IPFS',
        type: 'announcement',
      },
    ];

    render(<StatsPanel activities={mockActivities} />);

    expect(screen.getByText(/voting activity/i)).toBeInTheDocument();
    expect(screen.getByText(/Anonymous Voter \(#04eb\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin \(0xf026...5b0c\)/i)).toBeInTheDocument();
  });

  test('shows empty activity state when no items exist', () => {
    render(<StatsPanel activities={[]} />);

    expect(screen.getByText(/No Activity Recorded/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Live voting transactions and ballot casts will appear here in real time/i)
    ).toBeInTheDocument();
  });
});
