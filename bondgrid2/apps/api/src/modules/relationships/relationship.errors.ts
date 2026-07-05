export type RelationshipErrorCode =
  | 'INVALID_RELATIONSHIP'
  | 'MISSING_PERSON'
  | 'SELF_RELATIONSHIP'
  | 'DUPLICATE_RELATIONSHIP'
  | 'RELATIONSHIP_NOT_FOUND';

export class RelationshipServiceError extends Error {
  constructor(
    public readonly code: RelationshipErrorCode,
    message: string,
  ) {
    super(message);
  }
}
