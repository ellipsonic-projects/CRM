const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

import { AuditLog } from './audit.api';
import { Event } from './events.api';

export interface DashboardSummary {
  totalPeople: number;
  totalRelationships: number;
  totalEvents: number;
  totalUsers: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  recentActivity: AuditLog[];
  upcomingEvents: Event[];
}

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  error: string;
}

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export async function getDashboard(): Promise<DashboardData> {
  const response = await fetch(`${API_BASE_URL}/api/v1/dashboard`, {
    credentials: 'include',
  });

  const payload = (await response.json()) as ApiResponse<DashboardData>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'Request failed' : payload.error);
  }

  return payload.data;
}
