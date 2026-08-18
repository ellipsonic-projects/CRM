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
}

export interface RelationshipImportPreviewRow {
  rowNumber: number;
  data: Partial<Record<RelationshipTemplateHeader, string>>;
  relationship?: BulkRelationshipRow;
  errors: string[];
}

export interface RelationshipImportPreviewResult {
  rows: RelationshipImportPreviewRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
}

export interface ImportPreviewResult {
  rows: ImportPreviewRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  relationships?: RelationshipImportPreviewResult;
}

export interface ParsedImportSheets {
  peopleRows: string[][];
  relationshipRows?: string[][];
}

const phonePattern = /^[6-9]\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validGenders = new Set<Gender>(['male', 'female', 'other']);

function normalizeHeader(value: string): PeopleTemplateHeader | undefined {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
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
): RelationshipTemplateHeader | undefined {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
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

  const previewRows = dataRows.flatMap(
    (row, index): RelationshipImportPreviewRow[] => {
      const rowNumber = index + 2;
      const data: Partial<Record<RelationshipTemplateHeader, string>> = {};

      row.forEach((value, columnIndex) => {
        const header = columnHeaders[columnIndex];

        if (header) {
          data[header] = trimValue(value);
        }
      });

      if (isRelationshipCompletelyEmpty(data)) {
        skippedRows += 1;
        return [];
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
        },
      ];
    },
  );

  const validRows = previewRows.filter((row) => row.errors.length === 0).length;

  return {
    rows: previewRows,
    totalRows: previewRows.length,
    validRows,
    invalidRows: previewRows.length - validRows,
    skippedRows,
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

  const previewRows = dataRows.flatMap((row, index): ImportPreviewRow[] => {
    const rowNumber = index + 2;
    const data: Partial<Record<PeopleTemplateHeader, string>> = {};

    row.forEach((value, columnIndex) => {
      const header = columnHeaders[columnIndex];

      if (header) {
        data[header] = trimValue(value);
      }
    });

    if (isCompletelyEmpty(data)) {
      skippedRows += 1;
      return [];
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
      },
    ];
  });
  const validRows = previewRows.filter((row) => row.errors.length === 0).length;

  const relationships = relationshipRows
    ? buildRelationshipsImportPreview(relationshipRows)
    : undefined;

  return {
    rows: previewRows,
    totalRows: previewRows.length,
    validRows,
    invalidRows: previewRows.length - validRows,
    skippedRows,
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
    // For CSV, output the Details sheet header
    const worksheet = XLSX.utils.aoa_to_sheet([
      [...bulkImportTemplateDetailsHeaders],
    ]);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    downloadBlob(
      new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      'CRM_Bulk_Import_Template.csv',
    );
    return;
  }

  // Generate multi-sheet workbook with Details and Relationships
  const workbook = XLSX.utils.book_new();

  const detailsWorksheet = XLSX.utils.aoa_to_sheet([
    [...bulkImportTemplateDetailsHeaders],
  ]);
  const relationshipsWorksheet = XLSX.utils.aoa_to_sheet([
    [...bulkImportTemplateRelationshipsHeaders],
  ]);

  XLSX.utils.book_append_sheet(workbook, detailsWorksheet, 'Details');
  XLSX.utils.book_append_sheet(
    workbook,
    relationshipsWorksheet,
    'Relationships',
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
