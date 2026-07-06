'use client';

import { ReactNode } from 'react';

interface ConfirmationDialogProps {
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmationDialog({
  title,
  children,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  loadingLabel = 'Deleting...',
  onCancel,
  onConfirm,
}: ConfirmationDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
      >
        <h3 id="confirmation-dialog-title" className="text-lg font-semibold">
          {title}
        </h3>

        <div className="mt-4">{children}</div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-900 disabled:opacity-60"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500 disabled:opacity-60"
            disabled={loading}
            onClick={() => void onConfirm()}
          >
            {loading ? loadingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
