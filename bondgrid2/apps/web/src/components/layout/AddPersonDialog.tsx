'use client';

import { FormEvent, ReactNode } from 'react';
import AvatarUpload from '../form/AvatarUpload';
import PasswordInput from '../form/PasswordInput';
import { Gender, Person } from '../../services/people.api';
import {
  generateSecurePassword,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '../../utils/password';

export interface PersonFormState {
  fullName: string;
  phone: string;
  email: string;
  gender: Gender;
  occupation: string;
  state: string;
  city: string;
  area: string;
  notes: string;
  profilePicture: string;
  profilePictureFile?: File;
  hasLogin: boolean;
  username: string;
  temporaryPassword: string;
  confirmTemporaryPassword: string;
  role: 'VIEWER' | 'VOLUNTEER';
}

export const emptyPersonForm: PersonFormState = {
  fullName: '',
  phone: '',
  email: '',
  gender: 'other',
  occupation: '',
  state: '',
  city: '',
  area: '',
  notes: '',
  profilePicture: '',
  profilePictureFile: undefined,
  hasLogin: false,
  username: '',
  temporaryPassword: '',
  confirmTemporaryPassword: '',
  role: 'VIEWER',
};

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

export function generateUsername(name: string, people: Person[]): string {
  const base = slugifyName(name) || 'person';
  const similarNames = people.filter(
    (person) => slugifyName(person.fullName) === base,
  ).length;

  return similarNames > 0 ? `${base}${similarNames + 1}` : base;
}

interface AddPersonDialogProps {
  form: PersonFormState;
  people: Person[];
  saving: boolean;
  error?: string;
  description?: string;
  onClose: () => void;
  onChange: (form: PersonFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export default function AddPersonDialog({
  form,
  people,
  saving,
  error,
  description = 'Create a person profile for this organization.',
  onClose,
  onChange,
  onSubmit,
}: AddPersonDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <form
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Add Person</h2>
            <p className="mt-1 text-sm text-slate-400">{description}</p>
          </div>
          <button
            type="button"
            className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        {error ? (
          <div className="mt-5 whitespace-pre-line rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h3 className="font-semibold text-slate-100">Person Information</h3>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Full name">
              <input
                className="input"
                value={form.fullName}
                onChange={(event) => {
                  const fullName = event.target.value;
                  onChange({
                    ...form,
                    fullName,
                    username:
                      form.username === '' ||
                      form.username === generateUsername(form.fullName, people)
                        ? generateUsername(fullName, people)
                        : form.username,
                  });
                }}
                required
              />
            </Field>

            <Field label="Gender">
              <select
                className="input"
                value={form.gender}
                onChange={(event) =>
                  onChange({ ...form, gender: event.target.value as Gender })
                }
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>

            <Field label="Phone">
              <input
                className="input"
                value={form.phone}
                onChange={(event) =>
                  onChange({ ...form, phone: event.target.value })
                }
              />
            </Field>

            <Field label="Email">
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={(event) =>
                  onChange({ ...form, email: event.target.value })
                }
              />
            </Field>

            <Field label="Occupation">
              <input
                className="input"
                value={form.occupation}
                onChange={(event) =>
                  onChange({ ...form, occupation: event.target.value })
                }
              />
            </Field>

            <Field label="State">
              <input
                className="input"
                value={form.state}
                onChange={(event) =>
                  onChange({ ...form, state: event.target.value })
                }
                required
              />
            </Field>

            <Field label="City">
              <input
                className="input"
                value={form.city}
                onChange={(event) =>
                  onChange({ ...form, city: event.target.value })
                }
              />
            </Field>

            <Field label="Area">
              <input
                className="input"
                value={form.area}
                onChange={(event) =>
                  onChange({ ...form, area: event.target.value })
                }
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Profile Picture">
              <AvatarUpload
                value={form.profilePicture}
                name={form.fullName}
                onChange={(profilePicture, profilePictureFile) =>
                  onChange({ ...form, profilePicture, profilePictureFile })
                }
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              className="input mt-2 min-h-24 resize-none"
              value={form.notes}
              onChange={(event) =>
                onChange({ ...form, notes: event.target.value })
              }
            />
          </Field>
        </section>

        <section className="mt-5 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-100">Account Access</h3>
              <p className="mt-1 text-sm text-slate-400">
                Optionally prepare login details for this person.
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.hasLogin}
                onChange={(event) =>
                  onChange({
                    ...form,
                    hasLogin: event.target.checked,
                    username:
                      form.username || generateUsername(form.fullName, people),
                  })
                }
              />
              Create Login Account
            </label>
          </div>

          {form.hasLogin ? (
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Role">
                <select
                  className="input"
                  value={form.role}
                  onChange={(event) =>
                    onChange({
                      ...form,
                      role: event.target.value as 'VIEWER' | 'VOLUNTEER',
                    })
                  }
                >
                  <option value="VIEWER">Viewer</option>
                  <option value="VOLUNTEER">Volunteer</option>
                </select>
              </Field>

              <Field label="Username">
                <input
                  className="input"
                  value={form.username}
                  onChange={(event) =>
                    onChange({ ...form, username: event.target.value })
                  }
                  required={form.hasLogin}
                />
              </Field>

              <Field label="Temporary Password">
                <div className="flex gap-2">
                  <PasswordInput
                    className="input"
                    value={form.temporaryPassword}
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    autoComplete="new-password"
                    onChange={(event) =>
                      onChange({
                        ...form,
                        temporaryPassword: event.target.value,
                      })
                    }
                    required={form.hasLogin}
                  />
                  <button
                    type="button"
                    className="rounded-xl border border-slate-700 px-3 text-sm text-slate-200 hover:bg-slate-800"
                    onClick={() => {
                      const password = generateSecurePassword();
                      onChange({
                        ...form,
                        temporaryPassword: password,
                        confirmTemporaryPassword: password,
                      });
                    }}
                  >
                    Generate
                  </button>
                </div>
              </Field>

              <Field label="Confirm Password">
                <PasswordInput
                  className="input"
                  value={form.confirmTemporaryPassword}
                  minLength={PASSWORD_MIN_LENGTH}
                  maxLength={PASSWORD_MAX_LENGTH}
                  autoComplete="new-password"
                  onChange={(event) =>
                    onChange({
                      ...form,
                      confirmTemporaryPassword: event.target.value,
                    })
                  }
                  required={form.hasLogin}
                />
              </Field>

              <p className="text-sm text-slate-500 md:col-span-2">
                Password-change-on-first-login can be enforced once backend
                account provisioning support is enabled.
              </p>
            </div>
          ) : null}
        </section>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-900"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="rounded-xl bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Creating...' : 'Save Person'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-slate-300">
      <span className="mb-2 block text-slate-400">{label}</span>
      {children}
    </label>
  );
}
