'use client';

import { DragEvent, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  UploadCloud,
} from 'lucide-react';
import {
  buildPeopleImportPreview,
  downloadPeopleTemplate,
  ImportPreviewResult,
  parsePeopleImportFile,
} from '../../utils/people-import-export';

interface PeopleImportDialogProps {
  saving: boolean;
  importedRows: number;
  onClose: () => void;
  onImport: (preview: ImportPreviewResult) => Promise<void>;
}

export default function PeopleImportDialog({
  saving,
  importedRows,
  onClose,
  onImport,
}: PeopleImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ImportPreviewResult>();
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string>();
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) {
      return;
    }

    setError(undefined);
    setFileName(file.name);

    try {
      const rows = await parsePeopleImportFile(file);
      const result = buildPeopleImportPreview(rows);
      setPreview(result);
    } catch (importError) {
      setPreview(undefined);
      setError(
        importError instanceof Error
          ? importError.message
          : 'Could not read import file.',
      );
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void handleFile(event.dataTransfer.files[0]);
  };

  const validRows = preview?.rows.filter((row) => row.person) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <section className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Import People</h2>
            <p className="mt-1 text-sm text-slate-400">
              Upload a CSV or XLSX file, review validation, then import valid
              rows only.
            </p>
          </div>
          <button
            className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
            onClick={() => downloadPeopleTemplate('csv')}
          >
            Download CSV Template
          </button>
          <button
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
            onClick={() => downloadPeopleTemplate('xlsx')}
          >
            Download XLSX Template
          </button>
        </div>

        <div
          className={`mt-6 rounded-xl border border-dashed p-8 text-center transition ${
            dragging
              ? 'border-blue-400 bg-blue-950/30'
              : 'border-slate-700 bg-slate-900/40'
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <UploadCloud className="mx-auto text-blue-300" size={34} />
          <h3 className="mt-3 font-medium text-slate-100">
            Drop your people file here
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            CSV and XLSX files are supported.
          </p>
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
          <button
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500"
            onClick={() => inputRef.current?.click()}
          >
            Choose File
          </button>
          {fileName ? (
            <p className="mt-3 text-sm text-slate-400">
              Selected: <span className="text-slate-200">{fileName}</span>
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="mt-5 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {preview ? (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
              <SummaryCard label="Total rows" value={preview.totalRows} />
              <SummaryCard label="Valid rows" value={preview.validRows} />
              <SummaryCard label="Invalid rows" value={preview.invalidRows} />
              <SummaryCard label="Skipped rows" value={preview.skippedRows} />
              <SummaryCard label="Imported rows" value={importedRows} />
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900/70 px-4 py-3">
                <FileSpreadsheet size={18} className="text-blue-300" />
                <h3 className="font-medium">Preview</h3>
              </div>
              <div className="max-h-[42vh] overflow-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="sticky top-0 bg-slate-900 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Full name</th>
                      <th className="px-3 py-2">Phone</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Gender</th>
                      <th className="px-3 py-2">State</th>
                      <th className="px-3 py-2">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {preview.rows.map((row) => (
                      <tr key={row.rowNumber}>
                        <td className="px-3 py-2 text-slate-400">
                          {row.rowNumber}
                        </td>
                        <td className="px-3 py-2">
                          {row.errors.length === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2 py-1 text-xs text-emerald-300">
                              <CheckCircle2 size={13} /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-950 px-2 py-1 text-xs text-red-200">
                              <AlertCircle size={13} /> Invalid
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-200">
                          {row.data.fullName || 'Missing'}
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {row.data.phone || 'Missing'}
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {row.data.email || 'Missing'}
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {row.data.gender || 'Missing'}
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {row.data.state || 'Missing'}
                        </td>
                        <td className="max-w-md px-3 py-2 text-red-200">
                          {row.errors.length > 0
                            ? row.errors.join(' ')
                            : 'Ready to import'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-900"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:opacity-50"
                disabled={saving || validRows.length === 0}
                onClick={() => void onImport(preview)}
              >
                {saving
                  ? 'Importing...'
                  : `Import ${validRows.length} Valid Rows`}
              </button>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{label}</p>
    </div>
  );
}
