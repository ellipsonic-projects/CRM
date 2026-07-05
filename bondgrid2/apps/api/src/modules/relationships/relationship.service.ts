import { RelationshipResolver } from './relationship.resolver';
import {
  CreateRelationshipDto,
  UpdateRelationshipDto,
} from './relationship.schema';
import {
  getRelationshipDefinition,
  getRelationshipSelectionOption,
  getRelationshipSelectionOptions,
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
} from './relationship.types';
import { validateRelationshipReference } from './relationship.validation';

export class RelationshipService {
  constructor(
    private readonly repository = new RelationshipRepository(),
    private readonly resolver = new RelationshipResolver(),
  ) {}

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
