import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { Edit3, Plus, Trash2, X } from 'lucide-react';
import { Person, UpdatePersonInput, Gender } from '../../services/people.api';
import {
  CreateRelationshipInput,
  Relationship,
  RelationshipTypeOption,
  UpdateRelationshipInput,
} from '../../services/relationships.api';
import AvatarUpload from '../form/AvatarUpload';

interface PersonDrawerProps {
  person?: Person;
  people: Person[];
  relationships: Relationship[];
  relationshipTypes: RelationshipTypeOption[];
  saving: boolean;
  error?: string;
  onUpdatePerson: (
    id: string,
    data: UpdatePersonInput,
    profilePicture?: File,
  ) => Promise<void>;
  onDeletePerson: (id: string) => Promise<void>;
  onCreateRelationship: (data: CreateRelationshipInput) => Promise<void>;
  onUpdateRelationship: (
    id: string,
    data: UpdateRelationshipInput,
  ) => Promise<void>;
  onDeleteRelationship: (id: string) => Promise<void>;
  onSelectPerson: (person: Person) => void;
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

interface RelationshipFormState {
  relationshipOptionId: string;
  relatedPersonId: string;
  notes: string;
  search: string;
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

const emptyRelationshipForm: RelationshipFormState = {
  relationshipOptionId: '',
  relatedPersonId: '',
  notes: '',
  search: '',
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
  people,
  relationships,
  relationshipTypes,
  saving,
  error,
  onUpdatePerson,
  onDeletePerson,
  onCreateRelationship,
  onUpdateRelationship,
  onDeleteRelationship,
  onSelectPerson,
}: PersonDrawerProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditFormState>(toFormState(person));
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [editingRelationshipId, setEditingRelationshipId] = useState<string>();
  const [relationshipForm, setRelationshipForm] =
    useState<RelationshipFormState>(emptyRelationshipForm);
  const [relationshipToDelete, setRelationshipToDelete] =
    useState<Relationship>();

  useEffect(() => {
    setForm(toFormState(person));
    setEditing(false);
    setIsAddingRelationship(false);
    setEditingRelationshipId(undefined);
    setRelationshipForm(emptyRelationshipForm);
    setRelationshipToDelete(undefined);
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

  const selectablePeople = people.filter(
    (candidate) => candidate.id !== person?.id,
  );
  const editingRelationship = relationships.find(
    (relationship) => relationship.id === editingRelationshipId,
  );
  const relationshipFormPeople = editingRelationship
    ? people.filter(
        (candidate) => candidate.id !== editingRelationship.sourcePersonId,
      )
    : selectablePeople;
  const filteredRelationshipPeople = relationshipFormPeople.filter(
    (candidate) => {
      const search = relationshipForm.search.trim().toLowerCase();

      if (!search) {
        return true;
      }

      return [candidate.fullName, candidate.phone, candidate.email]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(search));
    },
  );
  const groupedRelationshipTypes = relationshipTypes.reduce(
    (groups, type) => {
      const group = type.group ?? 'Custom';
      groups[group] = [...(groups[group] ?? []), type];
      return groups;
    },
    {} as Record<string, RelationshipTypeOption[]>,
  );

  const startAddRelationship = () => {
    setEditingRelationshipId(undefined);
    setRelationshipForm({
      ...emptyRelationshipForm,
      relationshipOptionId: relationshipTypes[0]?.id ?? '',
    });
    setIsAddingRelationship(true);
  };

  const startEditRelationship = (relationship: Relationship) => {
    setIsAddingRelationship(false);
    setEditingRelationshipId(relationship.id);
    setRelationshipForm({
      relationshipOptionId:
        typeof relationship.metadata.relationshipOptionId === 'string'
          ? relationship.metadata.relationshipOptionId
          : (relationshipTypes.find(
              (type) => type.canonicalId === relationship.type,
            )?.id ?? ''),
      relatedPersonId: relationship.relatedPerson.id,
      notes: relationship.notes ?? '',
      search: '',
    });
  };

  const cancelRelationshipForm = () => {
    setIsAddingRelationship(false);
    setEditingRelationshipId(undefined);
    setRelationshipForm(emptyRelationshipForm);
  };

  const handleRelationshipSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !person ||
      !relationshipForm.relationshipOptionId ||
      !relationshipForm.relatedPersonId
    ) {
      return;
    }

    if (editingRelationshipId) {
      await onUpdateRelationship(editingRelationshipId, {
        relationshipOptionId: relationshipForm.relationshipOptionId,
        selectedPersonId: person.id,
        relatedPersonId: relationshipForm.relatedPersonId,
        notes: optional(relationshipForm.notes),
      });
    } else {
      await onCreateRelationship({
        relationshipOptionId: relationshipForm.relationshipOptionId,
        selectedPersonId: person.id,
        relatedPersonId: relationshipForm.relatedPersonId,
        notes: optional(relationshipForm.notes),
      });
    }

    cancelRelationshipForm();
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

          <section className="mt-8 border-t border-slate-800 pt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold text-slate-100">Relationships</h3>
              <button
                className="rounded-lg p-2 text-slate-300 hover:bg-slate-900"
                onClick={startAddRelationship}
                disabled={saving || selectablePeople.length === 0}
                title="Add relationship"
              >
                <Plus size={18} />
              </button>
            </div>

