'use client';

import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppHeader from '../../../components/layout/AppHeader';
import Sidebar from '../../../components/layout/Sidebar';
import ConfirmationDialog from '../../../components/ui/ConfirmationDialog';
import {
  createUser,
  getCurrentUser,
  getUsers,
  logout as logoutSession,
  Role,
  updateUserRole,
  User,
} from '../../../services/auth.api';
import {
  deleteOrganization,
  getOrganization,
  Organization,
  updateOrganization,
} from '../../../services/organizations.api';

const roles: Role[] = ['ADMIN', 'VOLUNTEER', 'VIEWER'];
const tabs = [
  'Organization',
  'User Management',
  'Appearance',
  'Import/Export',
  'Audit Logs',
  'Danger Zone',
] as const;

type SettingsTab = (typeof tabs)[number];

interface OrganizationForm {
  name: string;
  organizationType: string;
  phone: string;
  email: string;
  state: string;
  city: string;
  area: string;
}

interface UserForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

const emptyUserForm: UserForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'VIEWER',
};

function toOrganizationForm(organization?: Organization): OrganizationForm {
  return {
    name: organization?.name ?? '',
    organizationType: organization?.organizationType ?? '',
    phone: organization?.phone ?? '',
    email: organization?.email ?? '',
    state: organization?.state ?? '',
    city: organization?.city ?? '',
    area: organization?.area ?? '',
  };
}

