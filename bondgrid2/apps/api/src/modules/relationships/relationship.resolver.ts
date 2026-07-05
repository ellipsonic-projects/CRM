import { getRelationshipDefinition } from './relationship.registry';
import {
  CanonicalRelationshipId,
  RelationshipDisplayLabels,
  RelationshipGender,
  ResolveRelationshipDisplayInput,
  ResolvedRelationshipDisplay,
} from './relationship.types';

function resolveGenderedLabel(
  labels: RelationshipDisplayLabels,
  gender?: RelationshipGender,
): string {
  if (gender === 'male' && labels.male) {
    return labels.male;
  }

  if (gender === 'female' && labels.female) {
    return labels.female;
  }

  return labels.default;
}

export class RelationshipResolver {
  resolveDisplayName(input: ResolveRelationshipDisplayInput): string {
    return this.resolveDisplay(input).label;
  }

  resolveDisplay(
    input: ResolveRelationshipDisplayInput,
  ): ResolvedRelationshipDisplay {
    const definition = getRelationshipDefinition(input.canonicalId);
    const isSelectedSource = input.selectedPerson.id === input.sourcePerson.id;
    const isSelectedTarget = input.selectedPerson.id === input.targetPerson.id;

    if (!isSelectedSource && !isSelectedTarget) {
      throw new Error('Selected person is not part of this relationship.');
    }

    if (definition.symmetric) {
      return {
        canonicalId: definition.id,
        label: resolveGenderedLabel(
          definition.display.label,
          input.selectedPerson.gender,
        ),
        filterLabel: definition.filterLabel,
        direction: isSelectedSource ? 'OUTGOING' : 'INCOMING',
        isSelectedSource,
        isSelectedTarget,
      };
    }

    const labels = isSelectedSource
      ? definition.display.source
      : definition.display.target;

    return {
      canonicalId: definition.id,
      label: resolveGenderedLabel(labels, input.selectedPerson.gender),
      filterLabel: definition.filterLabel,
      direction: isSelectedSource ? 'OUTGOING' : 'INCOMING',
      isSelectedSource,
      isSelectedTarget,
    };
  }

  resolveStoredRelationshipLabel(
    canonicalId: CanonicalRelationshipId,
    selectedPersonId: string,
    sourcePersonId: string,
    targetPersonId: string,
    selectedPersonGender?: RelationshipGender,
  ): string {
    return this.resolveDisplayName({
      canonicalId,
      selectedPerson: {
        id: selectedPersonId,
        gender: selectedPersonGender,
      },
      sourcePerson: {
        id: sourcePersonId,
      },
      targetPerson: {
        id: targetPersonId,
      },
    });
  }
}
