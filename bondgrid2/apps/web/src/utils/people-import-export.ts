import * as XLSX from 'xlsx';
import { CreatePersonInput, Gender, Person } from '../services/people.api';

export const peopleTemplateHeaders = [
  'personId',
  'fullName',
  'phone',
  'email',
  'gender',
  'occupation',
  'state',
  'city',
  'area',
  'notes',
  'hasLogin',
] as const;

type PeopleTemplateHeader = (typeof peopleTemplateHeaders)[number];

export const relationshipTemplateHeaders = [
  'relationshipId',
  'fromPersonId',
  'toPersonId',
  'relationshipType',
] as const;

export type RelationshipTemplateHeader =
  (typeof relationshipTemplateHeaders)[number];

export interface BulkRelationshipRow {
  relationshipId?: string;
  fromPersonId: string;
  toPersonId: string;
  relationshipType: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  data: Partial<Record<PeopleTemplateHeader, string>>;
  person?: CreatePersonInput;
  errors: string[];
  isExample?: boolean;
}

export interface RelationshipImportPreviewRow {
  rowNumber: number;
  data: Partial<Record<RelationshipTemplateHeader, string>>;
  relationship?: BulkRelationshipRow;
  errors: string[];
  isExample?: boolean;
}

export interface RelationshipImportPreviewResult {
  rows: RelationshipImportPreviewRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  exampleRows: number;
}

export interface ImportPreviewResult {
  rows: ImportPreviewRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  exampleRows: number;
  relationships?: RelationshipImportPreviewResult;
}

export interface ParsedImportSheets {
  peopleRows: string[][];
  relationshipRows?: string[][];
}

const phonePattern = /^[6-9]\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validGenders = new Set<Gender>(['male', 'female', 'other']);

export const TEMPLATE_EXAMPLE_MARKER_HEADER = '__templateExample';

export const mockDetailsRows: Record<PeopleTemplateHeader, string>[] = [
  {
    personId: 'EXAMPLE001',
    fullName: 'Example Person One',
    phone: '9876500001',
    email: 'example.one@example.com',
    gender: 'male',
    occupation: 'Software Engineer',
    state: 'Karnataka',
    city: 'Bengaluru',
    area: 'Indiranagar',
    notes: 'Example data - DO NOT IMPORT',
    hasLogin: 'no',
  },
  {
    personId: 'EXAMPLE002',
    fullName: 'Example Person Two',
    phone: '9876500002',
    email: 'example.two@example.com',
    gender: 'female',
    occupation: 'Teacher',
    state: 'Karnataka',
    city: 'Bengaluru',
    area: 'Koramangala',
    notes: 'Example data - DO NOT IMPORT',
    hasLogin: 'no',
  },
  {
    personId: 'EXAMPLE003',
    fullName: 'Example Person Three',
    phone: '9876500003',
    email: 'example.three@example.com',
    gender: 'male',
    occupation: 'Business Analyst',
    state: 'Karnataka',
    city: 'Mysuru',
    area: 'Vijayanagar',
    notes: 'Example data - DO NOT IMPORT',
    hasLogin: 'no',
  },
];

export const mockRelationshipsRows: Record<RelationshipTemplateHeader, string>[] = [
  {
    relationshipId: 'EXAMPLE_REL_001',
    fromPersonId: 'EXAMPLE001',
    toPersonId: 'EXAMPLE002',
    relationshipType: 'FRIEND',
  },
  {
    relationshipId: 'EXAMPLE_REL_002',
    fromPersonId: 'EXAMPLE001',
    toPersonId: 'EXAMPLE003',
    relationshipType: 'COLLEAGUE',
  },
];

const KNOWN_MOCK_PERSON_IDS = new Set(mockDetailsRows.map((r) => r.personId.toUpperCase()));
const KNOWN_MOCK_RELATIONSHIP_IDS = new Set(
  mockRelationshipsRows.map((r) => (r.relationshipId || '').toUpperCase()),
);

