'use client';

import { ReactNode, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import {
  FilterOption,
  getActiveGraphFilterCount,
  GraphFilterOptions,
  GraphFilterState,
  LoginFilterValue,
} from '../../services/filter.service';
import { Gender } from '../../services/people.api';

interface GraphFiltersPanelProps {
  collapsed: boolean;
  filters: GraphFilterState;
  options: GraphFilterOptions;
  totalPeople: number;
  visiblePeople: number;
  visibleRelationships: number;
  onCollapsedChange: (collapsed: boolean) => void;
  onFiltersChange: (filters: GraphFilterState) => void;
  onClear: () => void;
}

type FilterKey =
  | 'genders'
  | 'occupations'
  | 'states'
  | 'cities'
  | 'areas'
  | 'hasLogin'
  | 'relationshipCategories'
  | 'relationshipTypeIds';

type GroupKey = 'people' | 'location' | 'relationships' | 'account';

const groupTitles: Record<GroupKey, string> = {
  people: 'People',
  location: 'Location',
  relationships: 'Relationships',
  account: 'Account',
};

function toggleValue<T extends string>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((entry) => entry !== value)
    : [...values, value];
}

function removeValue<T extends string>(values: T[], value: string): T[] {
  return values.filter((entry) => entry !== value);
}

export default function GraphFiltersPanel({
  collapsed,
  filters,
  options,
  totalPeople,
  visiblePeople,
  visibleRelationships,
  onCollapsedChange,
  onFiltersChange,
  onClear,
}: GraphFiltersPanelProps) {
  const [openGroups, setOpenGroups] = useState<Record<GroupKey, boolean>>({
    people: true,
    location: true,
    relationships: true,
    account: true,
  });
  const activeCount = getActiveGraphFilterCount(filters);
  const chips = useFilterChips(filters, options);

  const updateValues = <T extends string>(key: FilterKey, values: T[]) => {
    onFiltersChange({ ...filters, [key]: values });
  };

  const removeChip = (chip: FilterChip) => {
    if (chip.key === 'search') {
      onFiltersChange({ ...filters, search: '' });
      return;
    }

    if (chip.key === 'states') {
      onFiltersChange({
        ...filters,
        states: removeValue(filters.states, chip.value),
        cities: [],
        areas: [],
      });
      return;
    }

    if (chip.key === 'cities') {
      onFiltersChange({
        ...filters,
        cities: removeValue(filters.cities, chip.value),
        areas: [],
      });
      return;
    }

    if (chip.key === 'relationshipCategories') {
      onFiltersChange({
        ...filters,
        relationshipCategories: removeValue(
          filters.relationshipCategories,
          chip.value,
        ),
        relationshipTypeIds: [],
      });
      return;
    }

    onFiltersChange({
      ...filters,
      [chip.key]: removeValue(filters[chip.key], chip.value),
    });
  };

  if (collapsed) {
    return (
      <aside className="flex w-14 shrink-0 flex-col items-center border-r border-slate-800 bg-slate-950 py-4">
        <button
          className="relative rounded-lg p-2 text-slate-300 hover:bg-slate-900"
          onClick={() => onCollapsedChange(false)}
          title="Open filters"
        >
          <SlidersHorizontal size={19} />
          {activeCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
        </button>
        <ChevronRight className="mt-2 text-slate-600" size={15} />
      </aside>
    );
  }

  return (
    <aside className="w-88 shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-950">
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-blue-400" />
            <h2 className="font-semibold text-slate-100">Filters</h2>
            {activeCount > 0 ? (
              <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-medium text-white">
                {activeCount}
              </span>
            ) : null}
          </div>

          <button
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-100"
            onClick={() => onCollapsedChange(true)}
            title="Collapse filters"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Showing {visiblePeople} of {totalPeople} people and{' '}
          {visibleRelationships} relationships.
        </p>

        <ActiveFilters chips={chips} onRemove={removeChip} onClear={onClear} />
      </div>

      <div className="space-y-3 p-4">
        <FilterGroup
          title={groupTitles.people}
          open={openGroups.people}
          onToggle={() =>
            setOpenGroups((current) => ({
              ...current,
              people: !current.people,
            }))
          }
        >
          <MultiSelectFilter
            title="Gender"
            searchPlaceholder="Search gender..."
            options={options.genders}
            selected={filters.genders}
            onChange={(genders) => updateValues('genders', genders as Gender[])}
            searchable={false}
          />
          <MultiSelectFilter
            title="Occupation"
            searchPlaceholder="Search occupation..."
            options={options.occupations}
            selected={filters.occupations}
            onChange={(occupations) => updateValues('occupations', occupations)}
            emptyLabel="No occupations match"
          />
        </FilterGroup>

        <FilterGroup
          title={groupTitles.location}
          open={openGroups.location}
          onToggle={() =>
            setOpenGroups((current) => ({
              ...current,
              location: !current.location,
            }))
          }
        >
          <MultiSelectFilter
            title="State"
            searchPlaceholder="Search state..."
            options={options.states}
            selected={filters.states}
            onChange={(states) =>
              onFiltersChange({ ...filters, states, cities: [], areas: [] })
            }
            emptyLabel="No states match"
          />
          <MultiSelectFilter
            title="City"
            searchPlaceholder="Search city..."
            options={options.cities}
            selected={filters.cities}
            onChange={(cities) =>
              onFiltersChange({ ...filters, cities, areas: [] })
            }
            emptyLabel="No cities match"
          />
          <MultiSelectFilter
            title="Area"
            searchPlaceholder="Search area..."
            options={options.areas}
            selected={filters.areas}
            onChange={(areas) => updateValues('areas', areas)}
            emptyLabel="No areas match"
          />
        </FilterGroup>

        <FilterGroup
          title={groupTitles.relationships}
          open={openGroups.relationships}
          onToggle={() =>
            setOpenGroups((current) => ({
              ...current,
              relationships: !current.relationships,
            }))
          }
        >
          <MultiSelectFilter
            title="Category"
            searchPlaceholder="Search category..."
            options={options.relationshipCategories}
            selected={filters.relationshipCategories}
            onChange={(relationshipCategories) =>
              onFiltersChange({
                ...filters,
                relationshipCategories,
                relationshipTypeIds: [],
              })
            }
            emptyLabel="No relationship categories match"
          />
          <MultiSelectFilter
            title="Relationship Type"
            searchPlaceholder="Search relationship type..."
            options={options.relationshipTypes}
            selected={filters.relationshipTypeIds}
            onChange={(relationshipTypeIds) =>
              updateValues('relationshipTypeIds', relationshipTypeIds)
            }
            emptyLabel="No relationship types match"
          />
        </FilterGroup>

        <FilterGroup
          title={groupTitles.account}
          open={openGroups.account}
          onToggle={() =>
            setOpenGroups((current) => ({
              ...current,
              account: !current.account,
            }))
          }
        >
          <MultiSelectFilter
            title="Login Access"
            searchPlaceholder="Search login..."
            options={options.hasLogin}
            selected={filters.hasLogin}
            onChange={(hasLogin) =>
              updateValues('hasLogin', hasLogin as LoginFilterValue[])
            }
            searchable={false}
            emptyLabel="No login values match"
          />
        </FilterGroup>
      </div>
    </aside>
  );
}

interface FilterChip {
  key: FilterKey | 'search';
  value: string;
  label: string;
}

function useFilterChips(
  filters: GraphFilterState,
  options: GraphFilterOptions,
): FilterChip[] {
  return useMemo(() => {
    const labelMaps: Record<FilterKey, Map<string, string>> = {
      genders: toLabelMap(options.genders),
      occupations: toLabelMap(options.occupations),
      states: toLabelMap(options.states),
      cities: toLabelMap(options.cities),
      areas: toLabelMap(options.areas),
      hasLogin: toLabelMap(options.hasLogin),
      relationshipCategories: toLabelMap(options.relationshipCategories),
      relationshipTypeIds: toLabelMap(options.relationshipTypes),
    };
    const chips: FilterChip[] = [];

    if (filters.search.trim()) {
      chips.push({
        key: 'search',
        value: filters.search,
        label: `Search: ${filters.search}`,
      });
    }

    (
      [
        'genders',
        'occupations',
        'states',
        'cities',
        'areas',
        'hasLogin',
        'relationshipCategories',
        'relationshipTypeIds',
      ] as FilterKey[]
    ).forEach((key) => {
      filters[key].forEach((value) => {
        chips.push({
          key,
          value,
          label: labelMaps[key].get(value) ?? value,
        });
      });
    });

    return chips;
  }, [filters, options]);
}

function toLabelMap(options: FilterOption[]): Map<string, string> {
  return new Map(options.map((option) => [option.value, option.label]));
}

function ActiveFilters({
  chips,
  onRemove,
  onClear,
}: {
  chips: FilterChip[];
  onRemove: (chip: FilterChip) => void;
  onClear: () => void;
}) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Active Filters
        </h3>
        <button
          className="text-xs font-medium text-slate-300 hover:text-white"
          onClick={onClear}
        >
          Clear All
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={`${chip.key}:${chip.value}`}
            className="flex max-w-full items-center gap-1 rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 hover:border-blue-500"
            onClick={() => onRemove(chip)}
            title={`Remove ${chip.label}`}
          >
            <span className="truncate">{chip.label}</span>
            <X size={12} />
          </button>
        ))}
      </div>
    </section>
  );
}

