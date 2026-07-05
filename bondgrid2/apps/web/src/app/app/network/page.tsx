'use client';

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '../../../components/layout/AppHeader';
import Sidebar from '../../../components/layout/Sidebar';
import GraphCanvas from '../../../components/layout/GraphCanvas';
import PersonDrawer from '../../../components/layout/PersonDrawer';
import AvatarUpload from '../../../components/form/AvatarUpload';
import PasswordInput from '../../../components/form/PasswordInput';
import {
  getCurrentUser,
  logout as logoutSession,
} from '../../../services/auth.api';
import {
  getOrganization,
  Organization,
} from '../../../services/organizations.api';
import {
  createPerson,
  deletePerson,
  getPeople,
  updatePerson,
  CreatePersonInput,
  Gender,
  Person,
  UpdatePersonInput,
} from '../../../services/people.api';

interface PersonFormState {
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

const emptyPersonForm: PersonFormState = {
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

function optional(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
}

function generateUsername(name: string, people: Person[]): string {
  const base = slugifyName(name) || 'person';
  const similarNames = people.filter(
    (person) => slugifyName(person.fullName) === base,
  ).length;

  return similarNames > 0 ? `${base}${similarNames + 1}` : base;
}

function generatePassword(): string {
  const alphabet =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = new Uint8Array(14);
  window.crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) => alphabet[byte % alphabet.length])
    .join('');
}

export default function NetworkPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization>();
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>();
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [drawerError, setDrawerError] = useState<string>();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<PersonFormState>(emptyPersonForm);

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedPersonId),
    [people, selectedPersonId],
  );

  const loadPeople = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const data = await getPeople();
      setPeople(data);
      setSelectedPersonId((currentId) =>
        currentId && data.some((person) => person.id === currentId)
          ? currentId
          : undefined,
      );
    } catch (apiError) {
      setError(
        apiError instanceof Error ? apiError.message : 'Could not load people.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function boot() {
      try {
        const user = await getCurrentUser();
        const loadedOrganization = await getOrganization(user.organizationId);
        setOrganization(loadedOrganization);
        await loadPeople();
      } catch {
        router.replace('/login');
      }
    }

    void boot();
  }, [loadPeople, router]);

  const handleCreatePerson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(undefined);

    if (
      form.hasLogin &&
      form.temporaryPassword !== form.confirmTemporaryPassword
    ) {
      setError('Temporary password and confirm password must match.');
      setSaving(false);
      return;
    }

    const payload: CreatePersonInput = {
      fullName: form.fullName.trim(),
      phone: optional(form.phone),
      email: optional(form.email),
      gender: form.gender,
      occupation: optional(form.occupation),
      state: form.state.trim(),
      city: optional(form.city),
      area: optional(form.area),
      notes: optional(form.notes),
      hasLogin: form.hasLogin,
    };

    try {
      const created = await createPerson(payload, form.profilePictureFile);
      setPeople((current) =>
        [...current, created].sort((first, second) =>
          first.fullName.localeCompare(second.fullName),
        ),
      );
      setSelectedPersonId(created.id);
      setForm(emptyPersonForm);
      setIsAddOpen(false);
      void loadPeople();
    } catch (apiError) {
      setError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not create person.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePerson = async (
    id: string,
    data: UpdatePersonInput,
    profilePicture?: File,
  ) => {
    setSaving(true);
    setDrawerError(undefined);

    try {
      const updated = await updatePerson(id, data, profilePicture);
      setPeople((current) =>
        current
          .map((person) => (person.id === updated.id ? updated : person))
          .sort((first, second) =>
            first.fullName.localeCompare(second.fullName),
          ),
      );
      setSelectedPersonId(updated.id);
      void loadPeople();
    } catch (apiError) {
      setDrawerError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not update person.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePerson = async (id: string) => {
    setSaving(true);
    setDrawerError(undefined);

    try {
      await deletePerson(id);
      setPeople((current) => current.filter((person) => person.id !== id));
      setSelectedPersonId(undefined);
      void loadPeople();
    } catch (apiError) {
      setDrawerError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not delete person.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logoutSession();
    router.replace('/login');
  };

  return (
    <main className="h-screen bg-[#0B1220] text-white flex flex-col">
      <AppHeader
        search={search}
        onSearchChange={setSearch}
        onAddPerson={() => setIsAddOpen(true)}
        onLogout={() => void handleLogout()}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar organization={organization} />

        <GraphCanvas
          people={people}
          selectedPersonId={selectedPersonId}
          loading={loading}
          error={error}
          onSelectPerson={(person) => setSelectedPersonId(person.id)}
          onRetry={() => void loadPeople()}
        />

        <PersonDrawer
          person={selectedPerson}
          saving={saving}
          error={drawerError}
          onUpdatePerson={handleUpdatePerson}
          onDeletePerson={handleDeletePerson}
        />
      </div>

      {isAddOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <form
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
            onSubmit={handleCreatePerson}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Add Person</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Create a person profile for this organization graph.
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-white"
                onClick={() => setIsAddOpen(false)}
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
              <h3 className="font-semibold text-slate-100">
                Person Information
              </h3>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Full name">
                  <input
                    className="input"
                    value={form.fullName}
                    onChange={(event) => {
                      const fullName = event.target.value;
                      setForm((current) => ({
                        ...current,
                        fullName,
                        username:
                          current.username === '' ||
                          current.username ===
                            generateUsername(current.fullName, people)
                            ? generateUsername(fullName, people)
                            : current.username,
                      }));
                    }}
                    required
                  />
                </Field>

                <Field label="Gender">
                  <select
                    className="input"
                    value={form.gender}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        gender: event.target.value as Gender,
                      })
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
              </div>

              <div className="mt-4">
                <Field label="Profile Picture">
                  <AvatarUpload
                    value={form.profilePicture}
                    name={form.fullName}
                    onChange={(profilePicture, profilePictureFile) =>
                      setForm({
                        ...form,
                        profilePicture,
                        profilePictureFile,
                      })
                    }
                  />
                </Field>
              </div>

              <Field label="Notes">
                <textarea
                  className="input mt-2 min-h-24 resize-none"
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                />
              </Field>
            </section>

            <section className="mt-5 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-slate-100">
                    Account Access
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Optionally prepare login details for this person.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.hasLogin}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        hasLogin: event.target.checked,
                        username:
                          current.username ||
                          generateUsername(current.fullName, people),
                      }))
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
                        setForm({
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
                        setForm({ ...form, username: event.target.value })
                      }
                      required={form.hasLogin}
                    />
                  </Field>

                  <Field label="Temporary Password">
                    <div className="flex gap-2">
                      <PasswordInput
                        className="input"
                        value={form.temporaryPassword}
                        onChange={(event) =>
                          setForm({
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
                          const password = generatePassword();
                          setForm({
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
                      onChange={(event) =>
                        setForm({
                          ...form,
                          confirmTemporaryPassword: event.target.value,
                        })
                      }
                      required={form.hasLogin}
                    />
                  </Field>

                  <p className="md:col-span-2 text-sm text-slate-500">
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
                onClick={() => setIsAddOpen(false)}
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
      ) : null}
    </main>
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