function isExamplePersonRow(
  data: Partial<Record<PeopleTemplateHeader, string>>,
  markerValue?: string,
): boolean {
  if (markerValue && parseBoolean(markerValue) === true) {
    return true;
  }
  const pid = data.personId?.trim().toUpperCase() || '';
  const notes = data.notes?.trim().toLowerCase() || '';
  const email = data.email?.trim().toLowerCase() || '';

  // Explicit combined checks to prevent accidental false positives on real user data
  if (KNOWN_MOCK_PERSON_IDS.has(pid)) {
    return true;
  }
  if (notes.includes('do not import') || notes.includes('example data')) {
    return true;
  }
  if (email.endsWith('@example.com') && pid.startsWith('EXAMPLE')) {
    return true;
  }

  return false;
}

function isExampleRelationshipRow(
  data: Partial<Record<RelationshipTemplateHeader, string>>,
  markerValue?: string,
): boolean {
  if (markerValue && parseBoolean(markerValue) === true) {
    return true;
  }
  const relId = data.relationshipId?.trim().toUpperCase() || '';
  const fromPid = data.fromPersonId?.trim().toUpperCase() || '';
  const toPid = data.toPersonId?.trim().toUpperCase() || '';

  if (KNOWN_MOCK_RELATIONSHIP_IDS.has(relId)) {
    return true;
  }
  if (KNOWN_MOCK_PERSON_IDS.has(fromPid) || KNOWN_MOCK_PERSON_IDS.has(toPid)) {
    return true;
  }
  if (relId.startsWith('EXAMPLE_REL_') || fromPid.startsWith('EXAMPLE') || toPid.startsWith('EXAMPLE')) {
    return true;
  }

  return false;
}

function normalizeHeader(value: string): PeopleTemplateHeader | typeof TEMPLATE_EXAMPLE_MARKER_HEADER | undefined {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

  if (normalized === '__templateexample' || normalized === 'templateexample') {
    return TEMPLATE_EXAMPLE_MARKER_HEADER;
  }

  const headerMap: Record<string, PeopleTemplateHeader> = {
    personid: 'personId',
    fullname: 'fullName',
    name: 'fullName',
    phone: 'phone',
    mobile: 'phone',
    email: 'email',
    gender: 'gender',
    occupation: 'occupation',
    state: 'state',
    city: 'city',
    area: 'area',
    notes: 'notes',
    note: 'notes',
    haslogin: 'hasLogin',
    login: 'hasLogin',
  };

  return headerMap[normalized];
}

function normalizeRelationshipHeader(
  value: string,
): RelationshipTemplateHeader | typeof TEMPLATE_EXAMPLE_MARKER_HEADER | undefined {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');

  if (normalized === '__templateexample' || normalized === 'templateexample') {
    return TEMPLATE_EXAMPLE_MARKER_HEADER;
  }

  const headerMap: Record<string, RelationshipTemplateHeader> = {
    relationshipid: 'relationshipId',
    frompersonid: 'fromPersonId',
    fromperson: 'fromPersonId',
    fromid: 'fromPersonId',
    topersonid: 'toPersonId',
    toperson: 'toPersonId',
    toid: 'toPersonId',
    relationshiptype: 'relationshipType',
    type: 'relationshipType',
  };

  return headerMap[normalized];
}

function trimValue(value: unknown): string {
  return String(value ?? '').trim();
}

function optional(value: string): string | undefined {
  return value.length > 0 ? value : undefined;
}

function parseBoolean(value: string): boolean | undefined {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (['true', 'yes', 'y', '1'].includes(normalized)) {
    return true;
  }

  if (['false', 'no', 'n', '0'].includes(normalized)) {
    return false;
  }

  return undefined;
}

function isCompletelyEmpty(
  data: Partial<Record<PeopleTemplateHeader, string>>,
): boolean {
  return peopleTemplateHeaders.every((header) => !data[header]?.trim());
}

