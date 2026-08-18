import { RelationshipResolver } from './relationship.resolver';
import {
  CreateRelationshipDto,
  UpdateRelationshipDto,
} from './relationship.schema';
import {
  getRelationshipDefinition,
  getRelationshipSelectionOption,
  getRelationshipSelectionOptions,
  resolveCanonicalRelationshipType,
} from './relationship.registry';
import {
  RelationshipMutationInput,
  RelationshipRepository,
  RelationshipWithPeople,
} from './relationship.repository';
import { RelationshipServiceError } from './relationship.errors';
import {
  CanonicalRelationshipId,
  RelationshipView,
  RelationshipTypeOption,
  BulkRelationshipInput,
  ResolvedBulkRelationship,
  ResolveBulkRelationshipResult,
} from './relationship.types';
import { validateRelationshipReference } from './relationship.validation';
import { PeopleRepository } from '../people/people.repository';

export class RelationshipService {
  constructor(
    private readonly repository = new RelationshipRepository(),
    private readonly resolver = new RelationshipResolver(),
    private readonly peopleRepository = new PeopleRepository(),
  ) {}

  async resolveBulkRelationships(
    organizationId: string,
    rows: BulkRelationshipInput[],
  ): Promise<ResolveBulkRelationshipResult> {
    const valid: ResolvedBulkRelationship[] = [];
    const errors: { row: BulkRelationshipInput; error: string }[] = [];

    // Cache looked up personIds to avoid redundant queries during bulk check
    const personCache = new Map<string, { id: string; personId: string } | null>();

    const getPerson = async (personId: string) => {
      const normalized = personId.trim();
      if (personCache.has(normalized)) {
        return personCache.get(normalized);
      }
      const person = await this.peopleRepository.findByPersonId(
        organizationId,
        normalized,
      );
      const result = person ? { id: person.id, personId: person.personId ?? normalized } : null;
      personCache.set(normalized, result);
      return result;
    };

    for (const row of rows) {
      const fromPersonId = row.fromPersonId?.trim();
      const toPersonId = row.toPersonId?.trim();
      const relationshipType = row.relationshipType?.trim();

      if (!fromPersonId) {
        errors.push({ row, error: 'fromPersonId is required.' });
        continue;
      }

      if (!toPersonId) {
        errors.push({ row, error: 'toPersonId is required.' });
        continue;
      }

      if (fromPersonId === toPersonId) {
        errors.push({
          row,
          error: 'A person cannot have a relationship with themselves.',
        });
        continue;
      }

      if (!relationshipType) {
        errors.push({ row, error: 'relationshipType is required.' });
        continue;
      }

      const typeResolution = resolveCanonicalRelationshipType(relationshipType);
      if (!typeResolution) {
        errors.push({
          row,
          error: `Invalid relationship type: ${relationshipType}`,
        });
        continue;
      }

      const fromPerson = await getPerson(fromPersonId);
      if (!fromPerson) {
        errors.push({
          row,
          error: `Person with personId ${fromPersonId} does not exist.`,
        });
        continue;
      }

      const toPerson = await getPerson(toPersonId);
      if (!toPerson) {
        errors.push({
          row,
          error: `Person with personId ${toPersonId} does not exist.`,
        });
        continue;
      }

      // If resolved via a natural option with perspective = 'target' (e.g., 'son', 'daughter', 'mentee', 'student'),
      // the canonical directional relationship flows from parent/mentor/teacher -> child/mentee/student.
      const option = typeResolution.optionId
        ? getRelationshipSelectionOption(typeResolution.optionId)
        : undefined;

      const sourceInternalId =
        option?.perspective === 'target' ? toPerson.id : fromPerson.id;
      const targetInternalId =
        option?.perspective === 'target' ? fromPerson.id : toPerson.id;

      valid.push({
        relationshipId: row.relationshipId?.trim() || undefined,
        fromPersonId,
        toPersonId,
        relationshipType,
        sourceInternalId,
        targetInternalId,
        canonicalType: typeResolution.canonicalId,
        optionId: typeResolution.optionId,
      });
    }

    return {
      valid,
      errors,
    };
  }

