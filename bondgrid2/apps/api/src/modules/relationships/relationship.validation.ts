import { z } from 'zod';

import {
  CANONICAL_RELATIONSHIP_IDS,
  RELATIONSHIP_GENDERS,
} from './relationship.constants';
import { getRelationshipDefinition } from './relationship.registry';
import {
  CanonicalRelationshipId,
  RelationshipValidationRule,
} from './relationship.types';

export const canonicalRelationshipIdSchema = z.enum(
  CANONICAL_RELATIONSHIP_IDS,
  {
    error: 'Please select a valid relationship type.',
  },
);

export const relationshipPersonSchema = z.object({
  id: z
    .string({ error: 'Person id is required.' })
    .trim()
    .min(1, { message: 'Person id is required.' }),
  gender: z.enum(RELATIONSHIP_GENDERS).optional(),
});

export const relationshipReferenceSchema = z.object({
  canonicalId: canonicalRelationshipIdSchema,
  sourcePersonId: z
    .string({ error: 'Source person id is required.' })
    .trim()
    .min(1, { message: 'Source person id is required.' }),
  targetPersonId: z
    .string({ error: 'Target person id is required.' })
    .trim()
    .min(1, { message: 'Target person id is required.' }),
});

export function isCanonicalRelationshipId(
  value: unknown,
): value is CanonicalRelationshipId {
  return canonicalRelationshipIdSchema.safeParse(value).success;
}

export function validateRelationshipReference(input: {
  canonicalId: CanonicalRelationshipId;
  sourcePersonId: string;
  targetPersonId: string;
}): RelationshipValidationRule[] {
  const definition = getRelationshipDefinition(input.canonicalId);
  const errors: RelationshipValidationRule[] = [];

  if (
    !definition.validation.allowSelfRelationship &&
    input.sourcePersonId === input.targetPersonId
  ) {
    errors.push(
      ...definition.validation.rules.filter(
        (rule) => rule.code === 'NO_SELF_RELATIONSHIP',
      ),
    );
  }

  return errors;
}
