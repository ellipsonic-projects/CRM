'use client';

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { CalendarDays, MapPin, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AppHeader from '../../../components/layout/AppHeader';
import Sidebar from '../../../components/layout/Sidebar';
import ConfirmationDialog from '../../../components/ui/ConfirmationDialog';
import {
  getCurrentUser,
  logout as logoutSession,
} from '../../../services/auth.api';
import {
  getOrganization,
  Organization,
} from '../../../services/organizations.api';
import {
  createEvent,
  CreateEventInput,
  deleteEvent,
  Event,
  EventCategory,
  EventStatus,
  getEvents,
  updateEvent,
  UpdateEventInput,
} from '../../../services/events.api';

const eventCategories: EventCategory[] = [
  'Religious',
  'Social',
  'Community',
  'Educational',
  'Meeting',
  'Personal',
  'Other',
];

interface EventFormState {
  title: string;
  description: string;
  category: EventCategory;
  startDateTime: string;
  endDateTime: string;
  location: string;
  isCancelled: boolean;
  notes: string;
}

const emptyEventForm: EventFormState = {
  title: '',
  description: '',
  category: 'Other',
  startDateTime: '',
  endDateTime: '',
  location: '',
  isCancelled: false,
  notes: '',
};

function optional(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function toIsoDateTime(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(value).toISOString();
}

function toDateTimeInputValue(value?: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusClassName(status: EventStatus): string {
  switch (status) {
    case 'Ongoing':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
    case 'Completed':
      return 'border-slate-500/40 bg-slate-500/10 text-slate-200';
    case 'Cancelled':
      return 'border-red-500/40 bg-red-500/10 text-red-200';
    case 'Upcoming':
    default:
      return 'border-blue-500/40 bg-blue-500/10 text-blue-200';
  }
}

function toFormState(event: Event): EventFormState {
  return {
    title: event.title,
    description: event.description ?? '',
    category: event.category ?? 'Other',
    startDateTime: toDateTimeInputValue(event.startDateTime),
    endDateTime: toDateTimeInputValue(event.endDateTime),
    location: event.location ?? '',
    isCancelled: event.status === 'Cancelled',
    notes: event.notes ?? '',
  };
}

export default function EventsPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization>();
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event>();
  const [eventToDelete, setEventToDelete] = useState<Event>();
  const [form, setForm] = useState<EventFormState>(emptyEventForm);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return events;
    }

    return events.filter((event) =>
      [
        event.title,
        event.description,
        event.category,
        event.location,
        event.status,
        event.notes,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [events, search]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const data = await getEvents();
      setEvents(data);
    } catch (apiError) {
      setError(
        apiError instanceof Error ? apiError.message : 'Could not load events.',
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
        await loadEvents();
      } catch {
        router.replace('/login');
      }
    }

    void boot();
  }, [loadEvents, router]);

  const openCreateForm = () => {
    setEditingEvent(undefined);
    setForm(emptyEventForm);
    setError(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (event: Event) => {
    setEditingEvent(event);
    setForm(toFormState(event));
    setError(undefined);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEvent(undefined);
    setForm(emptyEventForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(undefined);

    const startDateTime = toIsoDateTime(form.startDateTime);

    if (!startDateTime) {
      setError('Start date and time is required.');
      setSaving(false);
      return;
    }

    const endDateTime = toIsoDateTime(form.endDateTime);
    const basePayload = {
      title: form.title.trim(),
      description: optional(form.description),
      category: form.category,
      startDateTime,
      endDateTime,
      location: optional(form.location),
      notes: optional(form.notes),
    };

    try {
      const saved = editingEvent
        ? await updateEvent(editingEvent.id, {
            ...basePayload,
            status: form.isCancelled ? 'Cancelled' : null,
          } satisfies UpdateEventInput)
        : await createEvent({
            ...basePayload,
            status: form.isCancelled ? 'Cancelled' : undefined,
          } satisfies CreateEventInput);

      setEvents((current) =>
        (editingEvent
          ? current.map((item) => (item.id === saved.id ? saved : item))
          : [...current, saved]
        ).sort((first, second) =>
          first.startDateTime.localeCompare(second.startDateTime),
        ),
      );
      closeForm();
      void loadEvents();
    } catch (apiError) {
      setError(
        apiError instanceof Error ? apiError.message : 'Could not save event.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToDelete) {
      return;
    }
    setSaving(true);
    setError(undefined);

    try {
      await deleteEvent(eventToDelete.id);
      setEvents((current) =>
        current.filter((item) => item.id !== eventToDelete.id),
      );
      setEventToDelete(undefined);
    } catch (apiError) {
      setError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not delete event.',
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
        onPrimaryAction={openCreateForm}
        primaryActionLabel="Add Event"
        searchPlaceholder="Search events, category, location, status..."
        onLogout={() => void handleLogout()}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar organization={organization} />

        <section className="flex-1 overflow-y-auto p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-blue-300">
                Events
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Organization Events
              </h1>
              <p className="mt-2 text-slate-400">
                Plan and manage event records without graph relationships.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-right">
              <p className="text-2xl font-semibold">{events.length}</p>
              <p className="text-sm text-slate-400">Total events</p>
            </div>
          </div>

          {error ? (
            <div className="mt-6 whitespace-pre-line rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
            {loading ? (
              <div className="p-10 text-center text-slate-400">
                Loading events...
              </div>
            ) : filteredEvents.length === 0 ? (
              <EmptyState
                hasEvents={events.length > 0}
                onCreate={openCreateForm}
              />
            ) : (
              <div className="divide-y divide-slate-800">
                {filteredEvents.map((event) => (
                  <article
                    key={event.id}
                    className="grid gap-4 p-5 transition hover:bg-slate-900/60 md:grid-cols-[1fr_auto]"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold">{event.title}</h2>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs ${statusClassName(
                            event.status,
                          )}`}
                        >
                          {event.status}
                        </span>
                        {event.category ? (
                          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                            {event.category}
                          </span>
                        ) : null}
                      </div>

                      {event.description ? (
                        <p className="mt-2 max-w-3xl text-sm text-slate-300">
                          {event.description}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-2">
                          <CalendarDays size={16} />
                          {formatDateTime(event.startDateTime)}
                          {event.endDateTime
                            ? ` - ${formatDateTime(event.endDateTime)}`
                            : ''}
                        </span>
                        {event.location ? (
                          <span className="flex items-center gap-2">
                            <MapPin size={16} />
                            {event.location}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <button
                        className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:bg-slate-800"
                        disabled={saving}
                        onClick={() => openEditForm(event)}
                        title="Edit event"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="rounded-lg border border-red-900/70 p-2 text-red-200 hover:bg-red-950/50"
                        disabled={saving}
                        onClick={() => setEventToDelete(event)}
                        title="Delete event"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <form
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-800 bg-slate-950 p-6 shadow-2xl"
            onSubmit={handleSubmit}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {editingEvent ? 'Edit Event' : 'Create Event'}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Capture event details for this organization.
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-900 hover:text-white"
                onClick={closeForm}
              >
                Close
              </button>
            </div>

            {error ? (
              <div className="mt-5 whitespace-pre-line rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Title">
                <input
                  className="input"
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Category">
                <select
                  className="input"
                  value={form.category}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      category: event.target.value as EventCategory,
                    })
                  }
                >
                  {eventCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Start date and time">
                <input
                  className="input"
                  type="datetime-local"
                  value={form.startDateTime}
                  onChange={(event) =>
                    setForm({ ...form, startDateTime: event.target.value })
                  }
                  required
                />
              </Field>

              <Field label="End date and time">
                <input
                  className="input"
                  type="datetime-local"
                  value={form.endDateTime}
                  onChange={(event) =>
                    setForm({ ...form, endDateTime: event.target.value })
                  }
                />
              </Field>

              <Field label="Location">
                <input
                  className="input"
                  value={form.location}
                  onChange={(event) =>
                    setForm({ ...form, location: event.target.value })
                  }
                />
              </Field>

              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                <label className="flex items-start gap-3 text-sm text-slate-300">
                  <input
                    className="mt-1"
                    type="checkbox"
                    checked={form.isCancelled}
                    onChange={(event) =>
                      setForm({ ...form, isCancelled: event.target.checked })
                    }
                  />
                  <span>
                    <span className="block font-medium text-slate-100">
                      Mark as cancelled
                    </span>
                    <span className="mt-1 block text-slate-400">
                      Upcoming, ongoing, and completed are calculated from the
                      event time.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-4 grid gap-4">
              <Field label="Description">
                <textarea
                  className="input min-h-24 resize-none"
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
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
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-900"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                className="rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:opacity-60"
                disabled={saving}
              >
                {saving
                  ? 'Saving...'
                  : editingEvent
                    ? 'Save Event'
                    : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {eventToDelete ? (
        <ConfirmationDialog
          title="Delete Event?"
          loading={saving}
          onCancel={() => setEventToDelete(undefined)}
          onConfirm={handleDelete}
        >
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
            <p className="font-medium text-slate-100">{eventToDelete.title}</p>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            This action cannot be undone.
          </p>
        </ConfirmationDialog>
      ) : null}
    </main>
  );
}

function EmptyState({
  hasEvents,
  onCreate,
}: {
  hasEvents: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-blue-300">
        <CalendarDays size={28} />
      </div>
      <h2 className="mt-5 text-lg font-semibold">
        {hasEvents ? 'No matching events' : 'No events yet'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
        {hasEvents
          ? 'Try a different search term to find an existing event.'
          : 'Create the first event for this organization. Participants and graph links can come later.'}
      </p>
      {!hasEvents ? (
        <button
          className="mt-6 rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500"
          onClick={onCreate}
        >
          Create Event
        </button>
      ) : null}
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