  async createBulkRelationships(
    organizationId: string,
    rows: BulkRelationshipInput[],
    createdBy: string,
  ): Promise<{
    createdCount: number;
    skippedCount: number;
    failedCount: number;
    errors: { row: BulkRelationshipInput; error: string }[];
  }> {
    const resolution = await this.resolveBulkRelationships(
      organizationId,
      rows,
    );

    let createdCount = 0;
    let skippedCount = 0;
    const errors = [...resolution.errors];

    for (const validItem of resolution.valid) {
      const rowOriginal: BulkRelationshipInput = {
        relationshipId: validItem.relationshipId,
        fromPersonId: validItem.fromPersonId,
        toPersonId: validItem.toPersonId,
        relationshipType: validItem.relationshipType,
      };

      try {
        const check = await this.repository.checkCreate(organizationId, {
          type: validItem.canonicalType,
          sourcePersonId: validItem.sourceInternalId,
          targetPersonId: validItem.targetInternalId,
        });

        if (check.duplicateExists) {
          skippedCount += 1;
          continue;
        }

        if (!check.sourceExists || !check.targetExists) {
          errors.push({
            row: rowOriginal,
            error: 'One or both people do not exist.',
          });
          continue;
        }

        const metadata: Record<string, unknown> = {};
        if (validItem.optionId) {
          metadata.relationshipOptionId = validItem.optionId;
          const option = getRelationshipSelectionOption(validItem.optionId);
          if (option?.customDisplayLabel) {
            metadata.displayLabel = option.customDisplayLabel;
          }
        }
        if (validItem.relationshipId) {
          metadata.importRelationshipId = validItem.relationshipId;
        }

        const created = await this.repository.create(
          organizationId,
          {
            type: validItem.canonicalType,
            sourcePersonId: validItem.sourceInternalId,
            targetPersonId: validItem.targetInternalId,
            metadata,
          },
          createdBy,
        );

        if (created) {
          createdCount += 1;
        } else {
          errors.push({
            row: rowOriginal,
            error: 'Failed to create relationship edge.',
          });
        }
      } catch (err) {
        errors.push({
          row: rowOriginal,
          error: err instanceof Error ? err.message : 'Creation failed',
        });
      }
    }

    return {
      createdCount,
      skippedCount,
      failedCount: errors.length,
      errors,
    };
  }

  getRelationshipTypes(): RelationshipTypeOption[] {
    return getRelationshipSelectionOptions().map((option) => {
      const definition = getRelationshipDefinition(option.canonicalId);

      return {
        id: option.id,
        label: option.label,
        group: option.group,
        canonicalId: option.canonicalId,
        perspective: option.perspective,
        directional: definition.directional,
        symmetric: definition.symmetric,
      };
    });
  }

  async createRelationship(
    organizationId: string,
    data: CreateRelationshipDto,
    createdBy: string,
  ): Promise<RelationshipView> {
    const resolvedData = this.resolveCreateInput(data);
    this.assertValidReference(
      resolvedData.type,
      resolvedData.sourcePersonId,
      resolvedData.targetPersonId,
    );

    const check = await this.repository.checkCreate(
      organizationId,
      resolvedData,
    );

    if (!check.sourceExists || !check.targetExists) {
      throw new RelationshipServiceError(
        'MISSING_PERSON',
        'Please select existing people for this relationship.',
      );
    }

    if (check.duplicateExists) {
      throw new RelationshipServiceError(
        'DUPLICATE_RELATIONSHIP',
        'This relationship already exists between these people.',
      );
    }

    const relationship = await this.repository.create(
      organizationId,
      resolvedData,
      createdBy,
    );

    if (!relationship) {
      throw new RelationshipServiceError(
        'MISSING_PERSON',
        'Please select existing people for this relationship.',
      );
    }

    return this.toRelationshipView(relationship, resolvedData.selectedPersonId);
  }

