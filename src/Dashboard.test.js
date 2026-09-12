import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './pages/dashboard';

describe('Dashboard Component', () => {
  test('renders dashboard titles, hero banner, and user greeting', () => {
    render(<Dashboard />);
    expect(screen.getByRole('heading', { level: 1, name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByText(/Hi Agnes!/i)).toBeInTheDocument();
    expect(screen.getByText(/Current license status/i)).toBeInTheDocument();
    expect(screen.getByText(/220/i)).toBeInTheDocument();
    expect(screen.getByText(/voting activity/i)).toBeInTheDocument();
  });

  test('renders action buttons and events table', () => {
    render(<Dashboard />);
    expect(screen.getByText(/new event/i)).toBeInTheDocument();
    expect(screen.getByText(/new participant/i)).toBeInTheDocument();
    expect(screen.getByText(/XI Meeting of the Community Krakow - Podgórze/i)).toBeInTheDocument();
    expect(screen.getByText(/Voting for the mayor of Chrzanów/i)).toBeInTheDocument();
  });
});