function isRelationshipCompletelyEmpty(
  data: Partial<Record<RelationshipTemplateHeader, string>>,
): boolean {
  return relationshipTemplateHeaders.every((header) => !data[header]?.trim());
}

function extractWorksheetRows(sheet?: XLSX.WorkSheet): string[][] {
  if (!sheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    blankrows: false,
    defval: '',
  });
}

function toWorksheetRows(workbook: XLSX.WorkBook): ParsedImportSheets {
  const detailsSheetName =
    workbook.SheetNames.find(
      (name) => name.trim().toLowerCase() === 'details',
    ) ?? workbook.SheetNames[0];

  const relationshipsSheetName = workbook.SheetNames.find(
    (name) => name.trim().toLowerCase() === 'relationships',
  );

  const peopleRows = detailsSheetName
    ? extractWorksheetRows(workbook.Sheets[detailsSheetName])
    : [];

  const relationshipRows = relationshipsSheetName
    ? extractWorksheetRows(workbook.Sheets[relationshipsSheetName])
    : undefined;

  return {
    peopleRows,
    relationshipRows,
  };
}

function readCsv(text: string): ParsedImportSheets {
  const sheet = XLSX.read(text, { type: 'string' }).Sheets.Sheet1;
  return {
    peopleRows: extractWorksheetRows(sheet),
  };
}

export async function parsePeopleImportFile(
  file: File,
): Promise<ParsedImportSheets | string[][]> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return readCsv(await file.text());
  }

  if (extension === 'xlsx') {
    const data = await file.arrayBuffer();
    return toWorksheetRows(XLSX.read(data, { type: 'array' }));
  }

  throw new Error('Please upload a CSV or XLSX file.');
}

export function buildRelationshipsImportPreview(
  rows: string[][],
): RelationshipImportPreviewResult {
  const [headers = [], ...dataRows] = rows;
  const columnHeaders = headers.map((header) =>
    normalizeRelationshipHeader(header),
  );
  const seenRelationships = new Map<string, number>();
  let skippedRows = 0;
  let exampleRows = 0;

  const previewRows = dataRows.flatMap(
    (row, index): RelationshipImportPreviewRow[] => {
      const rowNumber = index + 2;
      const data: Partial<Record<RelationshipTemplateHeader, string>> = {};
      let markerValue: string | undefined;

      row.forEach((value, columnIndex) => {
        const header = columnHeaders[columnIndex];

        if (header === TEMPLATE_EXAMPLE_MARKER_HEADER) {
          markerValue = trimValue(value);
        } else if (header) {
          data[header] = trimValue(value);
        }
      });

      if (isRelationshipCompletelyEmpty(data)) {
        skippedRows += 1;
        return [];
      }

      const isExample = isExampleRelationshipRow(data, markerValue);
      if (isExample) {
        exampleRows += 1;
        return [
          {
            rowNumber,
            data,
            relationship: undefined,
            errors: [],
            isExample: true,
          },
        ];
      }

      const errors: string[] = [];
      const relationshipId = optional(data.relationshipId?.trim() ?? '');
      const fromPersonId = data.fromPersonId?.trim() ?? '';
      const toPersonId = data.toPersonId?.trim() ?? '';
      const relationshipType = data.relationshipType?.trim() ?? '';

      if (!fromPersonId) {
        errors.push('fromPersonId is required.');
      }

      if (!toPersonId) {
        errors.push('toPersonId is required.');
      }

      if (!relationshipType) {
        errors.push('relationshipType is required.');
      }

      if (fromPersonId && toPersonId && fromPersonId === toPersonId) {
        errors.push('A person cannot have a relationship with themselves.');
      }

      if (fromPersonId && toPersonId && relationshipType) {
        const key = `${fromPersonId.toLowerCase()}|${toPersonId.toLowerCase()}|${relationshipType.toLowerCase()}`;
        const firstSeen = seenRelationships.get(key);

        if (firstSeen !== undefined) {
          errors.push(
            `Duplicate relationship in import file; first seen on row ${firstSeen}.`,
          );
        } else {
          seenRelationships.set(key, rowNumber);
        }
      }

      const relationship: BulkRelationshipRow | undefined =
        errors.length === 0
          ? {
              relationshipId,
              fromPersonId,
              toPersonId,
              relationshipType,
            }
          : undefined;

      return [
        {
          rowNumber,
          data,
          relationship,
          errors,
          isExample: false,
        },
      ];
    },
  );

  const validRows = previewRows.filter(
    (row) => !row.isExample && row.errors.length === 0,
  ).length;
  const invalidRows = previewRows.filter(
    (row) => !row.isExample && row.errors.length > 0,
  ).length;

  return {
    rows: previewRows,
    totalRows: previewRows.length,
    validRows,
    invalidRows,
    skippedRows,
    exampleRows,
  };
}

