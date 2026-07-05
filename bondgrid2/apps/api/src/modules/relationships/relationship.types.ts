import {
  CANONICAL_RELATIONSHIP_IDS,
  RELATIONSHIP_DIRECTIONS,
  RELATIONSHIP_GENDERS,
} from './relationship.constants';

export type CanonicalRelationshipId =
  (typeof CANONICAL_RELATIONSHIP_IDS)[number];

export type RelationshipDirection = (typeof RELATIONSHIP_DIRECTIONS)[number];

export type RelationshipGender = (typeof RELATIONSHIP_GENDERS)[number];

export type RelationshipValidationSeverity = 'error' | 'warning';

export interface RelationshipPerson {
  id: string;
  gender?: RelationshipGender;
}

export interface RelationshipDisplayLabels {
  default: string;
  male?: string;
  female?: string;
}

export interface DirectionalRelationshipDisplay {
  source: RelationshipDisplayLabels;
  target: RelationshipDisplayLabels;
}

export interface SymmetricRelationshipDisplay {
  label: RelationshipDisplayLabels;
}

export interface RelationshipValidationRule {
  code: string;
  message: string;
  severity: RelationshipValidationSeverity;
}

export interface RelationshipValidationMetadata {
  allowSelfRelationship: boolean;
  rules: RelationshipValidationRule[];
}

export interface RelationshipExtensibilityHooks {
  inverseCanonicalId?: CanonicalRelationshipId;
  supportsCustomLabel?: boolean;
  tags?: string[];
}

export type RelationshipSelectionGroup =
  'Family' | 'Professional' | 'Social' | 'Community' | 'Custom';

export type RelationshipSelectionPerspective = 'source' | 'target';

export interface RelationshipSelectionOption {
  id: string;
  label: string;
  group: RelationshipSelectionGroup;
  canonicalId: CanonicalRelationshipId;
  perspective: RelationshipSelectionPerspective;
  customDisplayLabel?: string;
}

interface RelationshipRegistryBase {
  id: CanonicalRelationshipId;
  label: string;
  description: string;
  directional: boolean;
  symmetric: boolean;
  filterLabel: string;
  validation: RelationshipValidationMetadata;
  hooks: RelationshipExtensibilityHooks;
}

export interface DirectionalRelationshipDefinition extends RelationshipRegistryBase {
  directional: true;
  symmetric: false;
  display: DirectionalRelationshipDisplay;
}

export interface SymmetricRelationshipDefinition extends RelationshipRegistryBase {
  directional: false;
  symmetric: true;
  display: SymmetricRelationshipDisplay;
}

export type RelationshipDefinition =
  DirectionalRelationshipDefinition | SymmetricRelationshipDefinition;

export type RelationshipRegistry = Readonly<
  Record<CanonicalRelationshipId, RelationshipDefinition>
>;

export interface StoredRelationshipReference {
  canonicalId: CanonicalRelationshipId;
  sourcePersonId: string;
  targetPersonId: string;
}

export interface RelationshipRecord {
  id: string;
  type: CanonicalRelationshipId;
  sourcePersonId: string;
  targetPersonId: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  notes?: string;
  metadata: Record<string, unknown>;
}

export interface RelationshipPersonSummary extends RelationshipPerson {
  fullName: string;
  profilePicture?: string;
  profilePictureUrl?: string;
}

export interface RelationshipView extends RelationshipRecord {
  displayLabel: string;
  filterLabel: string;
  direction: RelationshipDirection;
  sourcePerson: RelationshipPersonSummary;
  targetPerson: RelationshipPersonSummary;
  relatedPerson: RelationshipPersonSummary;
}

export interface RelationshipTypeOption {
  id: string;
  label: string;
  group?: RelationshipSelectionGroup;
  canonicalId?: CanonicalRelationshipId;
  perspective?: RelationshipSelectionPerspective;
  directional: boolean;
  symmetric: boolean;
}

export interface ResolveRelationshipDisplayInput {
  selectedPerson: RelationshipPerson;
  sourcePerson: RelationshipPerson;
  targetPerson: RelationshipPerson;
  canonicalId: CanonicalRelationshipId;
}

export interface ResolvedRelationshipDisplay {
  canonicalId: CanonicalRelationshipId;
  label: string;
  filterLabel: string;
  direction: RelationshipDirection;
  isSelectedSource: boolean;
  isSelectedTarget: boolean;
}
