import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('TrueVote Application', () => {
  test('renders TrueVote branding and hero title', () => {
    render(<App />);
    const brandElements = screen.getAllByText(/True/i);
    expect(brandElements.length).toBeGreaterThan(0);

    const headingElement = screen.getByText(/Turn Web3 Voting/i);
    expect(headingElement).toBeInTheDocument();
  });

  test('renders hero Get Started action button', () => {
    render(<App />);
    const getStartedButtons = screen.getAllByText(/Get Started/i);
    expect(getStartedButtons.length).toBeGreaterThan(0);
  });

  test('renders core navigation links', () => {
    render(<App />);
    const featuresLinks = screen.getAllByText(/Features/i);
    expect(featuresLinks.length).toBeGreaterThan(0);

    const faqLinks = screen.getAllByText(/FAQ/i);
    expect(faqLinks.length).toBeGreaterThan(0);

    const teamLinks = screen.getAllByText(/About Team/i);
    expect(teamLinks.length).toBeGreaterThan(0);
  });
});
