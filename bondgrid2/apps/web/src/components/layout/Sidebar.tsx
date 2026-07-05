'use client';

import {
  LayoutDashboard,
  Users,
  Network,
  CalendarDays,
  Upload,
  ClipboardList,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { Organization } from '../../services/organizations.api';

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard, active: false },
  { name: 'People', icon: Users, active: false },
  { name: 'Graph', icon: Network, active: true },
  { name: 'Events', icon: CalendarDays, active: false },
  { name: 'Import', icon: Upload, active: false },
  { name: 'Audit Log', icon: ClipboardList, active: false },
  { name: 'Settings', icon: Settings, active: false },
];

interface SidebarProps {
  organization?: Organization;
}

export default function Sidebar({ organization }: SidebarProps) {
  return (
    <aside className="w-72 border-r border-slate-800 bg-slate-950 flex flex-col">
      {/* Organization */}
      <div className="border-b border-slate-800 p-5">
        <p className="text-xs uppercase tracking-widest text-slate-500">
          Organization
        </p>

        <button className="mt-3 flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 hover:border-blue-500 transition">
          <div className="text-left">
            <h3 className="font-semibold">
              {organization?.name ?? 'Organization'}
            </h3>
            <p className="text-sm text-slate-400">
              {organization?.organizationType ?? 'Loading'}
            </p>
          </div>

          <ChevronRight size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <p className="mb-3 px-3 text-xs uppercase tracking-widest text-slate-500">
          Navigation
        </p>

        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition
                ${
                  item.active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <Icon size={20} />
                {item.name}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-sm font-medium">BondGrid v0.1</p>

          <p className="mt-1 text-xs text-slate-400">
            Community Relationship Platform
          </p>
        </div>
      </div>
    </aside>
  );
}
