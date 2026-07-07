export interface TelegramInitData {
  query_id: string;
  user?: {
    id: number;
    is_bot?: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    photo_url?: string;
    is_premium?: boolean;
  };
  chat_instance?: string;
  chat_type?: string;
  start_param?: string;
  auth_date: number;
  hash: string;
}

export interface QueueUser {
  id: number;
  telegramId: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  isAdmin: boolean;
}

export interface QueueState {
  id: number;
  position: number;
  microwaveId: number;
  status: "WAITING" | "ACTIVE" | "COMPLETED" | "LEFT";
  joinedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  swapMessage: string | null;
  user: QueueUser;
}

export interface TodayQueueResponse {
  queue: QueueState[];
  queueOpen: boolean;
  queueCloseTime: string;
  now: string;
}

export interface AdminDashboard {
  todayStats: {
    totalUsers: number;
    activeQueue: number;
    completed: number;
    avgWaitMinutes: number;
    queueLength: number;
    peakUsageTime: string | null;
  };
  swapStats: {
    totalOffers: number;
    accepted: number;
    rejected: number;
    pending: number;
  };
  recentLogs: AuditLogEntry[];
  mostActiveUsers: { user: QueueUser; count: number }[];
}

export interface AuditLogEntry {
  id: number;
  action: string;
  details: any;
  createdAt: string;
  user: QueueUser | null;
}

export interface JwtPayload {
  userId: number;
  telegramId: number;
}

export interface AuthRequest extends Express.Request {
  user?: JwtPayload;
}
