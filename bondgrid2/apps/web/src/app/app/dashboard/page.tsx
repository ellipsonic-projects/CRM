'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Link2,
  Plus,
  UploadCloud,
  UserPlus,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppHeader from '../../../components/layout/AppHeader';
import Sidebar from '../../../components/layout/Sidebar';
import {
  getCurrentUser,
  logout as logoutSession,
} from '../../../services/auth.api';
import { AuditLog } from '../../../services/audit.api';
import { getDashboard, DashboardData } from '../../../services/dashboard.api';
import { Event } from '../../../services/events.api';
import {
  getOrganization,
  Organization,
} from '../../../services/organizations.api';

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function DashboardPage() {
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization>();
  const [dashboard, setDashboard] = useState<DashboardData>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    async function boot() {
      try {
        const user = await getCurrentUser();
        const [loadedOrganization, loadedDashboard] = await Promise.all([
          getOrganization(user.organizationId),
          getDashboard(),
        ]);
        setOrganization(loadedOrganization);
        setDashboard(loadedDashboard);
      } catch (apiError) {
        if (apiError instanceof Error) {
          setError(apiError.message);
        }
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

  return (
    <main className="h-screen bg-[#0B1220] text-white flex flex-col">
      <AppHeader
        search=""
        onSearchChange={() => undefined}
        onPrimaryAction={() => router.push('/app/people')}
        primaryActionLabel="Add Person"
        searchPlaceholder="Dashboard"
        onLogout={() => void handleLogout()}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar organization={organization} />

        <section className="flex-1 overflow-y-auto p-6">
          <div>
            <p className="text-sm uppercase tracking-widest text-blue-300">
              Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Organization Overview
            </h1>
            <p className="mt-2 text-slate-400">
              Monitor people, relationships, events, users, and recent changes.
            </p>
          </div>

          {error ? (
            <div className="mt-6 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-10 text-center text-slate-400">
              Loading dashboard...
            </div>
          ) : dashboard ? (
            <>
              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <SummaryCard
                  label="Total People"
                  value={dashboard.summary.totalPeople}
                  icon={<Users size={22} />}
                />
                <SummaryCard
                  label="Total Relationships"
                  value={dashboard.summary.totalRelationships}
                  icon={<Link2 size={22} />}
                />
                <SummaryCard
                  label="Total Events"
                  value={dashboard.summary.totalEvents}
                  icon={<CalendarDays size={22} />}
                />
                <SummaryCard
                  label="Total Users"
                  value={dashboard.summary.totalUsers}
                  icon={<UserPlus size={22} />}
                />
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                <Panel title="Recent Activity">
                  {dashboard.recentActivity.length === 0 ? (
                    <EmptyState text="No activity has been recorded yet." />
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {dashboard.recentActivity.map((activity) => (
                        <ActivityRow key={activity.id} activity={activity} />
                      ))}
                    </div>
                  )}
                </Panel>

                <Panel title="Upcoming Events">
                  {dashboard.upcomingEvents.length === 0 ? (
                    <EmptyState text="No upcoming events are scheduled." />
                  ) : (
                    <div className="space-y-3">
                      {dashboard.upcomingEvents.map((event) => (
                        <EventRow key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </Panel>
              </div>

              <Panel title="Quick Actions" className="mt-6">
                <div className="grid gap-3 md:grid-cols-4">
                  <QuickAction
                    href="/app/people"
                    icon={<Plus size={18} />}
                    label="Add Person"
                  />
                  <QuickAction
                    href="/app/network"
                    icon={<Link2 size={18} />}
                    label="Add Relationship"
                  />
                  <QuickAction
                    href="/app/events"
                    icon={<CalendarDays size={18} />}
                    label="Add Event"
                  />
                  <QuickAction
                    href="/app/people"
                    icon={<UploadCloud size={18} />}
                    label="Import"
                  />
                </div>
              </Panel>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-5">
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-sm">{label}</span>
        <span className="text-blue-300">{icon}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-slate-800 bg-slate-950 p-5 ${className}`}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ActivityRow({ activity }: { activity: AuditLog }) {
  return (
    <div className="py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{activity.action.replaceAll('_', ' ')}</p>
        <time className="text-xs text-slate-500">
          {formatDateTime(activity.createdAt)}
        </time>
      </div>
      <p className="mt-1 text-sm text-slate-400">{activity.summary}</p>
    </div>
  );
}

function EventRow({ event }: { event: Event }) {
  return (
    <Link
      href="/app/events"
      className="block rounded-lg border border-slate-800 bg-slate-900/50 p-4 hover:border-blue-500"
    >
      <p className="font-medium">{event.title}</p>
      <p className="mt-1 text-sm text-slate-400">
        {formatDateTime(event.startDateTime)}
      </p>
    </Link>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-slate-200 hover:border-blue-500"
    >
      <span className="text-blue-300">{icon}</span>
      {label}
    </Link>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}
