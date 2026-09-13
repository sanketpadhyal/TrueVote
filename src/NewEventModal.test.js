import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewEventModal } from './dashboard/NewEventModal';

describe('NewEventModal Component', () => {
  const mockOnClose = jest.fn();
  const mockOnEventCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('does not render when isOpen is false', () => {
    render(
      <NewEventModal
        isOpen={false}
        onClose={mockOnClose}
        onEventCreated={mockOnEventCreated}
      />
    );
    expect(screen.queryByText(/How many choices to vote on?/i)).not.toBeInTheDocument();
  });

  test('renders Step 1 with choice count cards and option inputs', () => {
    render(
      <NewEventModal
        isOpen={true}
        onClose={mockOnClose}
        onEventCreated={mockOnEventCreated}
      />
    );

    expect(screen.getByText(/How many choices to vote on?/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();

    const choiceCards = screen.getAllByRole('button', { name: /[2-5]\s*Choices/i });
    expect(choiceCards.length).toBe(4);

    expect(screen.getByPlaceholderText(/Name for Option 1/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Name for Option 2/i)).toBeInTheDocument();
  });

  test('selecting a different choice count dynamically adjusts input rows', () => {
    render(
      <NewEventModal
        isOpen={true}
        onClose={mockOnClose}
        onEventCreated={mockOnEventCreated}
      />
    );

    const card4 = screen.getByRole('button', { name: /4\s*Choices/i });
    fireEvent.click(card4);

    expect(screen.getByPlaceholderText(/Name for Option 3/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Name for Option 4/i)).toBeInTheDocument();
  });

  test('navigates to Step 2 when clicking Continue', () => {
    render(
      <NewEventModal
        isOpen={true}
        onClose={mockOnClose}
        onEventCreated={mockOnEventCreated}
      />
    );

    const continueBtn = screen.getByRole('button', { name: /Continue/i });
    fireEvent.click(continueBtn);

    expect(screen.getByText(/Total Votes Requested/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getAllByText(/Unlimited/i).length).toBeGreaterThan(0);
  });
});

