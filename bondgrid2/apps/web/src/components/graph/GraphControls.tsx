import {
  Plus,
  Minus,
  Scan,
} from "lucide-react";

export default function GraphControls() {
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2">

      <button className="rounded-xl bg-slate-900 p-3 hover:bg-slate-800">
        <Plus size={18} />
      </button>

      <button className="rounded-xl bg-slate-900 p-3 hover:bg-slate-800">
        <Minus size={18} />
      </button>

      <button className="rounded-xl bg-slate-900 p-3 hover:bg-slate-800">
        <Scan size={18} />
      </button>

    </div>
  );
}