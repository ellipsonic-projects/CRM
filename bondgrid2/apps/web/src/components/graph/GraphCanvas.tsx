import GraphToolbar from "./GraphToolbar";
import GraphViewport from "./GraphViewport";
import GraphControls from "./GraphControls";

export default function GraphCanvas() {
  return (
    <section className="relative flex flex-1 flex-col bg-[#0B1120] overflow-hidden">

      <GraphToolbar />

      <div className="relative flex-1">
        <GraphViewport />
        <GraphControls />
      </div>

    </section>
  );
}