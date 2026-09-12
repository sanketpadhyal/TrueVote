export interface EventItem {
  id: string;
  name: string;
  votingNumber: string;
  activationType: 'automatic' | 'manual';
  startDate?: string;
  startTime?: string;
  endDate?: string;
  endTime?: string;
  isActivated?: boolean;
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
  totalVotes: number;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  active?: boolean;
}
