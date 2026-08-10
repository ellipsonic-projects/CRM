import {
  CanonicalRelationshipId,
  RelationshipDefinition,
  RelationshipDisplayLabels,
  RelationshipRegistry,
  RelationshipSelectionOption,
} from './relationship.types';

const defaultValidation = {
  allowSelfRelationship: false,
  rules: [
    {
      code: 'NO_SELF_RELATIONSHIP',
      message: 'A person cannot be related to themselves.',
      severity: 'error' as const,
    },
  ],
};

const noCustomLabel = {
  supportsCustomLabel: false,
};

const labels = (
  defaultLabel: string,
  gendered?: Pick<RelationshipDisplayLabels, 'male' | 'female'>,
): RelationshipDisplayLabels => ({
  default: defaultLabel,
  ...gendered,
});

export const relationshipRegistry = {
  PARENT_CHILD: {
    id: 'PARENT_CHILD',
    label: 'Parent / Child',
    description: 'A directional relationship from parent to child.',
    directional: true,
    symmetric: false,
    filterLabel: 'Parent / Child',
    display: {
      source: labels('Parent', {
        male: 'Father',
        female: 'Mother',
      }),
      target: labels('Child', {
        male: 'Son',
        female: 'Daughter',
      }),
    },
    validation: defaultValidation,
    hooks: noCustomLabel,
  },
  SPOUSE: {
    id: 'SPOUSE',
    label: 'Spouse',
    description: 'A symmetric marital relationship.',
    directional: false,
    symmetric: true,
    filterLabel: 'Spouse',
    display: {
      label: labels('Spouse', {
        male: 'Husband',
        female: 'Wife',
      }),
    },
    validation: defaultValidation,
    hooks: noCustomLabel,
  },
  SIBLING: {
    id: 'SIBLING',
    label: 'Sibling',
    description: 'A symmetric sibling relationship.',
    directional: false,
    symmetric: true,
    filterLabel: 'Sibling',
    display: {
      label: labels('Sibling', {
        male: 'Brother',
        female: 'Sister',
      }),
    },
    validation: defaultValidation,
    hooks: noCustomLabel,
  },
  FRIEND: {
    id: 'FRIEND',
    label: 'Friend',
    description: 'A symmetric friendship relationship.',
    directional: false,
    symmetric: true,
    filterLabel: 'Friend',
    display: {
      label: labels('Friend'),
    },
    validation: defaultValidation,
    hooks: {
      supportsCustomLabel: true,
    },
  },
  CLOSE_FRIEND: {
    id: 'CLOSE_FRIEND',
    label: 'Close Friend',
    description: 'A symmetric close friendship relationship.',
    directional: false,
    symmetric: true,
    filterLabel: 'Close Friend',
    display: {
      label: labels('Close Friend'),
    },
    validation: defaultValidation,
    hooks: {
      supportsCustomLabel: true,
    },
  },
  MENTOR: {
    id: 'MENTOR',
    label: 'Mentor',
    description: 'A directional relationship from mentor to mentee.',
    directional: true,
    symmetric: false,
    filterLabel: 'Mentor',
    display: {
      source: labels('Mentor'),
      target: labels('Mentee'),
    },
    validation: defaultValidation,
    hooks: noCustomLabel,
  },
  TEACHER: {
    id: 'TEACHER',
    label: 'Teacher',
    description: 'A directional relationship from teacher to student.',
    directional: true,
    symmetric: false,
    filterLabel: 'Teacher',
    display: {
      source: labels('Teacher'),
      target: labels('Student'),
    },
    validation: defaultValidation,
    hooks: noCustomLabel,
  },
  COLLEAGUE: {
    id: 'COLLEAGUE',
    label: 'Colleague',
    description: 'A symmetric professional relationship.',
    directional: false,
    symmetric: true,
    filterLabel: 'Colleague',
    display: {
      label: labels('Colleague'),
    },
    validation: defaultValidation,
    hooks: {
      supportsCustomLabel: true,
    },
  },
  NEIGHBOUR: {
    id: 'NEIGHBOUR',
    label: 'Neighbour',
    description: 'A symmetric neighbour relationship.',
    directional: false,
    symmetric: true,
    filterLabel: 'Neighbour',
    display: {
      label: labels('Neighbour'),
    },
    validation: defaultValidation,
    hooks: {
      supportsCustomLabel: true,
    },
  },
  COUSIN: {
    id: 'COUSIN',
    label: 'Cousin',
    description: 'A symmetric cousin relationship.',
    directional: false,
    symmetric: true,
    filterLabel: 'Cousin',
    display: {
      label: labels('Cousin'),
    },
    validation: defaultValidation,
    hooks: noCustomLabel,
  },
  GRANDPARENT: {
    id: 'GRANDPARENT',
    label: 'Grandparent / Grandchild',
    description: 'A directional relationship from grandparent to grandchild.',
    directional: true,
    symmetric: false,
    filterLabel: 'Grandparent / Grandchild',
    display: {
      source: labels('Grandparent', {
        male: 'Grandfather',
        female: 'Grandmother',
      }),
      target: labels('Grandchild', {
        male: 'Grandson',
        female: 'Granddaughter',
      }),
    },
    validation: defaultValidation,
    hooks: noCustomLabel,
  },
  AUNT_UNCLE: {
    id: 'AUNT_UNCLE',
    label: 'Aunt / Uncle',
    description: 'A directional relationship from aunt or uncle to nibling.',
    directional: true,
    symmetric: false,
    filterLabel: 'Aunt / Uncle',
    display: {
      source: labels('Aunt / Uncle', {
        male: 'Uncle',
        female: 'Aunt',
      }),
      target: labels('Niece / Nephew', {
        male: 'Nephew',
        female: 'Niece',
      }),
    },
    validation: defaultValidation,
    hooks: noCustomLabel,
  },
  CUSTOM: {
    id: 'CUSTOM',
    label: 'Custom',
    description: 'A custom relationship category for future extensibility.',
    directional: true,
    symmetric: false,
    filterLabel: 'Custom',
    display: {
      source: labels('Related'),
      target: labels('Related'),
    },
    validation: defaultValidation,
    hooks: {
      supportsCustomLabel: true,
    },
  },
} as const satisfies RelationshipRegistry;

