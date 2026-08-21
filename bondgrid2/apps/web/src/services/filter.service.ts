import { Gender, Person } from './people.api';
import { Relationship, RelationshipTypeOption } from './relationships.api';

export type LoginFilterValue = 'yes' | 'no';

export interface GraphFilterState {
  search: string;
  genders: Gender[];
  occupations: string[];
  states: string[];
  cities: string[];
  areas: string[];
  hasLogin: LoginFilterValue[];
  relationshipCategories: string[];
  relationshipTypeIds: string[];
}

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface GraphFilterOptions {
  genders: FilterOption[];
  occupations: FilterOption[];
  states: FilterOption[];
  cities: FilterOption[];
  areas: FilterOption[];
  hasLogin: FilterOption[];
  relationshipCategories: FilterOption[];
  relationshipTypes: Array<FilterOption & { group?: string }>;
}

export interface FilteredGraphData {
  people: Person[];
  relationships: Relationship[];
}

export const emptyGraphFilters: GraphFilterState = {
  search: '',
  genders: [],
  occupations: [],
  states: [],
  cities: [],
  areas: [],
  hasLogin: [],
  relationshipCategories: [],
  relationshipTypeIds: [],
};

const searchablePersonFields: Array<keyof Person> = [
  'fullName',
  'phone',
  'email',
  'occupation',
  'state',
  'city',
  'area',
];

export function normalizeGender(gender?: string | null): string {
  return (gender ?? '').toString().trim().toLowerCase();
}

function matchesGender(
  personGender: string | undefined,
  selectedGenders: string[],
): boolean {
  if (selectedGenders.length === 0) {
    return true;
  }

  const normalized = normalizeGender(personGender);
  return selectedGenders.some(
    (gender) => normalizeGender(gender) === normalized,
  );
}

function normalize(value?: string): string {
  return value?.trim().toLowerCase() ?? '';
}

function getRelationshipOptionId(relationship: Relationship): string {
  return typeof relationship.metadata.relationshipOptionId === 'string'
    ? relationship.metadata.relationshipOptionId
    : relationship.type;
}

function uniqueOptions(values: string[]): FilterOption[] {
  const counts = new Map<string, number>();

  values
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));

  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((first, second) => first.label.localeCompare(second.label));
}

function selectedOrAll(value: string | undefined, selectedValues: string[]) {
  return selectedValues.length === 0 || selectedValues.includes(value ?? '');
}

function personMatchesSearch(person: Person, search: string): boolean {
  const query = normalize(search);

  if (!query) {
    return true;
  }

  return searchablePersonFields.some((field) =>
    normalize(String(person[field] ?? '')).includes(query),
  );
}

function relationshipMatchesFilters(
  relationship: Relationship,
  relationshipTypeMap: Map<string, RelationshipTypeOption>,
  filters: GraphFilterState,
): boolean {
  const optionId = getRelationshipOptionId(relationship);
  const option = relationshipTypeMap.get(optionId);
  const category = option?.group;
  const categoryMatches =
    filters.relationshipCategories.length === 0 ||
    (category ? filters.relationshipCategories.includes(category) : false);
  const typeMatches =
    filters.relationshipTypeIds.length === 0 ||
    filters.relationshipTypeIds.includes(optionId);

  return categoryMatches && typeMatches;
}

export function hasActiveGraphFilters(filters: GraphFilterState): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.genders.length > 0 ||
    filters.occupations.length > 0 ||
    filters.states.length > 0 ||
    filters.cities.length > 0 ||
    filters.areas.length > 0 ||
    filters.hasLogin.length > 0 ||
    filters.relationshipCategories.length > 0 ||
    filters.relationshipTypeIds.length > 0
  );
}

export function getActiveGraphFilterCount(filters: GraphFilterState): number {
  return [
    filters.search.trim(),
    ...filters.genders,
    ...filters.occupations,
    ...filters.states,
    ...filters.cities,
    ...filters.areas,
    ...filters.hasLogin,
    ...filters.relationshipCategories,
    ...filters.relationshipTypeIds,
  ].filter(Boolean).length;
}

