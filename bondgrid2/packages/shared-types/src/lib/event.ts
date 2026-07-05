import { BaseEntity } from "./common";

export interface Event extends BaseEntity {
  title: string;

  description?: string;

  startDate: string;

  endDate?: string;
}