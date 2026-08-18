import { BaseEntity } from "./common";
import { Gender } from "./enums";

export interface Person extends BaseEntity {
  personId?: string;

  fullName: string;

  phone?: string;

  email?: string;

  gender: Gender;

  occupation?: string;

  state: string;

  city?: string;

  area?: string;

  notes?: string;

  profilePicture?: string;

  hasLogin: boolean;
}