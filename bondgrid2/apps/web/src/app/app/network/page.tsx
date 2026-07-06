'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '../../../components/layout/AppHeader';
import Sidebar from '../../../components/layout/Sidebar';
import GraphCanvas from '../../../components/layout/GraphCanvas';
import PersonDrawer from '../../../components/layout/PersonDrawer';
import GraphFiltersPanel from '../../../components/layout/GraphFiltersPanel';
import AddPersonDialog, {
  emptyPersonForm,
  PersonFormState,
} from '../../../components/layout/AddPersonDialog';
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
  getRelationships,
  getRelationshipTypes,
  Relationship,
  RelationshipTypeOption,
  updateRelationship as updateRelationshipApi,
  CreateRelationshipInput,
  UpdateRelationshipInput,
} from '../../../services/relationships.api';
import { validateCreatedPassword } from '../../../utils/password';
import {
  buildGraphFilterOptions,
  emptyGraphFilters,
  filterGraphData,
  GraphFilterState,
  pruneGraphFilters,
} from '../../../services/filter.service';

function optional(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

export default function NetworkPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization>();
  const [people, setPeople] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [selectedPersonRelationships, setSelectedPersonRelationships] =
    useState<Relationship[]>([]);
  const [relationshipTypes, setRelationshipTypes] = useState<
    RelationshipTypeOption[]
  >([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string>();
  const [filters, setFilters] = useState<GraphFilterState>(emptyGraphFilters);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
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
  const filterOptions = useMemo(
    () =>
      buildGraphFilterOptions(
        people,
        relationships,
        relationshipTypes,
        filters,
      ),
    [filters, people, relationships, relationshipTypes],
  );
  const filteredGraph = useMemo(
    () => filterGraphData(people, relationships, relationshipTypes, filters),
    [filters, people, relationships, relationshipTypes],
  );
  const graphRelationships = useMemo(() => {
    const selectedRelationshipById = new Map(
      selectedPersonRelationships.map((relationship) => [
        relationship.id,
        relationship,
      ]),
    );
    const resolvedRelationships = filteredGraph.relationships.map(
      (relationship) =>
        selectedRelationshipById.get(relationship.id) ?? relationship,
    );

    return resolvedRelationships.map((relationship) => {
      const selectedRelationship = selectedRelationshipById.get(
        relationship.id,
      );

      return {
        id: relationship.id,
        sourceId:
          selectedPersonId && selectedRelationship
            ? selectedPersonId
            : relationship.sourcePersonId,
        targetId:
          selectedPersonId && selectedRelationship
            ? selectedRelationship.relatedPerson.id
            : relationship.targetPersonId,
        label: relationship.displayLabel,
      };
    });
  }, [
    filteredGraph.relationships,
    selectedPersonId,
    selectedPersonRelationships,
  ]);

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

  const loadRelationships = useCallback(async () => {
    const data = await getRelationships();
    setRelationships(data);
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
        const loadedOrganization = await getOrganization(user.organizationId);
        const loadedRelationshipTypes = await getRelationshipTypes();
        setOrganization(loadedOrganization);
        setRelationshipTypes(loadedRelationshipTypes);
        await loadPeople();
        await loadRelationships();
      } catch {
        router.replace('/login');
      }
    }

    void boot();
  }, [loadPeople, loadRelationships, router]);

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

  useEffect(() => {
    const prunedFilters = pruneGraphFilters(filters, filterOptions);

    if (JSON.stringify(prunedFilters) !== JSON.stringify(filters)) {
      setFilters(prunedFilters);
    }
  }, [filterOptions, filters]);

  useEffect(() => {
    if (
      selectedPersonId &&
      !filteredGraph.people.some((person) => person.id === selectedPersonId)
    ) {
      setSelectedPersonId(undefined);
    }
  }, [filteredGraph.people, selectedPersonId]);

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
      setPeople((current) =>
        [...current, created].sort((first, second) =>
          first.fullName.localeCompare(second.fullName),
        ),
      );
      setSelectedPersonId(created.id);
      setForm(emptyPersonForm);
      setIsAddOpen(false);
      void loadPeople();
      void loadRelationships();
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
      void loadRelationships();
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
      void loadRelationships();
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

  const refreshRelationshipViews = async (personId?: string) => {
    await loadRelationships();

    if (personId) {
      await loadSelectedPersonRelationships(personId);
    }
  };

  const handleCreateRelationship = async (
    data: CreateRelationshipInput,
  ): Promise<void> => {
    setSaving(true);
    setDrawerError(undefined);

    try {
      await createRelationship(data);
      await refreshRelationshipViews(
        data.selectedPersonId ?? data.sourcePersonId,
      );
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
  ): Promise<void> => {
    setSaving(true);
    setDrawerError(undefined);

    try {
      const updated = await updateRelationshipApi(id, data);
      await refreshRelationshipViews(
        selectedPersonId ?? updated.sourcePersonId,
      );
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

  const handleDeleteRelationship = async (id: string): Promise<void> => {
    setSaving(true);
    setDrawerError(undefined);

    try {
      await deleteRelationship(id);
      await refreshRelationshipViews(selectedPersonId);
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

  return (
    <main className="h-screen bg-[#0B1220] text-white flex flex-col">
      <AppHeader
        search={filters.search}
        onSearchChange={(search) => setFilters({ ...filters, search })}
        onAddPerson={() => setIsAddOpen(true)}
        onLogout={() => void handleLogout()}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar organization={organization} />

        <GraphFiltersPanel
          collapsed={filtersCollapsed}
          filters={filters}
          options={filterOptions}
          totalPeople={people.length}
          visiblePeople={filteredGraph.people.length}
          visibleRelationships={filteredGraph.relationships.length}
          onCollapsedChange={setFiltersCollapsed}
          onFiltersChange={setFilters}
          onClear={() => setFilters(emptyGraphFilters)}
        />

        <GraphCanvas
          people={filteredGraph.people}
          selectedPersonId={selectedPersonId}
          loading={loading}
          error={error}
          relationships={graphRelationships}
          onSelectPerson={(person) => setSelectedPersonId(person.id)}
          onRetry={() => void loadPeople()}
        />

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
          description="Create a person profile for this organization graph."
          onClose={() => setIsAddOpen(false)}
          onChange={setForm}
          onSubmit={handleCreatePerson}
        />
      ) : null}
    </main>
  );
}