function optional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('Organization');
  const [organization, setOrganization] = useState<Organization>();
  const [organizationForm, setOrganizationForm] =
    useState<OrganizationForm>(toOrganizationForm());
  const [users, setUsers] = useState<User[]>([]);
  const [userForm, setUserForm] = useState<UserForm>(emptyUserForm);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) =>
      [user.fullName, user.email, user.phone, user.role].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [search, users]);

  useEffect(() => {
    async function boot() {
      try {
        const currentUser = await getCurrentUser();
        const [loadedOrganization, loadedUsers] = await Promise.all([
          getOrganization(currentUser.organizationId),
          getUsers(),
        ]);
        setOrganization(loadedOrganization);
        setOrganizationForm(toOrganizationForm(loadedOrganization));
        setUsers(loadedUsers);
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }

    void boot();
  }, [router]);

  const handleLogout = async () => {
    await logoutSession();
    router.replace('/login');
  };

  const handleOrganizationSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const updated = await updateOrganization({
        name: organizationForm.name.trim(),
        organizationType: organizationForm.organizationType.trim(),
        phone: optional(organizationForm.phone),
        email: optional(organizationForm.email),
        state: organizationForm.state.trim(),
        city: optional(organizationForm.city),
        area: optional(organizationForm.area),
      });
      setOrganization(updated);
      setOrganizationForm(toOrganizationForm(updated));
      setSuccess('Organization settings saved.');
    } catch (apiError) {
      setError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not update organization.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const user = await createUser({
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim(),
        phone: userForm.phone.trim(),
        password: userForm.password,
        role: userForm.role,
      });
      setUsers((current) => [...current, user]);
      setUserForm(emptyUserForm);
      setSuccess('User created.');
    } catch (apiError) {
      setError(
        apiError instanceof Error ? apiError.message : 'Could not create user.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (userId: string, role: Role) => {
    setSaving(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      const updated = await updateUserRole(userId, role);
      setUsers((current) =>
        current.map((user) => (user.id === updated.id ? updated : user)),
      );
      setSuccess('User role updated.');
    } catch (apiError) {
      setError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not update user role.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrganization = async () => {
    setSaving(true);
    setError(undefined);

    try {
      await deleteOrganization();
      await logoutSession().catch(() => undefined);
      router.replace('/login');
    } catch (apiError) {
      setError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not delete organization.',
      );
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  return (
    <main className="h-screen bg-[#0B1220] text-white flex flex-col">
      <AppHeader
        search={search}
        onSearchChange={setSearch}
        onPrimaryAction={() => setActiveTab('User Management')}
        primaryActionLabel="Add User"
        searchPlaceholder="Search users..."
        onLogout={() => void handleLogout()}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar organization={organization} />

        <section className="flex-1 overflow-y-auto p-6">
          <div>
            <p className="text-sm uppercase tracking-widest text-blue-300">
              Settings
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Organization Settings
            </h1>
            <p className="mt-2 text-slate-400">
              Manage organization details, users, appearance, import/export,
              audit access, and destructive actions.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  activeTab === tab
                    ? 'border-blue-500 bg-blue-600 text-white'
                    : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {error ? (
            <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-6 rounded-lg border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-10 text-center text-slate-400">
              Loading settings...
            </div>
          ) : (
            <div className="mt-6">
              {activeTab === 'Organization' ? (
                <Panel title="Organization">
                  <form
                    className="grid gap-4 md:grid-cols-2"
                    onSubmit={handleOrganizationSubmit}
                  >
                    <Field label="Name">
                      <input
                        className="input"
                        value={organizationForm.name}
                        onChange={(event) =>
                          setOrganizationForm({
                            ...organizationForm,
                            name: event.target.value,
                          })
                        }
                        required
                      />
                    </Field>
                    <Field label="Type">
                      <input
                        className="input"
                        value={organizationForm.organizationType}
                        onChange={(event) =>
                          setOrganizationForm({
                            ...organizationForm,
                            organizationType: event.target.value,
                          })
                        }
                        required
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        className="input"
                        value={organizationForm.phone}
                        onChange={(event) =>
                          setOrganizationForm({
                            ...organizationForm,
                            phone: event.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        className="input"
                        value={organizationForm.email}
                        onChange={(event) =>
                          setOrganizationForm({
                            ...organizationForm,
                            email: event.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="State">
                      <input
                        className="input"
                        value={organizationForm.state}
                        onChange={(event) =>
                          setOrganizationForm({
                            ...organizationForm,
                            state: event.target.value,
                          })
                        }
                        required
                      />
                    </Field>
                    <Field label="City">
                      <input
                        className="input"
                        value={organizationForm.city}
                        onChange={(event) =>
                          setOrganizationForm({
                            ...organizationForm,
                            city: event.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Area">
                      <input
                        className="input"
                        value={organizationForm.area}
                        onChange={(event) =>
                          setOrganizationForm({
                            ...organizationForm,
                            area: event.target.value,
                          })
                        }
                      />
                    </Field>
                    <div className="md:col-span-2">
                      <button
                        className="rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:opacity-60"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Organization'}
                      </button>
                    </div>
                  </form>
                </Panel>
              ) : null}

              {activeTab === 'User Management' ? (
                <Panel title="User Management">
                  <form
                    className="grid gap-4 md:grid-cols-5"
                    onSubmit={handleCreateUser}
                  >
                    <input
                      className="input"
                      placeholder="Full name"
                      value={userForm.fullName}
                      onChange={(event) =>
                        setUserForm({ ...userForm, fullName: event.target.value })
                      }
                      required
                    />
                    <input
                      className="input"
                      placeholder="Email"
                      value={userForm.email}
                      onChange={(event) =>
                        setUserForm({ ...userForm, email: event.target.value })
                      }
                      required
                    />
                    <input
                      className="input"
                      placeholder="Phone"
                      value={userForm.phone}
                      onChange={(event) =>
                        setUserForm({ ...userForm, phone: event.target.value })
                      }
                      required
                    />
                    <input
                      className="input"
                      placeholder="Temporary password"
                      type="password"
                      value={userForm.password}
                      onChange={(event) =>
                        setUserForm({ ...userForm, password: event.target.value })
                      }
                      required
                    />
                    <div className="flex gap-2">
                      <select
                        className="input"
                        value={userForm.role}
                        onChange={(event) =>
                          setUserForm({
                            ...userForm,
                            role: event.target.value as Role,
                          })
                        }
                      >
                        {roles.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <button
                        className="rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500 disabled:opacity-60"
                        disabled={saving}
                      >
                        Add
                      </button>
                    </div>
                  </form>

                  <div className="mt-6 overflow-hidden rounded-lg border border-slate-800">
                    {filteredUsers.length === 0 ? (
                      <div className="p-8 text-center text-sm text-slate-400">
                        No users found.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800">
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className="grid gap-3 p-4 md:grid-cols-[1fr_1fr_160px]"
                          >
                            <div>
                              <p className="font-medium">{user.fullName}</p>
                              <p className="text-sm text-slate-400">
                                {user.email}
                              </p>
                            </div>
                            <p className="text-sm text-slate-400">
                              {user.phone}
                            </p>
                            <select
                              className="input"
                              value={user.role}
                              disabled={saving}
                              onChange={(event) =>
                                void handleRoleChange(
                                  user.id,
                                  event.target.value as Role,
                                )
                              }
                            >
                              {roles.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Panel>
              ) : null}

              {activeTab === 'Appearance' ? (
                <Panel title="Appearance">
                  <EmptySettingsState>
                    Dark appearance is currently the active workspace theme.
                    Theme switching can be layered onto this panel when design
                    tokens are introduced.
                  </EmptySettingsState>
                </Panel>
              ) : null}

              {activeTab === 'Import/Export' ? (
                <Panel title="Import/Export">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Link
                      href="/app/people"
                      className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-blue-500"
                    >
                      <p className="font-medium">Import People</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Upload CSV or XLSX files from the People module.
                      </p>
                    </Link>
                    <Link
                      href="/app/people"
                      className="rounded-lg border border-slate-800 bg-slate-900 p-4 hover:border-blue-500"
                    >
                      <p className="font-medium">Export People</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Download CSV or XLSX exports from the People module.
                      </p>
                    </Link>
                  </div>
                </Panel>
              ) : null}

              {activeTab === 'Audit Logs' ? (
                <Panel title="Audit Logs">
                  <EmptySettingsState>
                    Audit logs are available as a dedicated searchable module.
                  </EmptySettingsState>
                  <Link
                    href="/app/audit-log"
                    className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500"
                  >
                    Open Audit Log
                  </Link>
                </Panel>
              ) : null}

              {activeTab === 'Danger Zone' ? (
                <Panel title="Danger Zone">
                  <div className="rounded-lg border border-red-900 bg-red-950/30 p-4">
                    <h2 className="font-semibold text-red-100">
                      Delete Organization
                    </h2>
                    <p className="mt-2 text-sm text-red-200/80">
                      This permanently deletes the organization, users, people,
                      relationships, events, and audit logs.
                    </p>
                    <button
                      className="mt-4 rounded-lg bg-red-600 px-4 py-2 font-medium hover:bg-red-500"
                      onClick={() => setConfirmDelete(true)}
                    >
                      Delete Organization
                    </button>
                  </div>
                </Panel>
              ) : null}
            </div>
          )}
        </section>
      </div>

      {confirmDelete ? (
        <ConfirmationDialog
          title="Delete Organization?"
          loading={saving}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={handleDeleteOrganization}
        >
          <p className="text-sm text-slate-300">
            This action cannot be undone. The current organization and all of
            its data will be removed.
          </p>
        </ConfirmationDialog>
      ) : null}
    </main>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950 p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
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

function EmptySettingsState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-800 p-8 text-sm text-slate-400">
      {children}
    </div>
  );
}