  async listRelationships(organizationId: string): Promise<RelationshipView[]> {
    const relationships =
      await this.repository.findAllByOrganization(organizationId);

    return relationships.map((relationship) =>
      this.toRelationshipView(
        relationship,
        relationship.relationship.sourcePersonId,
      ),
    );
  }

  async getRelationshipById(
    organizationId: string,
    id: string,
  ): Promise<RelationshipView | null> {
    const relationship = await this.repository.findById(organizationId, id);

    return relationship
      ? this.toRelationshipView(
          relationship,
          relationship.relationship.sourcePersonId,
        )
      : null;
  }

  async listPersonRelationships(
    organizationId: string,
    personId: string,
  ): Promise<RelationshipView[] | null> {
    const relationships = await this.repository.findByPersonId(
      organizationId,
      personId,
    );

    return (
      relationships?.map((relationship) =>
        this.toRelationshipView(relationship, personId),
      ) ?? null
    );
  }

  async updateRelationship(
    organizationId: string,
    id: string,
    data: UpdateRelationshipDto,
  ): Promise<RelationshipView | null> {
    const existing = await this.repository.findById(organizationId, id);

    if (!existing) {
      return null;
    }

    const resolvedData = this.resolveUpdateInput(data, existing.relationship);

    this.assertValidReference(
      resolvedData.type,
      resolvedData.sourcePersonId,
      resolvedData.targetPersonId,
    );

    const sourceExists = await this.repository.personExists(
      organizationId,
      resolvedData.sourcePersonId,
    );
    const targetExists = await this.repository.personExists(
      organizationId,
      resolvedData.targetPersonId,
    );

    if (!sourceExists || !targetExists) {
      throw new RelationshipServiceError(
        'MISSING_PERSON',
        'Please select existing people for this relationship.',
      );
    }

    const duplicateExists = await this.repository.duplicateExistsForUpdate(
      organizationId,
      id,
      resolvedData.type,
      resolvedData.sourcePersonId,
      resolvedData.targetPersonId,
    );

    if (duplicateExists) {
      throw new RelationshipServiceError(
        'DUPLICATE_RELATIONSHIP',
        'This relationship already exists between these people.',
      );
    }

    const updated = await this.repository.update(organizationId, id, {
      type: resolvedData.type,
      sourcePersonId: resolvedData.sourcePersonId,
      targetPersonId: resolvedData.targetPersonId,
      notes: data.notes,
      metadata: resolvedData.metadata,
    });

    return updated
      ? this.toRelationshipView(updated, resolvedData.selectedPersonId)
      : null;
  }

  async deleteRelationship(
    organizationId: string,
    id: string,
  ): Promise<boolean> {
    return this.repository.delete(organizationId, id);
  }

  private assertValidReference(
    type: CanonicalRelationshipId,
    sourcePersonId: string,
    targetPersonId: string,
  ): void {
    const validationErrors = validateRelationshipReference({
      canonicalId: type,
      sourcePersonId,
      targetPersonId,
    });

    if (validationErrors.length > 0) {
      throw new RelationshipServiceError(
        'SELF_RELATIONSHIP',
        validationErrors[0].message,
      );
    }
  }

  private resolveCreateInput(
    data: CreateRelationshipDto,
  ): RelationshipMutationInput & { selectedPersonId: string } {
    if (data.relationshipOptionId) {
      return this.resolveNaturalInput({
        relationshipOptionId: data.relationshipOptionId,
        selectedPersonId: data.selectedPersonId,
        relatedPersonId: data.relatedPersonId,
        notes: data.notes,
        metadata: data.metadata,
      });
    }

    if (!data.type || !data.sourcePersonId || !data.targetPersonId) {
      throw new RelationshipServiceError(
        'INVALID_RELATIONSHIP',
        'Please select a relationship and related person.',
      );
    }

    return {
      type: data.type,
      sourcePersonId: data.sourcePersonId,
      targetPersonId: data.targetPersonId,
      selectedPersonId: data.sourcePersonId,
      notes: data.notes,
      metadata: data.metadata ?? {},
    };
  }

