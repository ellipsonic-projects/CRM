import { DashboardRepository } from './dashboard.repository';
import { DashboardData } from './dashboard.types';

export class DashboardService {
  constructor(private readonly repository = new DashboardRepository()) {}

  async getDashboard(organizationId: string): Promise<DashboardData> {
    const [summary, recentActivity, upcomingEvents] = await Promise.all([
      this.repository.getSummary(organizationId),
      this.repository.getRecentActivity(organizationId),
      this.repository.getUpcomingEvents(organizationId),
    ]);

    return {
      summary,
      recentActivity,
      upcomingEvents,
    };
  }
}
