export interface QueueUser {
  id: number;
  telegramId: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  isAdmin: boolean;
}

export interface QueueEntry {
  id: number;
  position: number;
  microwaveId: number;
  status: "WAITING" | "ACTIVE" | "COMPLETED" | "LEFT";
  joinedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  user: QueueUser;
}

export interface SwapRequest {
  id: number;
  message: string;
  status: "PENDING" | "APPROVED" | "ACCEPTED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  queueEntry: QueueEntry;
  approvedByQueueEntry: QueueEntry | null;
}

export interface QueueState {
  queue: QueueEntry[];
  queueOpen: boolean;
  queueCloseTime: string;
  now: string;
  myEntry: QueueEntry | null;
  swapRequests: SwapRequest[];
  mySwapRequests: SwapRequest[];
  requestsToApprove: SwapRequest[];
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

export interface AuthResponse {
  token: string;
  user: QueueUser;
}

export interface PaginatedLogs {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}
