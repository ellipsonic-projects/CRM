import {
  buildPeopleImportPreview,
  buildRelationshipsImportPreview,
  bulkImportTemplateDetailsHeaders,
  bulkImportTemplateRelationshipsHeaders,
  mockDetailsRows,
  mockRelationshipsRows,
  TEMPLATE_EXAMPLE_MARKER_HEADER,
} from './people-import-export';

describe('people-import-export mock data & import logic', () => {
  it('has mock data that matches requested details and relationships specifications', () => {
    expect(mockDetailsRows).toHaveLength(3);
    expect(mockDetailsRows[0].personId).toBe('EXAMPLE001');
    expect(mockDetailsRows[0].fullName).toBe('Example Person One');
    expect(mockDetailsRows[0].phone).toBe('9876500001');
    expect(mockDetailsRows[0].email).toBe('example.one@example.com');
    expect(mockDetailsRows[0].gender).toBe('male');
    expect(mockDetailsRows[0].occupation).toBe('Software Engineer');
    expect(mockDetailsRows[0].state).toBe('Karnataka');
    expect(mockDetailsRows[0].city).toBe('Bengaluru');
    expect(mockDetailsRows[0].area).toBe('Indiranagar');
    expect(mockDetailsRows[0].notes).toBe('Example data - DO NOT IMPORT');
    expect(mockDetailsRows[0].hasLogin).toBe('no');

    expect(mockDetailsRows[1].personId).toBe('EXAMPLE002');
    expect(mockDetailsRows[1].fullName).toBe('Example Person Two');
    expect(mockDetailsRows[1].phone).toBe('9876500002');
    expect(mockDetailsRows[1].email).toBe('example.two@example.com');
    expect(mockDetailsRows[1].gender).toBe('female');

    expect(mockDetailsRows[2].personId).toBe('EXAMPLE003');
    expect(mockDetailsRows[2].fullName).toBe('Example Person Three');
    expect(mockDetailsRows[2].phone).toBe('9876500003');
    expect(mockDetailsRows[2].email).toBe('example.three@example.com');

    expect(mockRelationshipsRows).toHaveLength(2);
    expect(mockRelationshipsRows[0]).toEqual({
      relationshipId: 'EXAMPLE_REL_001',
      fromPersonId: 'EXAMPLE001',
      toPersonId: 'EXAMPLE002',
      relationshipType: 'FRIEND',
    });
    expect(mockRelationshipsRows[1]).toEqual({
      relationshipId: 'EXAMPLE_REL_002',
      fromPersonId: 'EXAMPLE001',
      toPersonId: 'EXAMPLE003',
      relationshipType: 'COLLEAGUE',
    });
  });

  it('ignores template mock rows in people preview and produces 0 valid rows from pure template', () => {
    const peopleHeaderRow = [...bulkImportTemplateDetailsHeaders, TEMPLATE_EXAMPLE_MARKER_HEADER];
    const peopleMockRows = mockDetailsRows.map((r) => [
      r.personId,
      r.fullName,
      r.phone,
      r.email,
      r.gender,
      r.occupation,
      r.state,
      r.city,
      r.area,
      r.notes,
      r.hasLogin,
      'TRUE',
    ]);

    const preview = buildPeopleImportPreview([peopleHeaderRow, ...peopleMockRows]);
    expect(preview.totalRows).toBe(3);
    expect(preview.exampleRows).toBe(3);
    expect(preview.validRows).toBe(0);
    expect(preview.invalidRows).toBe(0);
    expect(preview.rows.every((r) => r.isExample && r.person === undefined)).toBe(true);
  });

  it('ignores template mock rows in relationships preview and produces 0 valid rows from pure template', () => {
    const relHeaderRow = [...bulkImportTemplateRelationshipsHeaders, TEMPLATE_EXAMPLE_MARKER_HEADER];
    const relMockRows = mockRelationshipsRows.map((r) => [
      r.relationshipId,
      r.fromPersonId,
      r.toPersonId,
      r.relationshipType,
      'TRUE',
    ]);

    const preview = buildRelationshipsImportPreview([relHeaderRow, ...relMockRows]);
    expect(preview.totalRows).toBe(2);
    expect(preview.exampleRows).toBe(2);
    expect(preview.validRows).toBe(0);
    expect(preview.invalidRows).toBe(0);
    expect(preview.rows.every((r) => r.isExample && r.relationship === undefined)).toBe(true);
  });

  it('correctly parses real rows alongside mock rows', () => {
    const peopleHeaderRow = [...bulkImportTemplateDetailsHeaders, TEMPLATE_EXAMPLE_MARKER_HEADER];
    const peopleDataRows = [
      ...mockDetailsRows.map((r) => [
        r.personId,
        r.fullName,
        r.phone,
        r.email,
        r.gender,
        r.occupation,
        r.state,
        r.city,
        r.area,
        r.notes,
        r.hasLogin,
        'TRUE',
      ]),
      [
        'P000010',
        'Real User',
        '9876543210',
        'real.user@company.com',
        'female',
        'Manager',
        'Maharashtra',
        'Mumbai',
        'Bandra',
        'Real client',
        'yes',
        'FALSE',
      ],
    ];

    const preview = buildPeopleImportPreview([peopleHeaderRow, ...peopleDataRows]);
    expect(preview.totalRows).toBe(4);
    expect(preview.exampleRows).toBe(3);
    expect(preview.validRows).toBe(1);
    expect(preview.invalidRows).toBe(0);

    const realRow = preview.rows.find((r) => !r.isExample);
    expect(realRow).toBeDefined();
    expect(realRow?.person?.fullName).toBe('Real User');
    expect(realRow?.person?.personId).toBe('P000010');
    expect(realRow?.person?.hasLogin).toBe(true);
  });

  it('supports legacy CSV/XLSX imports without marker column', () => {
    const legacyPeopleRows = [
      [...bulkImportTemplateDetailsHeaders],
      [
        '',
        'Legacy Person',
        '9876543211',
        'legacy@org.com',
        'male',
        'Developer',
        'Delhi',
        'New Delhi',
        'Connaught Place',
        'Imported from legacy',
        'no',
      ],
    ];

    const preview = buildPeopleImportPreview(legacyPeopleRows);
    expect(preview.totalRows).toBe(1);
    expect(preview.exampleRows).toBe(0);
    expect(preview.validRows).toBe(1);
    expect(preview.invalidRows).toBe(0);
    expect(preview.rows[0].person?.fullName).toBe('Legacy Person');
  });
});
