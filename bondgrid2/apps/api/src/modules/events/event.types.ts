export type EventStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
export type StoredEventStatus = 'Cancelled';
export type EventCategory =
  | 'Religious'
  | 'Social'
  | 'Community'
  | 'Educational'
  | 'Meeting'
  | 'Personal'
  | 'Other';

export interface Event {
  id: string;
  title: string;
  description?: string;
  category?: EventCategory;
  startDateTime: string;
  endDateTime?: string;
  location?: string;
  status: EventStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  organizationId: string;
}

export interface EventNode extends Omit<Event, 'status'> {
  status?: StoredEventStatus;
}

export interface PaginatedEvents {
  events: Event[];
  page: number;
  limit: number;
  total: number;
}