export function buildPeopleImportPreview(
  input: ParsedImportSheets | string[][],
): ImportPreviewResult {
  const rows = Array.isArray(input) ? input : input.peopleRows;
  const relationshipRows = Array.isArray(input)
    ? undefined
    : input.relationshipRows;

  const [headers = [], ...dataRows] = rows;
  const columnHeaders = headers.map((header) => normalizeHeader(header));
  const seenPhones = new Map<string, number>();
  const seenEmails = new Map<string, number>();
  let skippedRows = 0;
  let exampleRows = 0;

  const previewRows = dataRows.flatMap((row, index): ImportPreviewRow[] => {
    const rowNumber = index + 2;
    const data: Partial<Record<PeopleTemplateHeader, string>> = {};
    let markerValue: string | undefined;

    row.forEach((value, columnIndex) => {
      const header = columnHeaders[columnIndex];

      if (header === TEMPLATE_EXAMPLE_MARKER_HEADER) {
        markerValue = trimValue(value);
      } else if (header) {
        data[header] = trimValue(value);
      }
    });

    if (isCompletelyEmpty(data)) {
      skippedRows += 1;
      return [];
    }

    const isExample = isExamplePersonRow(data, markerValue);
    if (isExample) {
      exampleRows += 1;
      return [
        {
          rowNumber,
          data,
          person: undefined,
          errors: [],
          isExample: true,
        },
      ];
    }

    const errors: string[] = [];
    const rawPersonId = data.personId?.trim() ?? '';
    const fullName = data.fullName?.trim() ?? '';
    const phone = data.phone?.replace(/\s+/g, '') ?? '';
    const email = data.email?.trim().toLowerCase() ?? '';
    const genderValue = data.gender?.trim().toLowerCase() ?? '';
    const gender = genderValue as Gender;
    const state = data.state?.trim() ?? '';
    const hasLogin = parseBoolean(data.hasLogin ?? '');

    if (rawPersonId && !/^P\d{6}$/.test(rawPersonId)) {
      errors.push(
        'Person ID must be in the format P followed by 6 digits (e.g. P000001).',
      );
    }

    if (fullName.length < 2) {
      errors.push('Full name is required.');
    }

    if (!phone && !email) {
      errors.push('Either phone or email is required.');
    }

    if (phone && !phonePattern.test(phone)) {
      errors.push('Phone must be a valid 10-digit Indian mobile number.');
    }

    if (email && !emailPattern.test(email)) {
      errors.push('Email must be valid.');
    }

    if (!genderValue || !validGenders.has(gender)) {
      errors.push('Gender must be male, female, or other.');
    }

    if (state.length < 2) {
      errors.push('State is required.');
    }

    if ((data.hasLogin ?? '').trim() && hasLogin === undefined) {
      errors.push('Has login must be yes/no or true/false.');
    }

    if (phone) {
      const firstSeen = seenPhones.get(phone);

      if (firstSeen !== undefined) {
        errors.push(
          `Duplicate phone in import file; first seen on row ${firstSeen}.`,
        );
      } else {
        seenPhones.set(phone, rowNumber);
      }
    }

    if (email) {
      const firstSeen = seenEmails.get(email);

      if (firstSeen !== undefined) {
        errors.push(
          `Duplicate email in import file; first seen on row ${firstSeen}.`,
        );
      } else {
        seenEmails.set(email, rowNumber);
      }
    }

    const person: CreatePersonInput | undefined =
      errors.length === 0
        ? {
            personId: optional(data.personId?.trim() ?? ''),
            fullName,
            phone: optional(phone),
            email: optional(email),
            gender,
            occupation: optional(data.occupation?.trim() ?? ''),
            state,
            city: optional(data.city?.trim() ?? ''),
            area: optional(data.area?.trim() ?? ''),
            notes: optional(data.notes?.trim() ?? ''),
            hasLogin: hasLogin ?? false,
          }
        : undefined;

    return [
      {
        rowNumber,
        data,
        person,
        errors,
        isExample: false,
      },
    ];
  });

  const validRows = previewRows.filter(
    (row) => !row.isExample && row.errors.length === 0,
  ).length;
  const invalidRows = previewRows.filter(
    (row) => !row.isExample && row.errors.length > 0,
  ).length;

  const relationships = relationshipRows
    ? buildRelationshipsImportPreview(relationshipRows)
    : undefined;

  return {
    rows: previewRows,
    totalRows: previewRows.length,
    validRows,
    invalidRows,
    skippedRows,
    exampleRows,
    relationships,
  };
}