export function buildGraphFilterOptions(
  people: Person[],
  relationships: Relationship[],
  relationshipTypes: RelationshipTypeOption[],
  filters: GraphFilterState,
): GraphFilterOptions {
  const peopleForGenders = filterGraphData(
    people,
    relationships,
    relationshipTypes,
    { ...filters, genders: [] },
  ).people;
  const peopleForOccupations = filterGraphData(
    people,
    relationships,
    relationshipTypes,
    { ...filters, occupations: [] },
  ).people;
  const peopleForStates = filterGraphData(
    people,
    relationships,
    relationshipTypes,
    {
      ...filters,
      states: [],
      cities: [],
      areas: [],
    },
  ).people;
  const peopleForCities = filterGraphData(
    people,
    relationships,
    relationshipTypes,
    {
      ...filters,
      cities: [],
      areas: [],
    },
  ).people;
  const peopleForAreas = filterGraphData(
    people,
    relationships,
    relationshipTypes,
    {
      ...filters,
      areas: [],
    },
  ).people;
  const peopleForLogin = filterGraphData(
    people,
    relationships,
    relationshipTypes,
    {
      ...filters,
      hasLogin: [],
    },
  ).people;
  const relationshipsForCategories = filterGraphData(
    people,
    relationships,
    relationshipTypes,
    { ...filters, relationshipCategories: [], relationshipTypeIds: [] },
  ).relationships;
  const relationshipsForTypes = filterGraphData(
    people,
    relationships,
    relationshipTypes,
    { ...filters, relationshipTypeIds: [] },
  ).relationships;
  const relationshipTypeMap = new Map(
    relationshipTypes.map((type) => [type.id, type]),
  );
  const existingCategoryOptions = relationshipsForCategories
    .map((relationship) =>
      relationshipTypeMap.get(getRelationshipOptionId(relationship)),
    )
    .filter((option): option is RelationshipTypeOption => Boolean(option));
  const existingTypeOptions = relationshipsForTypes
    .map((relationship) =>
      relationshipTypeMap.get(getRelationshipOptionId(relationship)),
    )
    .filter((option): option is RelationshipTypeOption => Boolean(option));
  const relationshipCategories = uniqueOptions(
    existingCategoryOptions.flatMap((option) =>
      option.group ? [option.group] : [],
    ),
  );
  const relationshipTypesForSelectedCategories = existingTypeOptions
    .filter((option, index, options) => {
      const categoryMatches =
        filters.relationshipCategories.length === 0 ||
        (option.group
          ? filters.relationshipCategories.includes(option.group)
          : false);
      const firstIndex = options.findIndex((entry) => entry.id === option.id);

      return categoryMatches && firstIndex === index;
    })
    .map((option) => ({
      value: option.id,
      label: option.label,
      group: option.group,
      count: relationshipsForTypes.filter(
        (relationship) => getRelationshipOptionId(relationship) === option.id,
      ).length,
    }))
    .sort((first, second) => first.label.localeCompare(second.label));

  const maleCount = peopleForGenders.filter(
    (person) => normalizeGender(person.gender) === 'male',
  ).length;
  const femaleCount = peopleForGenders.filter(
    (person) => normalizeGender(person.gender) === 'female',
  ).length;
  const otherCount = peopleForGenders.filter(
    (person) => normalizeGender(person.gender) === 'other',
  ).length;

  const genderOptions: FilterOption[] = [
    { value: 'male', label: 'Male', count: maleCount },
    { value: 'female', label: 'Female', count: femaleCount },
    { value: 'other', label: 'Other', count: otherCount },
  ];

  const loginOptions: FilterOption[] = [
    ...(people.some((person) => person.hasLogin)
      ? [
          {
            value: 'yes',
            label: 'Has login',
            count: peopleForLogin.filter((person) => person.hasLogin).length,
          },
        ]
      : []),
    ...(people.some((person) => !person.hasLogin)
      ? [
          {
            value: 'no',
            label: 'No login',
            count: peopleForLogin.filter((person) => !person.hasLogin).length,
          },
        ]
      : []),
  ];

  return {
    genders: genderOptions,
    occupations: uniqueOptions(
      peopleForOccupations
        .map((person) => person.occupation)
        .filter(Boolean) as string[],
    ),
    states: uniqueOptions(
      peopleForStates.map((person) => person.state).filter(Boolean) as string[],
    ),
    cities: uniqueOptions(
      peopleForCities.map((person) => person.city).filter(Boolean) as string[],
    ),
    areas: uniqueOptions(
      peopleForAreas.map((person) => person.area).filter(Boolean) as string[],
    ),
    hasLogin: loginOptions,
    relationshipCategories,
    relationshipTypes: relationshipTypesForSelectedCategories,
  };
}

