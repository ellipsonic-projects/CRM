import { z } from 'zod';

import { canonicalRelationshipIdSchema } from './relationship.validation';

const metadataSchema = z.record(z.string(), z.unknown()).default({});

export const createRelationshipSchema = z.object({
  relationshipOptionId: z
    .string({ error: 'Please select a relationship.' })
    .trim()
    .min(1, { message: 'Please select a relationship.' })
    .optional(),
  selectedPersonId: z
    .string({ error: 'Selected person is required.' })
    .trim()
    .min(1, { message: 'Selected person is required.' })
    .optional(),
  relatedPersonId: z
    .string({ error: 'Please select a person.' })
    .trim()
    .min(1, { message: 'Please select a person.' })
    .optional(),
  type: canonicalRelationshipIdSchema.optional(),
  sourcePersonId: z
    .string({ error: 'Source person is required.' })
    .trim()
    .min(1, { message: 'Source person is required.' })
    .optional(),
  targetPersonId: z
    .string({ error: 'Please select a person.' })
    .trim()
    .min(1, { message: 'Please select a person.' })
    .optional(),
  notes: z
    .string({ error: 'Notes must be 1000 characters or less.' })
    .trim()
    .max(1000, { message: 'Notes must be 1000 characters or less.' })
    .optional(),
  metadata: metadataSchema.optional(),
});

export const updateRelationshipSchema = z.object({
  relationshipOptionId: z
    .string({ error: 'Please select a relationship.' })
    .trim()
    .min(1, { message: 'Please select a relationship.' })
    .optional(),
  selectedPersonId: z
    .string({ error: 'Selected person is required.' })
    .trim()
    .min(1, { message: 'Selected person is required.' })
    .optional(),
  relatedPersonId: z
    .string({ error: 'Please select a person.' })
    .trim()
    .min(1, { message: 'Please select a person.' })
    .optional(),
  type: canonicalRelationshipIdSchema.optional(),
  sourcePersonId: z
    .string({ error: 'Source person is required.' })
    .trim()
    .min(1, { message: 'Source person is required.' })
    .optional(),
  targetPersonId: z
    .string({ error: 'Please select a person.' })
    .trim()
    .min(1, { message: 'Please select a person.' })
    .optional(),
  notes: z
    .string({ error: 'Notes must be 1000 characters or less.' })
    .trim()
    .max(1000, { message: 'Notes must be 1000 characters or less.' })
    .optional(),
  metadata: metadataSchema.optional(),
});

export const bulkRelationshipItemSchema = z.object({
  relationshipId: z.string().trim().optional(),
  fromPersonId: z
    .string({ error: 'fromPersonId is required.' })
    .trim()
    .min(1, { message: 'fromPersonId is required.' }),
  toPersonId: z
    .string({ error: 'toPersonId is required.' })
    .trim()
    .min(1, { message: 'toPersonId is required.' }),
  relationshipType: z
    .string({ error: 'relationshipType is required.' })
    .trim()
    .min(1, { message: 'relationshipType is required.' }),
});

export const bulkRelationshipsImportSchema = z.object({
  relationships: z.array(bulkRelationshipItemSchema),
});

export type CreateRelationshipDto = z.infer<typeof createRelationshipSchema>;
export type UpdateRelationshipDto = z.infer<typeof updateRelationshipSchema>;
export type BulkRelationshipItemDto = z.infer<typeof bulkRelationshipItemSchema>;
export type BulkRelationshipsImportDto = z.infer<
  typeof bulkRelationshipsImportSchema
>;