export function peopleToRows(people: Person[]): Record<string, string>[] {
  return people.map((person) => ({
    personId: person.personId ?? '',
    fullName: person.fullName,
    phone: person.phone ?? '',
    email: person.email ?? '',
    gender: person.gender,
    occupation: person.occupation ?? '',
    state: person.state,
    city: person.city ?? '',
    area: person.area ?? '',
    notes: person.notes ?? '',
    hasLogin: person.hasLogin ? 'yes' : 'no',
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
  }));
}

export function downloadPeopleCsv(people: Person[], filename: string): void {
  const worksheet = XLSX.utils.json_to_sheet(peopleToRows(people));
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), filename);
}

export function downloadPeopleXlsx(people: Person[], filename: string): void {
  const worksheet = XLSX.utils.json_to_sheet(peopleToRows(people));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'People');
  XLSX.writeFile(workbook, filename);
}

export const bulkImportTemplateDetailsHeaders = [
  'personId',
  'fullName',
  'phone',
  'email',
  'gender',
  'occupation',
  'state',
  'city',
  'area',
  'notes',
  'hasLogin',
] as const;

export const bulkImportTemplateRelationshipsHeaders = [
  'relationshipId',
  'fromPersonId',
  'toPersonId',
  'relationshipType',
] as const;

