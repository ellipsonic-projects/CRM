import { Search, Plus, Bell, UserCircle2 } from 'lucide-react';

interface AppHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  onAddPerson?: () => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
  searchPlaceholder?: string;
  onLogout?: () => void;
}

export default function AppHeader({
  search,
  onSearchChange,
  onAddPerson,
  onPrimaryAction,
  primaryActionLabel = 'Add Person',
  searchPlaceholder = 'Search people, occupation, city, relationship...',
  onLogout,
}: AppHeaderProps) {
  const primaryAction = onPrimaryAction ?? onAddPerson;

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight">
          Bond<span className="text-blue-500">Grid</span>
        </h1>
      </div>

      {/* Search */}
      <div className="w-[420px] relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          size={18}
        />

        <input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full rounded-xl bg-slate-900 border border-slate-800 py-2 pl-10 pr-4 outline-none focus:border-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {primaryAction ? (
          <button
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 hover:bg-blue-500 transition"
            onClick={primaryAction}
          >
            <Plus size={18} />
            {primaryActionLabel}
          </button>
        ) : null}

        <button className="p-2 rounded-xl hover:bg-slate-900">
          <Bell size={20} />
        </button>

        <button className="p-2 rounded-xl hover:bg-slate-900">
          <UserCircle2 size={28} />
        </button>

        {onLogout ? (
          <button
            className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900"
            onClick={onLogout}
          >
            Logout
          </button>
        ) : null}
      </div>
    </header>
  );
}
