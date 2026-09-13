import { mergeEventVersions } from './services/pinata';

describe('Pinata IPFS Multi-Version Concurrency Merge', () => {
  test('returns null when versions array is empty or undefined', () => {
    expect(mergeEventVersions([])).toBeNull();
    expect(mergeEventVersions(null as any)).toBeNull();
  });

  test('returns the original event when only one version exists', () => {
    const singleEvent = {
      id: 'ev-1',
      votingNumber: 'VOTE-7738',
      name: 'Governance Proposal',
      totalVotesCast: 1,
      options: [
        { id: 'opt-1', label: 'Approve', votesCount: 1 },
        { id: 'opt-2', label: 'Reject', votesCount: 0 },
      ],
      recentVotes: [
        {
          id: 'act-1',
          userName: 'Anonymous Voter (#04eb)',
          receiptHash: '0xabc123',
          selectedOptionId: 'opt-1',
          optionLabel: 'Approve',
          timestamp: 1000,
        },
      ],
    };

    const result = mergeEventVersions([singleEvent]);
    expect(result).toEqual(singleEvent);
  });

  test('merges concurrent votes from two devices without dropping votes', () => {
    // Device A votes for Approve
    const versionA = {
      id: 'ev-1',
      votingNumber: 'VOTE-7738',
      name: 'Governance Proposal',
      totalVotesCast: 1,
      pinnedAt: '2026-09-13T10:00:00.000Z',
      options: [
        { id: 'opt-1', label: 'Approve', votesCount: 1 },
        { id: 'opt-2', label: 'Reject', votesCount: 0 },
      ],
      recentVotes: [
        {
          id: 'act-A',
          userName: 'Anonymous Voter (#04eb)',
          receiptHash: '0x04eb0001',
          selectedOptionId: 'opt-1',
          optionLabel: 'Approve',
          timestamp: 1000,
        },
      ],
    };

    // Device B votes for Reject at the same time
    const versionB = {
      id: 'ev-1',
      votingNumber: 'VOTE-7738',
      name: 'Governance Proposal',
      totalVotesCast: 1,
      pinnedAt: '2026-09-13T10:00:01.000Z',
      options: [
        { id: 'opt-1', label: 'Approve', votesCount: 0 },
        { id: 'opt-2', label: 'Reject', votesCount: 1 },
      ],
      recentVotes: [
        {
          id: 'act-B',
          userName: 'Anonymous Voter (#f607)',
          receiptHash: '0xf6070002',
          selectedOptionId: 'opt-2',
          optionLabel: 'Reject',
          timestamp: 1001,
        },
      ],
    };

    const merged = mergeEventVersions([versionA, versionB]);

    // Both ballots should be preserved
    expect(merged.recentVotes.length).toBe(2);
    expect(merged.totalVotesCast).toBe(2);

    // Both options should have 1 vote
    const optApprove = merged.options.find((o: any) => o.id === 'opt-1');
    const optReject = merged.options.find((o: any) => o.id === 'opt-2');
    expect(optApprove.votesCount).toBe(1);
    expect(optReject.votesCount).toBe(1);
  });

  test('deduplicates identical ballot receipts across IPFS versions', () => {
    const ballot1 = {
      id: 'act-1',
      userName: 'Anonymous Voter (#04eb)',
      receiptHash: '0x04eb0001',
      selectedOptionId: 'opt-1',
      optionLabel: 'Approve',
      timestamp: 1000,
    };

    const version1 = {
      id: 'ev-1',
      votingNumber: 'VOTE-7738',
      totalVotesCast: 1,
      options: [{ id: 'opt-1', label: 'Approve', votesCount: 1 }],
      recentVotes: [ballot1],
    };

    const version2 = {
      id: 'ev-1',
      votingNumber: 'VOTE-7738',
      totalVotesCast: 1,
      options: [{ id: 'opt-1', label: 'Approve', votesCount: 1 }],
      recentVotes: [ballot1], // duplicate
    };

    const merged = mergeEventVersions([version1, version2]);
    expect(merged.recentVotes.length).toBe(1);
    expect(merged.totalVotesCast).toBe(1);
    expect(merged.options[0].votesCount).toBe(1);
  });
});
