import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from './pages/dashboard';

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Dashboard Component', () => {
  test('renders dashboard titles and hero banner', () => {
    renderWithRouter(<Dashboard />);
    expect(screen.getByRole('heading', { level: 1, name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.queryByText(/Hi Agnes!/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Check how voting is carried out in your organization/i)).toBeInTheDocument();
    expect(screen.getByText(/Current license status/i)).toBeInTheDocument();
    expect(screen.getByText(/the votes used/i)).toBeInTheDocument();
    expect(screen.getByText(/voting activity/i)).toBeInTheDocument();
  });

  test('renders action buttons, events table, and log out button', () => {
    renderWithRouter(<Dashboard />);
    expect(screen.getByText(/new event/i)).toBeInTheDocument();
    expect(screen.queryByText(/new participant/i)).not.toBeInTheDocument();
    expect(screen.getByTitle(/TrueVote/i)).toBeInTheDocument();
    expect(screen.getByText(/No Voting Events Created Yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log out/i })).toBeInTheDocument();
  });
});
