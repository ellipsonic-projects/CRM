export const CANONICAL_RELATIONSHIP_IDS = [
  'PARENT_CHILD',
  'SPOUSE',
  'SIBLING',
  'FRIEND',
  'CLOSE_FRIEND',
  'MENTOR',
  'TEACHER',
  'COLLEAGUE',
  'NEIGHBOUR',
  'COUSIN',
  'GRANDPARENT',
  'AUNT_UNCLE',
  'CUSTOM',
] as const;

export const RELATIONSHIP_DIRECTIONS = ['OUTGOING', 'INCOMING'] as const;

export const RELATIONSHIP_GENDERS = ['male', 'female', 'other'] as const;

export const RELATIONSHIP_NODE_TYPE = 'RELATIONSHIP';

export const RELATIONSHIP_CANONICAL_PROPERTY = 'canonicalId';
