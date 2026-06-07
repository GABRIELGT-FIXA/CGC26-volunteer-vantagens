export type Role = 'ADMIN' | 'PARTICIPANT';
export type ParticipationStatus = 'PENDING' | 'CHECKED_IN' | 'COMPLETED' | 'INCOMPLETE';
export type CampaignStatus = 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';

export interface Team {
  id: string;
  name: string;
  createdAt: string;
  members?: UserTeam[];
}

export interface UserTeam {
  id: string;
  userId: string;
  teamId: string;
  team: Team;
  user?: User;
}

export interface User {
  id: string;
  fullName: string;
  age: number;
  phone: string;
  profilePhoto: string | null;
  role: Role;
  createdAt: string;
  teams: UserTeam[];
  participations?: Participation[];
}

export interface Task {
  id: string;
  name: string;
  description: string | null;
  points: number;
  startTime: string;
  endTime: string;
  windowMinutes: number;
  checkOutOffsetMinutes: number;
  createdAt: string;
}

export interface WindowStatus {
  task: Task;
  checkInOpen: boolean;
  checkOutOpen: boolean;
}

export interface Participation {
  id: string;
  userId: string;
  taskId: string;
  teamId: string;
  checkInPhoto: string | null;
  checkInTime: string | null;
  checkInValid: boolean;
  checkOutPhoto: string | null;
  checkOutTime: string | null;
  checkOutValid: boolean;
  status: ParticipationStatus;
  pointsAwarded: number;
  createdAt: string;
  task: Task;
  team: Pick<Team, 'id' | 'name'>;
  user?: Pick<User, 'id' | 'fullName' | 'profilePhoto'>;
}

export interface RankingEntry {
  position: number;
  user?: Pick<User, 'id' | 'fullName' | 'profilePhoto' | 'teams'>;
  totalPoints: number;
}

export interface TeamRankingEntry {
  position: number;
  team?: Team & { members: UserTeam[] };
  totalPoints: number;
}

export interface News {
  id: string;
  title: string;
  description: string;
  image: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: Pick<User, 'id' | 'fullName'>;
}

export interface Campaign {
  id: string;
  name: string;
  message: string;
  scheduledAt: string;
  status: CampaignStatus;
  sentAt: string | null;
  recipientCount: number | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy: Pick<User, 'id' | 'fullName'>;
}
