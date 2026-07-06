'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppHeader from '../../../components/layout/AppHeader';
import Sidebar from '../../../components/layout/Sidebar';
import {
  getCurrentUser,
  logout as logoutSession,
} from '../../../services/auth.api';
import {
  AuditAction,
  AuditEntity,
  AuditLog,
  getAuditLogs,
} from '../../../services/audit.api';
import {
  getOrganization,
  Organization,
} from '../../../services/organizations.api';

const actions: AuditAction[] = [
  'LOGIN',
  'LOGOUT',
  'CREATE_PERSON',
  'UPDATE_PERSON',
  'DELETE_PERSON',
  'CREATE_RELATIONSHIP',
  'UPDATE_RELATIONSHIP',
  'DELETE_RELATIONSHIP',
  'CREATE_EVENT',
  'UPDATE_EVENT',
  'DELETE_EVENT',
  'CREATE_USER',
  'UPDATE_USER_ROLE',
  'UPDATE_ORGANIZATION',
  'DELETE_ORGANIZATION',
];

const entities: AuditEntity[] = [
  'Auth',
  'Person',
  'Relationship',
  'Event',
  'User',
  'Organization',
];

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function humanize(value: string): string {
  return value.replaceAll('_', ' ');
}

export default function AuditLogPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization>();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const filteredLogs = useMemo(() => logs, [logs]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const data = await getAuditLogs({ search, action, entity });
      setLogs(data);
    } catch (apiError) {
      setError(
        apiError instanceof Error
          ? apiError.message
          : 'Could not load audit logs.',
      );
    } finally {
      setLoading(false);
    }
  }, [action, entity, search]);

  useEffect(() => {
    async function boot() {
      try {
        const user = await getCurrentUser();
        const loadedOrganization = await getOrganization(user.organizationId);
        setOrganization(loadedOrganization);
        await loadLogs();
      } catch {
        router.replace('/login');
      }
    }

    void boot();
  }, [loadLogs, router]);

  const handleLogout = async () => {
    await logoutSession();
    router.replace('/login');
  };

  return (
    <main className="h-screen bg-[#0B1220] text-white flex flex-col">
      <AppHeader
        search={search}
        onSearchChange={setSearch}
        onPrimaryAction={() => void loadLogs()}
        primaryActionLabel="Refresh"
        searchPlaceholder="Search audit logs..."
        onLogout={() => void handleLogout()}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar organization={organization} />

        <section className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-widest text-blue-300">
                Audit Log
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Organization Activity
              </h1>
              <p className="mt-2 text-slate-400">
                Review authentication, people, relationship, event, user, and
                organization changes.
              </p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-right">
              <p className="text-2xl font-semibold">{logs.length}</p>
              <p className="text-sm text-slate-400">Visible records</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-lg border border-slate-800 bg-slate-950 p-4 md:grid-cols-[1fr_1fr_auto]">
            <select
              className="input"
              value={action}
              onChange={(event) => setAction(event.target.value)}
            >
              <option value="">All actions</option>
              {actions.map((item) => (
                <option key={item} value={item}>
                  {humanize(item)}
                </option>
              ))}
            </select>
            <select
              className="input"
              value={entity}
              onChange={(event) => setEntity(event.target.value)}
            >
              <option value="">All entities</option>
              {entities.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium hover:bg-blue-500"
              onClick={() => void loadLogs()}
            >
              Apply Filters
            </button>
          </div>

          {error ? (
            <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
            {loading ? (
              <div className="p-10 text-center text-slate-400">
                Loading audit logs...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <h2 className="text-lg font-semibold">No audit logs found</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Try changing the search or filters, or perform an action in
                  the app to create the first record.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="border-b border-slate-800 text-xs uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Entity</th>
                      <th className="px-4 py-3">Summary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/50">
                        <td className="px-4 py-4 text-slate-300">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-4">{log.userName}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-xs text-blue-200">
                            {humanize(log.action)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {log.entityName
                            ? `${log.entity}: ${log.entityName}`
                            : log.entity}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          {log.summary}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