export function getRelationshipDefinition(
  canonicalId: CanonicalRelationshipId,
): RelationshipDefinition {
  return relationshipRegistry[canonicalId];
}

export function getRelationshipDefinitions(): RelationshipDefinition[] {
  return Object.values(relationshipRegistry);
}

export function getRelationshipFilterOptions() {
  return getRelationshipDefinitions().map((definition) => ({
    id: definition.id,
    label: definition.filterLabel,
  }));
}

export const relationshipSelectionOptions = [
  {
    id: 'father',
    label: 'Father',
    group: 'Family',
    canonicalId: 'PARENT_CHILD',
    perspective: 'source',
  },
  {
    id: 'mother',
    label: 'Mother',
    group: 'Family',
    canonicalId: 'PARENT_CHILD',
    perspective: 'source',
  },
  {
    id: 'son',
    label: 'Son',
    group: 'Family',
    canonicalId: 'PARENT_CHILD',
    perspective: 'target',
  },
  {
    id: 'daughter',
    label: 'Daughter',
    group: 'Family',
    canonicalId: 'PARENT_CHILD',
    perspective: 'target',
  },
  {
    id: 'brother',
    label: 'Brother',
    group: 'Family',
    canonicalId: 'SIBLING',
    perspective: 'source',
  },
  {
    id: 'sister',
    label: 'Sister',
    group: 'Family',
    canonicalId: 'SIBLING',
    perspective: 'source',
  },
  {
    id: 'grandfather',
    label: 'Grandfather',
    group: 'Family',
    canonicalId: 'GRANDPARENT',
    perspective: 'source',
  },
  {
    id: 'grandmother',
    label: 'Grandmother',
    group: 'Family',
    canonicalId: 'GRANDPARENT',
    perspective: 'source',
  },
  {
    id: 'grandson',
    label: 'Grandson',
    group: 'Family',
    canonicalId: 'GRANDPARENT',
    perspective: 'target',
  },
  {
    id: 'granddaughter',
    label: 'Granddaughter',
    group: 'Family',
    canonicalId: 'GRANDPARENT',
    perspective: 'target',
  },
  {
    id: 'uncle',
    label: 'Uncle',
    group: 'Family',
    canonicalId: 'AUNT_UNCLE',
    perspective: 'source',
  },
  {
    id: 'aunt',
    label: 'Aunt',
    group: 'Family',
    canonicalId: 'AUNT_UNCLE',
    perspective: 'source',
  },
  {
    id: 'nephew',
    label: 'Nephew',
    group: 'Family',
    canonicalId: 'AUNT_UNCLE',
    perspective: 'target',
  },
  {
    id: 'niece',
    label: 'Niece',
    group: 'Family',
    canonicalId: 'AUNT_UNCLE',
    perspective: 'target',
  },
  {
    id: 'cousin',
    label: 'Cousin',
    group: 'Family',
    canonicalId: 'COUSIN',
    perspective: 'source',
  },
  {
    id: 'husband',
    label: 'Husband',
    group: 'Family',
    canonicalId: 'SPOUSE',
    perspective: 'source',
  },
  {
    id: 'wife',
    label: 'Wife',
    group: 'Family',
    canonicalId: 'SPOUSE',
    perspective: 'source',
  },
  {
    id: 'mentor',
    label: 'Mentor',
    group: 'Professional',
    canonicalId: 'MENTOR',
    perspective: 'source',
  },
  {
    id: 'mentee',
    label: 'Mentee',
    group: 'Professional',
    canonicalId: 'MENTOR',
    perspective: 'target',
  },
  {
    id: 'teacher',
    label: 'Teacher',
    group: 'Professional',
    canonicalId: 'TEACHER',
    perspective: 'source',
  },
  {
    id: 'student',
    label: 'Student',
    group: 'Professional',
    canonicalId: 'TEACHER',
    perspective: 'target',
  },
  {
    id: 'colleague',
    label: 'Colleague',
    group: 'Professional',
    canonicalId: 'COLLEAGUE',
    perspective: 'source',
  },
  {
    id: 'manager',
    label: 'Manager',
    group: 'Professional',
    canonicalId: 'CUSTOM',
    perspective: 'source',
    customDisplayLabel: 'Manager',
  },
  {
    id: 'employee',
    label: 'Employee',
    group: 'Professional',
    canonicalId: 'CUSTOM',
    perspective: 'target',
    customDisplayLabel: 'Employee',
  },
  {
    id: 'friend',
    label: 'Friend',
    group: 'Social',
    canonicalId: 'FRIEND',
    perspective: 'source',
  },
  {
    id: 'close-friend',
    label: 'Close Friend',
    group: 'Social',
    canonicalId: 'CLOSE_FRIEND',
    perspective: 'source',
  },
  {
    id: 'neighbour',
    label: 'Neighbour',
    group: 'Social',
    canonicalId: 'NEIGHBOUR',
    perspective: 'source',
  },
  {
    id: 'volunteer',
    label: 'Volunteer',
    group: 'Community',
    canonicalId: 'CUSTOM',
    perspective: 'source',
    customDisplayLabel: 'Volunteer',
  },
  {
    id: 'trustee',
    label: 'Trustee',
    group: 'Community',
    canonicalId: 'CUSTOM',
    perspective: 'source',
    customDisplayLabel: 'Trustee',
  },
  {
    id: 'committee-member',
    label: 'Committee Member',
    group: 'Community',
    canonicalId: 'CUSTOM',
    perspective: 'source',
    customDisplayLabel: 'Committee Member',
  },
  {
    id: 'custom',
    label: 'Custom Relationship',
    group: 'Custom',
    canonicalId: 'CUSTOM',
    perspective: 'source',
    customDisplayLabel: 'Custom Relationship',
  },
] as const satisfies readonly RelationshipSelectionOption[];

export function getRelationshipSelectionOptions(): RelationshipSelectionOption[] {
  return [...relationshipSelectionOptions];
}

export function getRelationshipSelectionOption(
  id: string,
): RelationshipSelectionOption | undefined {
  return relationshipSelectionOptions.find((option) => option.id === id);
}