export function pruneGraphFilters(
  filters: GraphFilterState,
  options: GraphFilterOptions,
): GraphFilterState {
  const available = {
    genders: new Set(options.genders.map((option) => option.value)),
    occupations: new Set(options.occupations.map((option) => option.value)),
    states: new Set(options.states.map((option) => option.value)),
    cities: new Set(options.cities.map((option) => option.value)),
    areas: new Set(options.areas.map((option) => option.value)),
    hasLogin: new Set(options.hasLogin.map((option) => option.value)),
    relationshipCategories: new Set(
      options.relationshipCategories.map((option) => option.value),
    ),
    relationshipTypeIds: new Set(
      options.relationshipTypes.map((option) => option.value),
    ),
  };

  return {
    ...filters,
    genders: filters.genders.filter((value) =>
      available.genders.has(normalizeGender(value)),
    ),
    occupations: filters.occupations.filter((value) =>
      available.occupations.has(value),
    ),
    states: filters.states.filter((value) => available.states.has(value)),
    cities: filters.cities.filter((value) => available.cities.has(value)),
    areas: filters.areas.filter((value) => available.areas.has(value)),
    hasLogin: filters.hasLogin.filter((value) => available.hasLogin.has(value)),
    relationshipCategories: filters.relationshipCategories.filter((value) =>
      available.relationshipCategories.has(value),
    ),
    relationshipTypeIds: filters.relationshipTypeIds.filter((value) =>
      available.relationshipTypeIds.has(value),
    ),
  };
}

export function filterGraphData(
  people: Person[],
  relationships: Relationship[],
  relationshipTypes: RelationshipTypeOption[],
  filters: GraphFilterState,
): FilteredGraphData {
  const relationshipTypeMap = new Map(
    relationshipTypes.map((type) => [type.id, type]),
  );
  const hasRelationshipFilters =
    filters.relationshipCategories.length > 0 ||
    filters.relationshipTypeIds.length > 0;
  const relationshipMatchedPersonIds = new Set<string>();
  const relationshipMatchesById = new Map<string, boolean>();

  relationships.forEach((relationship) => {
    const matches = relationshipMatchesFilters(
      relationship,
      relationshipTypeMap,
      filters,
    );
    relationshipMatchesById.set(relationship.id, matches);

    if (matches) {
      relationshipMatchedPersonIds.add(relationship.sourcePersonId);
      relationshipMatchedPersonIds.add(relationship.targetPersonId);
    }
  });

  const filteredPeople = people.filter((person) => {
    const matchesPersonFields =
      personMatchesSearch(person, filters.search) &&
      matchesGender(person.gender, filters.genders) &&
      selectedOrAll(person.occupation, filters.occupations) &&
      selectedOrAll(person.state, filters.states) &&
      selectedOrAll(person.city, filters.cities) &&
      selectedOrAll(person.area, filters.areas) &&
      (filters.hasLogin.length === 0 ||
        filters.hasLogin.includes(person.hasLogin ? 'yes' : 'no'));

    if (!matchesPersonFields) {
      return false;
    }

    return (
      !hasRelationshipFilters || relationshipMatchedPersonIds.has(person.id)
    );
  });
  const visiblePersonIds = new Set(filteredPeople.map((person) => person.id));
  const filteredRelationships = relationships.filter((relationship) => {
    const relationshipMatches =
      !hasRelationshipFilters || relationshipMatchesById.get(relationship.id);

    return (
      relationshipMatches &&
      visiblePersonIds.has(relationship.sourcePersonId) &&
      visiblePersonIds.has(relationship.targetPersonId)
    );
  });

  return {
    people: filteredPeople,
    relationships: filteredRelationships,
  };
}
