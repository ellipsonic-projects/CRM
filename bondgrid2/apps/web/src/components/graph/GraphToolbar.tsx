import {
  Search,
  Filter,
  Maximize2,
  LayoutGrid,
} from "lucide-react";

export default function GraphToolbar() {
  return (
    <div className="flex h-14 items-center justify-between border-b border-slate-800 px-5">

      <h2 className="font-semibold text-slate-200">
        Community Graph
      </h2>

      <div className="flex items-center gap-2">

        <button className="rounded-lg p-2 hover:bg-slate-800">
          <Search size={18} />
        </button>

        <button className="rounded-lg p-2 hover:bg-slate-800">
          <Filter size={18} />
        </button>

        <button className="rounded-lg p-2 hover:bg-slate-800">
          <LayoutGrid size={18} />
        </button>

        <button className="rounded-lg p-2 hover:bg-slate-800">
          <Maximize2 size={18} />
        </button>

      </div>

    </div>
  );
}