export function downloadPeopleTemplate(format: 'csv' | 'xlsx'): void {
  if (format === 'csv') {
    // For CSV, output visible Details headers and mock rows with marker column
    const csvHeaders = [...bulkImportTemplateDetailsHeaders, TEMPLATE_EXAMPLE_MARKER_HEADER];
    const csvRows = [
      csvHeaders,
      ...mockDetailsRows.map((row) => [
        row.personId,
        row.fullName,
        row.phone,
        row.email,
        row.gender,
        row.occupation,
        row.state,
        row.city,
        row.area,
        row.notes,
        row.hasLogin,
        'TRUE',
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(csvRows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    downloadBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      'CRM_Bulk_Import_Template.csv',
    );
    return;
  }

  // Generate multi-sheet workbook with Instructions, Details and Relationships
  const workbook = XLSX.utils.book_new();

  // 1. Instructions Sheet
  const instructionsData = [
    ['CRM BULK IMPORT TEMPLATE - INSTRUCTIONS & GUIDELINES'],
    [],
    ['General Rules:'],
    ['1. Do NOT modify the header names in row 1 of the Details or Relationships sheets.'],
    ['2. Example/mock rows provided in the sheets are for guidance and are AUTOMATICALLY IGNORED during import.'],
    ['3. Add your real data in new rows below the examples, or overwrite/delete the example rows.'],
    [],
    ['Details Sheet Columns:'],
    ['- personId: Stable CRM Person ID (format: P000001). Leave blank for newly generated IDs.'],
    ['- fullName: Person\'s full name (required, min 2 characters).'],
    ['- phone: Valid 10-digit Indian mobile number (e.g. 9876500001).'],
    ['- email: Person\'s email address (e.g. name@example.com).'],
    ['- (Either phone or email is required).'],
    ['- gender: male / female / other (required).'],
    ['- occupation: Job role or occupation (optional).'],
    ['- state: State of residence (required).'],
    ['- city: City of residence (optional).'],
    ['- area: Locality / Area / Neighborhood (optional).'],
    ['- notes: Any notes or tags (optional).'],
    ['- hasLogin: yes / no (optional, defaults to no).'],
    [],
    ['Relationships Sheet Columns:'],
    ['- relationshipId: Optional relationship identifier.'],
    ['- fromPersonId: Person ID of the source person (required).'],
    ['- toPersonId: Person ID of the related person (required).'],
    ['- relationshipType: Type of relationship (e.g. FRIEND, SPOUSE, PARENT_CHILD, COLLEAGUE, SIBLING).'],
  ];

  const instructionsWorksheet = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsWorksheet['!cols'] = [{ wch: 100 }];

  // 2. Details Worksheet
  const detailsHeaders = [...bulkImportTemplateDetailsHeaders, TEMPLATE_EXAMPLE_MARKER_HEADER];
  const detailsRows = [
    detailsHeaders,
    ...mockDetailsRows.map((row) => [
      row.personId,
      row.fullName,
      row.phone,
      row.email,
      row.gender,
      row.occupation,
      row.state,
      row.city,
      row.area,
      row.notes,
      row.hasLogin,
      'TRUE',
    ]),
  ];

  const detailsWorksheet = XLSX.utils.aoa_to_sheet(detailsRows);
  // Set column widths and hide the __templateExample marker column (index 11)
  detailsWorksheet['!cols'] = [
    { wch: 15 }, // personId
    { wch: 24 }, // fullName
    { wch: 16 }, // phone
    { wch: 28 }, // email
    { wch: 12 }, // gender
    { wch: 22 }, // occupation
    { wch: 16 }, // state
    { wch: 16 }, // city
    { wch: 16 }, // area
    { wch: 32 }, // notes
    { wch: 12 }, // hasLogin
    { hidden: true }, // __templateExample
  ];

  // 3. Relationships Worksheet
  const relationshipsHeaders = [
    ...bulkImportTemplateRelationshipsHeaders,
    TEMPLATE_EXAMPLE_MARKER_HEADER,
  ];
  const relationshipsRows = [
    relationshipsHeaders,
    ...mockRelationshipsRows.map((row) => [
      row.relationshipId,
      row.fromPersonId,
      row.toPersonId,
      row.relationshipType,
      'TRUE',
    ]),
  ];

  const relationshipsWorksheet = XLSX.utils.aoa_to_sheet(relationshipsRows);
  // Set column widths and hide the __templateExample marker column (index 4)
  relationshipsWorksheet['!cols'] = [
    { wch: 20 }, // relationshipId
    { wch: 16 }, // fromPersonId
    { wch: 16 }, // toPersonId
    { wch: 20 }, // relationshipType
    { hidden: true }, // __templateExample
  ];

  XLSX.utils.book_append_sheet(workbook, detailsWorksheet, 'Details');
  XLSX.utils.book_append_sheet(
    workbook,
    relationshipsWorksheet,
    'Relationships',
  );
  XLSX.utils.book_append_sheet(
    workbook,
    instructionsWorksheet,
    'Instructions',
  );

  XLSX.writeFile(workbook, 'CRM_Bulk_Import_Template.xlsx');
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

