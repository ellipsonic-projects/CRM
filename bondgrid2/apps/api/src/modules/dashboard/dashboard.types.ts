import { AuditLog } from '../audit';
import { Event } from '../events';

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