  private resolveUpdateInput(
    data: UpdateRelationshipDto,
    existing: RelationshipMutationInput,
  ): RelationshipMutationInput & { selectedPersonId: string } {
    if (data.relationshipOptionId) {
      return this.resolveNaturalInput({
        relationshipOptionId: data.relationshipOptionId,
        selectedPersonId: data.selectedPersonId,
        relatedPersonId: data.relatedPersonId,
        notes: data.notes,
        metadata: data.metadata,
      });
    }

    return {
      type: data.type ?? existing.type,
      sourcePersonId: data.sourcePersonId ?? existing.sourcePersonId,
      targetPersonId: data.targetPersonId ?? existing.targetPersonId,
      selectedPersonId: data.sourcePersonId ?? existing.sourcePersonId,
      notes: data.notes,
      metadata: data.metadata ?? existing.metadata ?? {},
    };
  }

  private resolveNaturalInput(data: {
    relationshipOptionId?: string;
    selectedPersonId?: string;
    relatedPersonId?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }): RelationshipMutationInput & { selectedPersonId: string } {
    if (!data.relationshipOptionId) {
      throw new RelationshipServiceError(
        'INVALID_RELATIONSHIP',
        'Please select a relationship.',
      );
    }

    const option = getRelationshipSelectionOption(data.relationshipOptionId);

    if (!option) {
      throw new RelationshipServiceError(
        'INVALID_RELATIONSHIP',
        'Please select a valid relationship.',
      );
    }

    if (!data.selectedPersonId || !data.relatedPersonId) {
      throw new RelationshipServiceError(
        'MISSING_PERSON',
        'Please select an existing person for this relationship.',
      );
    }

    const sourcePersonId =
      option.perspective === 'source'
        ? data.selectedPersonId
        : data.relatedPersonId;
    const targetPersonId =
      option.perspective === 'source'
        ? data.relatedPersonId
        : data.selectedPersonId;
    const metadata = {
      ...(data.metadata ?? {}),
      relationshipOptionId: option.id,
      ...(option.customDisplayLabel
        ? { displayLabel: option.customDisplayLabel }
        : {}),
    };

    return {
      type: option.canonicalId,
      sourcePersonId,
      targetPersonId,
      selectedPersonId: data.selectedPersonId,
      notes: data.notes,
      metadata,
    };
  }

  private toRelationshipView(
    entry: RelationshipWithPeople,
    selectedPersonId: string,
  ): RelationshipView {
    const selectedPerson =
      entry.sourcePerson.id === selectedPersonId
        ? entry.sourcePerson
        : entry.targetPerson;
    const relatedPerson =
      entry.sourcePerson.id === selectedPersonId
        ? entry.targetPerson
        : entry.sourcePerson;
    const resolved = this.resolver.resolveDisplay({
      canonicalId: entry.relationship.type,
      selectedPerson,
      sourcePerson: entry.sourcePerson,
      targetPerson: entry.targetPerson,
    });
    const customDisplayLabel =
      typeof entry.relationship.metadata.displayLabel === 'string'
        ? entry.relationship.metadata.displayLabel
        : undefined;

    return {
      ...entry.relationship,
      displayLabel: customDisplayLabel ?? resolved.label,
      filterLabel: resolved.filterLabel,
      direction: resolved.direction,
      sourcePerson: entry.sourcePerson,
      targetPerson: entry.targetPerson,
      relatedPerson,
    };
  }
}
