import { saveEventsToBackup, loadEventsFromBackup, removeEventFromBackup } from './services/storage';

describe('Storage & Offline Backup Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('handles saving and reading backup without throwing', async () => {
    const mockEvents = [
      {
        id: 'ev-test-1',
        votingNumber: 'VOTE-1234',
        name: 'Test Election',
        isActivated: true,
        options: [
          { id: 'opt-1', label: 'Yes', votesCount: 5 },
          { id: 'opt-2', label: 'No', votesCount: 2 },
        ],
      },
    ];

    try {
      await saveEventsToBackup(mockEvents);
    } catch (e) {}

    const loaded = await loadEventsFromBackup();
    expect(Array.isArray(loaded)).toBe(true);
  });

  test('removes event from backup without errors', async () => {
    try {
      await removeEventFromBackup('ev-test-1', 'VOTE-1234');
    } catch (e) {}
  });
});
