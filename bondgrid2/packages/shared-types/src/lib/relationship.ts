import { BaseEntity } from "./common";

export interface Relationship extends BaseEntity {
  fromPersonId: string;

  toPersonId: string;

  relationshipType: string;
}