            {selectablePeople.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                Add another person before creating relationships.
              </p>
            ) : null}

            {isAddingRelationship || editingRelationshipId ? (
              <RelationshipForm
                saving={saving}
                form={relationshipForm}
                people={relationshipFormPeople}
                filteredPeople={filteredRelationshipPeople}
                groupedRelationshipTypes={groupedRelationshipTypes}
                relationshipTypes={relationshipTypes}
                submitLabel={
                  editingRelationshipId
                    ? 'Save Relationship'
                    : 'Create Relationship'
                }
                onCancel={cancelRelationshipForm}
                onChange={setRelationshipForm}
                onSubmit={handleRelationshipSubmit}
              />
            ) : null}

            {relationships.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-center">
                <p className="font-medium text-slate-200">
                  No relationships yet.
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Create the first relationship to connect this person to
                  others.
                </p>
                <button
                  className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
                  onClick={startAddRelationship}
                  disabled={saving || selectablePeople.length === 0}
                >
                  Add Relationship
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {relationships.map((relationship) => (
                  <article
                    role="button"
                    tabIndex={0}
                    key={relationship.id}
                    className="w-full cursor-pointer rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-left transition hover:border-blue-700 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => onSelectPerson(relationship.relatedPerson)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onSelectPerson(relationship.relatedPerson);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar person={relationship.relatedPerson} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {relationship.relatedPerson.fullName}
                        </p>
                        <p className="text-sm font-medium text-slate-100">
                          {relationship.displayLabel}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {relationship.relatedPerson.phone ?? 'No phone'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {[
                            relationship.relatedPerson.city,
                            relationship.relatedPerson.state,
                          ]
                            .filter(Boolean)
                            .join(', ') || 'No location'}
                        </p>
                        {relationship.notes ? (
                          <p className="mt-2 text-xs text-slate-500">
                            {relationship.notes}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                          onClick={(event) => {
                            event.stopPropagation();
                            startEditRelationship(relationship);
                          }}
                          disabled={saving}
                          title="Edit relationship"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-red-300 hover:bg-red-950/40"
                          onClick={(event) => {
                            event.stopPropagation();
                            setRelationshipToDelete(relationship);
                          }}
                          disabled={saving}
                          title="Delete relationship"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {relationshipToDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold">Delete Relationship?</h3>
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <p className="font-medium text-slate-100">
                {relationshipToDelete.sourcePerson.fullName}
              </p>
              <p className="my-2 text-sm text-slate-400">
                {relationshipToDelete.displayLabel}
              </p>
              <p className="font-medium text-slate-100">
                {relationshipToDelete.targetPerson.fullName}
              </p>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-xl border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-900"
                onClick={() => setRelationshipToDelete(undefined)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="rounded-xl bg-red-600 px-4 py-2 font-medium hover:bg-red-500 disabled:opacity-60"
                disabled={saving}
                onClick={async () => {
                  await onDeleteRelationship(relationshipToDelete.id);
                  setRelationshipToDelete(undefined);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}

function RelationshipForm({
  saving,
  form,
  people,
  filteredPeople,
  groupedRelationshipTypes,
  relationshipTypes,
  submitLabel,
  onCancel,
  onChange,
  onSubmit,
}: {
  saving: boolean;
  form: RelationshipFormState;
  people: Person[];
  filteredPeople: Person[];
  groupedRelationshipTypes: Record<string, RelationshipTypeOption[]>;
  relationshipTypes: RelationshipTypeOption[];
  submitLabel: string;
  onCancel: () => void;
  onChange: (form: RelationshipFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-3"
      onSubmit={onSubmit}
    >
      <div className="space-y-3">
        <Field label="Relationship Type">
          <select
            className="input"
            value={form.relationshipOptionId}
            onChange={(event) =>
              onChange({
                ...form,
                relationshipOptionId: event.target.value,
              })
            }
            required
          >
            {Object.entries(groupedRelationshipTypes).map(([group, types]) => (
              <optgroup key={group} label={group}>
                {types.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <Field label="Existing Person">
          <input
            className="input mb-2"
            placeholder="Search by name, phone, or email"
            value={form.search}
            onChange={(event) =>
              onChange({ ...form, search: event.target.value })
            }
          />
          <select
            className="input"
            value={form.relatedPersonId}
            onChange={(event) =>
              onChange({ ...form, relatedPersonId: event.target.value })
            }
            required
          >
            <option value="">Select a person</option>
            {filteredPeople.map((person) => (
              <option key={person.id} value={person.id}>
                {[person.fullName, person.phone, person.email]
                  .filter(Boolean)
                  .join(' • ')}
              </option>
            ))}
          </select>
          {filteredPeople.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              No existing people match your search.
            </p>
          ) : null}
        </Field>

        <Field label="Notes">
          <textarea
            className="input min-h-20 resize-none"
            value={form.notes}
            onChange={(event) =>
              onChange({ ...form, notes: event.target.value })
            }
          />
        </Field>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Avatar({ person }: { person: Person }) {
  const image = person.profilePictureUrl ?? person.profilePicture;

  if (image) {
    return (
      <img
        src={image}
        alt=""
        className="h-11 w-11 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
      {person.fullName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('')}
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
