import {
  buildGraphFilterOptions,
  emptyGraphFilters,
  filterGraphData,
  normalizeGender,
  pruneGraphFilters,
} from './filter.service';
import { Person } from './people.api';
import { Relationship, RelationshipTypeOption } from './relationships.api';

describe('filter.service gender counts and filtering', () => {
  const mockPeople: Person[] = [
    {
      id: '1',
      organizationId: 'org1',
      fullName: 'Alice Walker',
      gender: 'female' as any,
      state: 'California',
      hasLogin: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '2',
      organizationId: 'org1',
      fullName: 'Bob Smith',
      gender: 'Male' as any,
      state: 'California',
      hasLogin: false,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '3',
      organizationId: 'org1',
      fullName: 'Charlie Brown',
      gender: 'MALE' as any,
      state: 'New York',
      hasLogin: true,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '4',
      organizationId: 'org1',
      fullName: 'Sam Taylor',
      gender: 'Other' as any,
      state: 'California',
      hasLogin: false,
      createdAt: '',
      updatedAt: '',
    },
    {
      id: '5',
      organizationId: 'org1',
      fullName: 'Dana Missing',
      gender: undefined as any,
      state: 'Texas',
      hasLogin: false,
      createdAt: '',
      updatedAt: '',
    },
  ];

  const mockRelationships: Relationship[] = [];
  const mockRelationshipTypes: RelationshipTypeOption[] = [];

  it('normalizes gender casing and handles undefined/null safely', () => {
    expect(normalizeGender('Male')).toBe('male');
    expect(normalizeGender('MALE')).toBe('male');
    expect(normalizeGender('female')).toBe('female');
    expect(normalizeGender('FEMALE')).toBe('female');
    expect(normalizeGender('Other')).toBe('other');
    expect(normalizeGender(undefined)).toBe('');
    expect(normalizeGender(null)).toBe('');
  });

  it('calculates gender counts dynamically from people dataset with case-insensitivity', () => {
    const options = buildGraphFilterOptions(
      mockPeople,
      mockRelationships,
      mockRelationshipTypes,
      emptyGraphFilters,
    );

    const maleOption = options.genders.find((g) => g.value === 'male');
    const femaleOption = options.genders.find((g) => g.value === 'female');
    const otherOption = options.genders.find((g) => g.value === 'other');

    expect(maleOption?.count).toBe(2); // Bob Smith (Male) + Charlie Brown (MALE)
    expect(femaleOption?.count).toBe(1); // Alice Walker (female)
    expect(otherOption?.count).toBe(1); // Sam Taylor (Other)
  });

  it('updates gender counts when other filters are active', () => {
    // Filter by state: California (Alice [female], Bob [Male], Sam [Other])
    const filters = {
      ...emptyGraphFilters,
      states: ['California'],
    };

    const options = buildGraphFilterOptions(
      mockPeople,
      mockRelationships,
      mockRelationshipTypes,
      filters,
    );

    const maleOption = options.genders.find((g) => g.value === 'male');
    const femaleOption = options.genders.find((g) => g.value === 'female');
    const otherOption = options.genders.find((g) => g.value === 'other');

    expect(maleOption?.count).toBe(1); // Bob Smith
    expect(femaleOption?.count).toBe(1); // Alice Walker
    expect(otherOption?.count).toBe(1); // Sam Taylor
  });

  it('filters people by gender case-insensitively', () => {
    const maleFiltered = filterGraphData(
      mockPeople,
      mockRelationships,
      mockRelationshipTypes,
      { ...emptyGraphFilters, genders: ['male'] },
    );

    expect(maleFiltered.people.map((p) => p.fullName)).toEqual([
      'Bob Smith',
      'Charlie Brown',
    ]);

    const femaleFiltered = filterGraphData(
      mockPeople,
      mockRelationships,
      mockRelationshipTypes,
      { ...emptyGraphFilters, genders: ['female'] },
    );

    expect(femaleFiltered.people.map((p) => p.fullName)).toEqual([
      'Alice Walker',
    ]);
  });

  it('prunes invalid gender filters', () => {
    const options = buildGraphFilterOptions(
      mockPeople,
      mockRelationships,
      mockRelationshipTypes,
      emptyGraphFilters,
    );

    const pruned = pruneGraphFilters(
      { ...emptyGraphFilters, genders: ['male', 'invalid_gender' as any] },
      options,
    );

    expect(pruned.genders).toEqual(['male']);
  });
});
