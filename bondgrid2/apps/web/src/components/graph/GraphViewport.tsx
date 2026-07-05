export default function GraphViewport() {
  return (
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    >
      <div className="flex h-full items-center justify-center">

        <div className="text-center">

          <h2 className="text-3xl font-bold">
            No People Yet
          </h2>

          <p className="mt-3 text-slate-400">
            Import your community or create your first person.
          </p>

        </div>

      </div>
    </div>
  );
}