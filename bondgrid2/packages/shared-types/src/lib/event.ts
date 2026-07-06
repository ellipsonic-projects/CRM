import { BaseEntity } from './common';

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

export interface Event extends BaseEntity {
  title: string;

  description?: string;

  category?: EventCategory;

  startDateTime: string;

  endDateTime?: string;

  location?: string;

  status: EventStatus;

  notes?: string;

  createdBy: string;

  organizationId: string;
}
