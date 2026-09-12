import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VotingPage from './voting/VotingPage';

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('VotingPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders voting header, zero-knowledge privacy badge, and options', () => {
    renderWithRouter(<VotingPage />);
    expect(screen.getByText(/Zero-Knowledge Privacy Active/i)).toBeInTheDocument();
    expect(screen.getByText(/Proof of Humanity Challenge/i)).toBeInTheDocument();
    expect(screen.getByText(/Cast Anonymous Vote/i)).toBeInTheDocument();
  });

  test('requires proof of humanity before casting vote', () => {
    renderWithRouter(<VotingPage />);
    const castBtn = screen.getByRole('button', { name: /Cast Anonymous Vote/i });
    expect(castBtn).toBeDisabled();
  });
});