function FilterGroup({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/40">
      <button
        className="flex w-full items-center justify-between px-3 py-3 text-left"
        onClick={onToggle}
      >
        <span className="font-medium text-slate-100">{title}</span>
        {open ? (
          <ChevronUp size={17} className="text-slate-500" />
        ) : (
          <ChevronDown size={17} className="text-slate-500" />
        )}
      </button>
      {open ? <div className="space-y-4 px-3 pb-3">{children}</div> : null}
    </section>
  );
}

function MultiSelectFilter({
  title,
  searchPlaceholder,
  options,
  selected,
  onChange,
  emptyLabel = 'No values match',
  searchable = true,
}: {
  title: string;
  searchPlaceholder: string;
  options: FilterOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  emptyLabel?: string;
  searchable?: boolean;
}) {
  const [query, setQuery] = useState('');
  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(normalizedQuery),
    );
  }, [options, query]);
  const visibleOptions = filteredOptions.slice(0, 80);

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </h4>
        {selected.length > 0 ? (
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
            {selected.length}
          </span>
        ) : null}
      </div>

      {searchable ? (
        <div className="relative mb-2">
          <Search
            size={15}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            className="w-full rounded-lg border border-slate-800 bg-slate-950 py-2 pl-8 pr-3 text-sm text-slate-200 outline-none focus:border-blue-500"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      ) : null}

      {visibleOptions.length === 0 ? (
        <p className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-500">
          {emptyLabel}
        </p>
      ) : (
        <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
          {visibleOptions.map((option) => (
            <CheckboxRow
              key={option.value}
              checked={selected.includes(option.value)}
              label={option.label}
              count={option.count}
              onChange={() => onChange(toggleValue(selected, option.value))}
            />
          ))}
          {filteredOptions.length > visibleOptions.length ? (
            <p className="px-2 py-1 text-xs text-slate-500">
              Narrow your search to see more values.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function CheckboxRow({
  checked,
  label,
  count,
  onChange,
}: {
  checked: boolean;
  label: string;
  count?: number;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-950">
      <span className="flex min-w-0 items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="h-4 w-4 rounded border-slate-700 bg-slate-900"
        />
        <span className="truncate">{label}</span>
      </span>
      {count !== undefined ? (
        <span className="text-xs text-slate-500">({count})</span>
      ) : null}
    </label>
  );
}
