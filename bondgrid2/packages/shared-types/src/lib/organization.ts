import { BaseEntity } from "./common";
import { OrganizationType } from "./enums";

export interface Organization extends BaseEntity {
  name: string;

  type: OrganizationType;

  state: string;

  city?: string;
}