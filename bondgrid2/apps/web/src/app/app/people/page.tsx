'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Edit3, Trash2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppHeader from '../../../components/layout/AppHeader';
import Sidebar from '../../../components/layout/Sidebar';
import PersonDrawer from '../../../components/layout/PersonDrawer';
import AddPersonDialog, {
  emptyPersonForm,
  PersonFormState,
} from '../../../components/layout/AddPersonDialog';
import PeopleImportDialog from '../../../components/layout/PeopleImportDialog';
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
  Person,
  UpdatePersonInput,
} from '../../../services/people.api';
import {
  createRelationship,
  deleteRelationship,
  getPersonRelationships,
  getRelationshipTypes,
  Relationship,
  RelationshipTypeOption,
  updateRelationship as updateRelationshipApi,
  CreateRelationshipInput,
  UpdateRelationshipInput,
} from '../../../services/relationships.api';
import { validateCreatedPassword } from '../../../utils/password';
import {
  downloadPeopleCsv,
  downloadPeopleXlsx,
  ImportPreviewResult,
} from '../../../utils/people-import-export';

const PAGE_SIZE = 10;

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getProfilePicture(person: Person): string | undefined {
  return person.profilePictureUrl ?? person.profilePicture;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function matchesSearch(person: Person, search: string): boolean {
  const query = search.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [
    person.fullName,
    person.phone,
    person.email,
    person.occupation,
    person.state,
    person.city,
    person.area,
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(query));
}

export default function PeoplePage() {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization>();
  const [people, setPeople] = useState<Person[]>([]);
  const [relationshipTypes, setRelationshipTypes] = useState<
    RelationshipTypeOption[]
  >([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>();
  const [selectedPersonRelationships, setSelectedPersonRelationships] =
    useState<Relationship[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [drawerError, setDrawerError] = useState<string>();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importedRows, setImportedRows] = useState(0);
  const [form, setForm] = useState<PersonFormState>(emptyPersonForm);

  const selectedPerson = useMemo(
    () => people.find((person) => person.id === selectedPersonId),
    [people, selectedPersonId],
  );
  const filteredPeople = useMemo(
    () =>
      people
        .filter((person) => matchesSearch(person, search))
        .sort((first, second) => first.fullName.localeCompare(second.fullName)),
    [people, search],
  );
  const totalPages = Math.max(1, Math.ceil(filteredPeople.length / PAGE_SIZE));
  const paginatedPeople = filteredPeople.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
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

  const loadSelectedPersonRelationships = useCallback(
    async (personId: string) => {
      const data = await getPersonRelationships(personId);
      setSelectedPersonRelationships(data);
    },
    [],
  );

  useEffect(() => {
    async function boot() {
      try {
        const user = await getCurrentUser();
        const [loadedOrganization, loadedRelationshipTypes] = await Promise.all(
          [getOrganization(user.organizationId), getRelationshipTypes()],
        );
        setOrganization(loadedOrganization);
        setRelationshipTypes(loadedRelationshipTypes);
        await loadPeople();
      } catch {
        router.replace('/login');
      }
    }

    void boot();
  }, [loadPeople, router]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    if (!selectedPersonId) {
      setSelectedPersonRelationships([]);
      return;
    }

    void loadSelectedPersonRelationships(selectedPersonId).catch((apiError) => {
      setDrawerError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not load relationships.',
      );
    });
  }, [loadSelectedPersonRelationships, selectedPersonId]);

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

    if (form.hasLogin) {
      const passwordError = validateCreatedPassword(form.temporaryPassword);

      if (passwordError) {
        setError(passwordError);
        setSaving(false);
        return;
      }
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
      setPeople((current) => [...current, created]);
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
        current.map((person) => (person.id === updated.id ? updated : person)),
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

  const refreshRelationships = async (personId?: string) => {
    if (personId) {
      await loadSelectedPersonRelationships(personId);
    }
  };

  const handleCreateRelationship = async (data: CreateRelationshipInput) => {
    setSaving(true);
    setDrawerError(undefined);

    try {
      await createRelationship(data);
      await refreshRelationships(data.selectedPersonId ?? data.sourcePersonId);
    } catch (apiError) {
      setDrawerError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not create relationship.',
      );
      throw apiError;
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRelationship = async (
    id: string,
    data: UpdateRelationshipInput,
  ) => {
    setSaving(true);
    setDrawerError(undefined);

    try {
      const updated = await updateRelationshipApi(id, data);
      await refreshRelationships(selectedPersonId ?? updated.sourcePersonId);
    } catch (apiError) {
      setDrawerError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not update relationship.',
      );
      throw apiError;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRelationship = async (id: string) => {
    setSaving(true);
    setDrawerError(undefined);

    try {
      await deleteRelationship(id);
      await refreshRelationships(selectedPersonId);
    } catch (apiError) {
      setDrawerError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not delete relationship.',
      );
      throw apiError;
    } finally {
      setSaving(false);
    }
  };

  const handleImportPeople = async (preview: ImportPreviewResult) => {
    const validPeople = preview.rows
      .map((row) => row.person)
      .filter((person): person is CreatePersonInput => Boolean(person));

    setSaving(true);
    setError(undefined);
    setImportedRows(0);

    try {
      let imported = 0;

      for (const person of validPeople) {
        await createPerson(person);
        imported += 1;
        setImportedRows(imported);
      }

      await loadPeople();
    } catch (apiError) {
      setError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not import people.',
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
    <main className="flex h-screen flex-col bg-[#0B1220] text-white">
      <AppHeader
        search={search}
        onSearchChange={setSearch}
        onAddPerson={() => setIsAddOpen(true)}
        onLogout={() => void handleLogout()}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar organization={organization} />

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-900">
          <div className="border-b border-slate-800 bg-slate-950/70 px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-semibold">People</h1>
                <p className="mt-1 text-sm text-slate-400">
                  {filteredPeople.length} of {people.length} people
                </p>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                  onClick={() => {
                    setImportedRows(0);
                    setIsImportOpen(true);
                  }}
                >
                  <UploadCloud size={16} />
                  Import
                </button>
                <ExportButton
                  label="Export All CSV"
                  disabled={people.length === 0}
                  onClick={() => downloadPeopleCsv(people, 'people-all.csv')}
                />
                <ExportButton
                  label="Export All XLSX"
                  disabled={people.length === 0}
                  onClick={() => downloadPeopleXlsx(people, 'people-all.xlsx')}
                />
                <ExportButton
                  label="Export Filtered CSV"
                  disabled={filteredPeople.length === 0}
                  onClick={() =>
                    downloadPeopleCsv(filteredPeople, 'people-filtered.csv')
                  }
                />
                <ExportButton
                  label="Export Filtered XLSX"
                  disabled={filteredPeople.length === 0}
                  onClick={() =>
                    downloadPeopleXlsx(filteredPeople, 'people-filtered.xlsx')
                  }
                />
              </div>
            </div>
          </div>

          {error ? (
            <div className="m-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex-1 overflow-auto p-6">
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-900/70 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Person</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Occupation</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Login</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {loading ? (
                    <tr>
                      <td
                        className="px-4 py-10 text-center text-slate-400"
                        colSpan={8}
                      >
                        Loading people...
                      </td>
                    </tr>
                  ) : paginatedPeople.length === 0 ? (
                    <tr>
                      <td
                        className="px-4 py-10 text-center text-slate-400"
                        colSpan={8}
                      >
                        No people found.
                      </td>
                    </tr>
                  ) : (
                    paginatedPeople.map((person) => (
                      <tr
                        key={person.id}
                        className="cursor-pointer transition hover:bg-slate-900/70"
                        onClick={() => setSelectedPersonId(person.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar person={person} />
                            <div>
                              <p className="font-medium text-slate-100">
                                {person.fullName}
                              </p>
                              <p className="text-xs text-slate-500">
                                {person.area || 'No area'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {person.phone || 'Not added'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {person.email ? (
                            <a
                              href={`mailto:${person.email}`}
                              className="text-blue-400 hover:underline"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {person.email}
                            </a>
                          ) : (
                            'Not added'
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {person.occupation || 'Not added'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {person.state}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {person.city || 'Not added'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              person.hasLogin
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {person.hasLogin ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedPersonId(person.id);
                              }}
                              title="Edit person"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              className="rounded-lg p-2 text-red-300 hover:bg-red-950/40"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDeletePerson(person.id);
                              }}
                              title="Delete person"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900 disabled:opacity-40"
                  disabled={page === 1}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                >
                  Previous
                </button>
                <button
                  className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900 disabled:opacity-40"
                  disabled={page === totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(current + 1, totalPages))
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </section>

        <PersonDrawer
          person={selectedPerson}
          saving={saving}
          error={drawerError}
          people={people}
          relationships={selectedPersonRelationships}
          relationshipTypes={relationshipTypes}
          onUpdatePerson={handleUpdatePerson}
          onDeletePerson={handleDeletePerson}
          onCreateRelationship={handleCreateRelationship}
          onUpdateRelationship={handleUpdateRelationship}
          onDeleteRelationship={handleDeleteRelationship}
          onSelectPerson={(nextPerson) => setSelectedPersonId(nextPerson.id)}
        />
      </div>

      {isAddOpen ? (
        <AddPersonDialog
          form={form}
          people={people}
          saving={saving}
          error={error}
          onClose={() => setIsAddOpen(false)}
          onChange={setForm}
          onSubmit={handleCreatePerson}
        />
      ) : null}

      {isImportOpen ? (
        <PeopleImportDialog
          saving={saving}
          importedRows={importedRows}
          onClose={() => setIsImportOpen(false)}
          onImport={handleImportPeople}
        />
      ) : null}
    </main>
  );
}

function ExportButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
      disabled={disabled}
      onClick={onClick}
    >
      <Download size={16} />
      {label}
    </button>
  );
}

function Avatar({ person }: { person: Person }) {
  const image = getProfilePicture(person);

  if (image) {
    return (
      <img src={image} alt="" className="h-11 w-11 rounded-full object-cover" />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold">
      {getInitials(person.fullName)}
    </div>
  );
}
