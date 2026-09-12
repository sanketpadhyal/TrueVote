export interface BallotOption {
  id: string;
  label: string;
  description?: string;
  votesCount: number;
}

export interface EventItem {
  id: string;
  name: string;
  bio?: string;
  votingNumber: string;
  optionsCount: number;
  options: BallotOption[];
  totalAllowedVotes: number | 'unlimited';
  totalVotesCast?: number;
  activationType: 'automatic' | 'manual';
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  isActivated?: boolean;
  createdAt: string;
  timezone?: string;
  ipfsHash?: string;
  ipfsUrl?: string;
  ipfsFileId?: string;
  shareableLink?: string;
}

export interface ActivityItem {
  id: string;
  userName: string;
  votingNumber: string;
  date: string;
  type: 'announcement' | 'ballot';
}

export interface LicenseStatus {
  usedVotes: number;
  totalVotes?: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}
