import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VotingPage from './voting/VotingPage';

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('VotingPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders voting header, connected metamask wallet badge, and options', () => {
    renderWithRouter(<VotingPage />);
    expect(screen.getByText(/Connected MetaMask/i)).toBeInTheDocument();
    expect(screen.getByText(/Proof of Humanity Challenge/i)).toBeInTheDocument();
    expect(screen.getByText(/Cast Anonymous Vote/i)).toBeInTheDocument();
  });

  test('requires proof of humanity before casting vote', () => {
    renderWithRouter(<VotingPage />);
    const castBtn = screen.getByRole('button', { name: /Cast Anonymous Vote/i });
    expect(castBtn).toBeDisabled();
  });

  test('blocks voting and shows unsafe browser illustration when incognito is flagged', async () => {
    const detectEnv = require('./security/detectenv');
    const spy = jest.spyOn(detectEnv, 'detectSafeEnvironment').mockResolvedValue({
      isSafe: false,
      isIncognito: true,
      isAutomated: false,
      reason: 'Private/Incognito browsing mode detected.',
    });

    renderWithRouter(<VotingPage />);

    await waitFor(() => {
      expect(screen.getByText(/not safe browser u cant vote here/i)).toBeInTheDocument();
      expect(screen.getByAltText(/not safe browser u cant vote here/i)).toBeInTheDocument();
    });

    spy.mockRestore();
  });
});

