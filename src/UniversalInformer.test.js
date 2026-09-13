import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import UniversalInformer, {
  inform,
  informSuccess,
  informError,
  informWarning,
  informInfo,
} from './components/universal-informer';

describe('UniversalInformer Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  test('renders container and mounts global dispatchers on window', () => {
    render(<UniversalInformer />);
    expect(window.inform).toBeDefined();
    expect(window.informSuccess).toBeDefined();
    expect(window.informError).toBeDefined();
    expect(window.informWarning).toBeDefined();
    expect(window.informInfo).toBeDefined();
  });

  test('displays success toast notification on informSuccess', () => {
    render(<UniversalInformer />);

    act(() => {
      informSuccess('Event published successfully!', 'Published');
    });

    expect(screen.getByText('Event published successfully!')).toBeInTheDocument();
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  test('displays error toast notification on informError', () => {
    render(<UniversalInformer />);

    act(() => {
      informError('Network connection failed', 'Sync Error');
    });

    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    expect(screen.getByText('Sync Error')).toBeInTheDocument();
  });

  test('displays warning and info toast notifications', () => {
    render(<UniversalInformer />);

    act(() => {
      informWarning('Voter quota approaching limit', 'Quota Warning');
      informInfo('New ballot cast by voter', 'Live Ballot');
    });

    expect(screen.getByText('Voter quota approaching limit')).toBeInTheDocument();
    expect(screen.getByText('New ballot cast by voter')).toBeInTheDocument();
  });

  test('dismisses toast on close button click', () => {
    render(<UniversalInformer />);

    act(() => {
      inform('Dismissable notification', 'info', { duration: 0 });
    });

    expect(screen.getByText('Dismissable notification')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /Dismiss notification/i });
    act(() => {
      fireEvent.click(closeBtn);
    });

    // Fast-forward exit animation (300ms)
    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(screen.queryByText('Dismissable notification')).not.toBeInTheDocument();
  });

  test('auto-dismisses after duration expires', () => {
    render(<UniversalInformer />);

    act(() => {
      inform('Auto disappearing toast', 'info', { duration: 3000 });
    });

    expect(screen.getByText('Auto disappearing toast')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Exit animation time
    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(screen.queryByText('Auto disappearing toast')).not.toBeInTheDocument();
  });
});
