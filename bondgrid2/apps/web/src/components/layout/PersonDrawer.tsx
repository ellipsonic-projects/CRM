import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Edit3, Trash2, X } from 'lucide-react';
import { Person, UpdatePersonInput, Gender } from '../../services/people.api';
import AvatarUpload from '../form/AvatarUpload';

interface PersonDrawerProps {
  person?: Person;
  saving: boolean;
  error?: string;
  onUpdatePerson: (
    id: string,
    data: UpdatePersonInput,
    profilePicture?: File,
  ) => Promise<void>;
  onDeletePerson: (id: string) => Promise<void>;
}

interface EditFormState {
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
}

const emptyForm: EditFormState = {
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
};

function toFormState(person?: Person): EditFormState {
  if (!person) {
    return emptyForm;
  }

  return {
    fullName: person.fullName,
    phone: person.phone ?? '',
    email: person.email ?? '',
    gender: person.gender,
    occupation: person.occupation ?? '',
    state: person.state,
    city: person.city ?? '',
    area: person.area ?? '',
    notes: person.notes ?? '',
    profilePicture: person.profilePictureUrl ?? person.profilePicture ?? '',
    profilePictureFile: undefined,
    hasLogin: person.hasLogin,
  };
}

function optional(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export default function PersonDrawer({
  person,
  saving,
  error,
  onUpdatePerson,
  onDeletePerson,
}: PersonDrawerProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditFormState>(toFormState(person));

  useEffect(() => {
    setForm(toFormState(person));
    setEditing(false);
  }, [person]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!person) {
      return;
    }

    await onUpdatePerson(
      person.id,
      {
        fullName: form.fullName.trim(),
        phone: optional(form.phone),
        email: optional(form.email),
        gender: form.gender,
        occupation: optional(form.occupation),
        state: form.state.trim(),
        city: optional(form.city),
        area: optional(form.area),
        notes: optional(form.notes),
        profilePicture: form.profilePictureFile
          ? undefined
          : optional(form.profilePicture),
        hasLogin: form.hasLogin,
      },
      form.profilePictureFile,
    );

    setEditing(false);
  };

  return (
    <aside className="w-96 overflow-y-auto border-l border-slate-800 bg-slate-950 p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Person Details</h2>

        {person ? (
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl p-2 hover:bg-slate-900"
              onClick={() => setEditing((value) => !value)}
              title={editing ? 'Close edit' : 'Edit person'}
            >
              {editing ? <X size={18} /> : <Edit3 size={18} />}
            </button>

            <button
              className="rounded-xl p-2 text-red-300 hover:bg-red-950/40"
              onClick={() => onDeletePerson(person.id)}
              disabled={saving}
              title="Delete person"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-5 whitespace-pre-line rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {!person ? (
        <div className="mt-8 text-slate-400">
          Select a person from the graph to view details.
        </div>
      ) : editing ? (
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Field label="Full name">
            <input
              className="input"
              value={form.fullName}
              onChange={(event) =>
                setForm({ ...form, fullName: event.target.value })
              }
              required
            />
          </Field>

          <Field label="Phone">
            <input
              className="input"
              value={form.phone}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value })
              }
            />
          </Field>

          <Field label="Email">
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
            />
          </Field>

          <Field label="Gender">
            <select
              className="input"
              value={form.gender}
              onChange={(event) =>
                setForm({ ...form, gender: event.target.value as Gender })
              }
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>

          <Field label="Occupation">
            <input
              className="input"
              value={form.occupation}
              onChange={(event) =>
                setForm({ ...form, occupation: event.target.value })
              }
            />
          </Field>

          <Field label="State">
            <input
              className="input"
              value={form.state}
              onChange={(event) =>
                setForm({ ...form, state: event.target.value })
              }
              required
            />
          </Field>

          <Field label="City">
            <input
              className="input"
              value={form.city}
              onChange={(event) =>
                setForm({ ...form, city: event.target.value })
              }
            />
          </Field>

          <Field label="Area">
            <input
              className="input"
              value={form.area}
              onChange={(event) =>
                setForm({ ...form, area: event.target.value })
              }
            />
          </Field>

          <Field label="Profile Picture">
            <AvatarUpload
              value={form.profilePicture}
              name={form.fullName}
              onChange={(profilePicture, profilePictureFile) =>
                setForm({ ...form, profilePicture, profilePictureFile })
              }
            />
          </Field>

          <Field label="Notes">
            <textarea
              className="input min-h-24 resize-none"
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
            />
          </Field>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.hasLogin}
              onChange={(event) =>
                setForm({ ...form, hasLogin: event.target.checked })
              }
            />
            Create Login Account
          </label>

          <button
            className="w-full rounded-xl bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:opacity-60"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      ) : (
        <div className="mt-6">
          <div className="flex items-center gap-4">
            {(person.profilePictureUrl ?? person.profilePicture) ? (
              <img
                src={person.profilePictureUrl ?? person.profilePicture}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-lg font-semibold">
                {person.fullName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0].toUpperCase())
                  .join('')}
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold">{person.fullName}</h3>
              <p className="text-sm text-slate-400">
                {person.occupation || 'No occupation added'}
              </p>
            </div>
          </div>

          <dl className="mt-8 space-y-5">
            <Detail label="Phone" value={person.phone} />
            <Detail label="Email" value={person.email} />
            <Detail label="Gender" value={person.gender} />
            <Detail label="State" value={person.state} />
            <Detail label="City" value={person.city} />
            <Detail label="Area" value={person.area} />
            <Detail label="Notes" value={person.notes} />
          </dl>
        </div>
      )}
    </aside>
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

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-widest text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-slate-200">{value || 'Not added'}</dd>
    </div>
  );
}
