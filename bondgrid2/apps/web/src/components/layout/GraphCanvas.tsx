'use client';

import {
  MouseEvent,
  PointerEvent,
  WheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Maximize2, RotateCcw } from 'lucide-react';
import { Person } from '../../services/people.api';

interface GraphRelationship {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
}

interface GraphCanvasProps {
  people: Person[];
  selectedPersonId?: string;
  loading: boolean;
  error?: string;
  relationships?: GraphRelationship[];
  selectedRelationshipId?: string;
  onSelectPerson: (person: Person) => void;
  onRetry: () => void;
}

interface GraphNode {
  person: Person;
  x: number;
  y: number;
}

interface GraphPoint {
  x: number;
  y: number;
}

interface ViewBox {
  x: number;
  y: number;
  scale: number;
}

interface CanvasSize {
  width: number;
  height: number;
}

type DragState =
  | {
    type: 'pan';
    pointerId: number;
    x: number;
    y: number;
    view: ViewBox;
  }
  | {
    type: 'node';
    pointerId: number;
    personId: string;
    offset: GraphPoint;
    moved: boolean;
  }
  | {
    type: 'relationship';
    pointerId: number;
    relationshipId: string;
    startClient: GraphPoint;
    startOffset: GraphPoint;
    moved: boolean;
  };

const NODE_RADIUS = 34;
const EDGE_LABEL_OFFSET = 10;
const TOP_CHROME_OFFSET = 56;
const MIN_ZOOM = 0.35;
const MAX_ZOOM = 2.4;
const GRAPH_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#a855f7',
  '#ef4444',
  '#14b8a6',
  '#6366f1',
  '#ec4899',
  '#eab308',
];
const EMPTY_RELATIONSHIPS: GraphRelationship[] = [];
const EMPTY_LABEL_OFFSETS: Record<string, GraphPoint> = {};

function hashString(value: string): number {
  return value.split('').reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 0);
}

function getNodeColor(personId: string): string {
  return GRAPH_COLORS[hashString(personId) % GRAPH_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function getGraphBound(nodeCount: number): number {
  return Math.max(420, Math.ceil(Math.sqrt(Math.max(nodeCount, 1))) * 170);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function createSeededNode(
  person: Person,
  index: number,
  count: number,
): GraphNode {
  const bound = getGraphBound(count);
  const radius = Math.max(140, Math.min(bound * 0.65, count * 22));
  const angle = (index / Math.max(count, 1)) * Math.PI * 2;

  return {
    person,
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function createInitialNodes(people: Person[]): GraphNode[] {
  return people.map((person, index) =>
    createSeededNode(person, index, people.length),
  );
}

function runLayout(
  nodes: GraphNode[],
  relationships: GraphRelationship[],
): GraphNode[] {
  const bound = getGraphBound(nodes.length);
  const linkDistance = 150;
  const iterations = nodes.length > 250 ? 70 : 110;
  const relationshipPairs = relationships
    .map((relationship) => ({
      sourceIndex: nodes.findIndex(
        (node) => node.person.id === relationship.sourceId,
      ),
      targetIndex: nodes.findIndex(
        (node) => node.person.id === relationship.targetId,
      ),
    }))
    .filter((pair) => pair.sourceIndex >= 0 && pair.targetIndex >= 0);
  let working = nodes.map((node) => ({ ...node, vx: 0, vy: 0 }));

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const temperature = 1 - iteration / iterations;

    for (let index = 0; index < working.length; index += 1) {
      const node = working[index];

      let fx = 0;
      let fy = 0;

      for (let otherIndex = 0; otherIndex < working.length; otherIndex += 1) {
        if (index === otherIndex) {
          continue;
        }

        const other = working[otherIndex];
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distanceSq = Math.max(dx * dx + dy * dy, 900);
        const distance = Math.sqrt(distanceSq);
        const force = 6800 / distanceSq;
        fx += (dx / distance) * force;
        fy += (dy / distance) * force;
      }

      relationshipPairs.forEach((pair) => {
        const isSource = pair.sourceIndex === index;
        const isTarget = pair.targetIndex === index;

        if (!isSource && !isTarget) {
          return;
        }

        const other = working[isSource ? pair.targetIndex : pair.sourceIndex];
        const dx = other.x - node.x;
        const dy = other.y - node.y;
        const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const spring = (distance - linkDistance) * 0.035;
        fx += (dx / distance) * spring;
        fy += (dy / distance) * spring;
      });

      node.vx = (node.vx + fx) * 0.58;
      node.vy = (node.vy + fy) * 0.58;
    }

    working = working.map((node) => {
      return {
        ...node,
        x: clamp(node.x + node.vx * temperature, -bound, bound),
        y: clamp(node.y + node.vy * temperature, -bound, bound),
      };
    });
  }

  return working.map(({ person, x, y }) => ({
    person,
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
  }));
}

function getNodeBounds(nodes: GraphNode[]) {
  const xs = nodes.map((node) => node.x);
  const ys = nodes.map((node) => node.y);

  return {
    minX: Math.min(...xs) - NODE_RADIUS - 96,
    maxX: Math.max(...xs) + NODE_RADIUS + 96,
    minY: Math.min(...ys) - NODE_RADIUS - 96,
    maxY: Math.max(...ys) + NODE_RADIUS + 118,
  };
}

function getFitView(nodes: GraphNode[], canvasSize: CanvasSize): ViewBox {
  if (nodes.length === 0 || canvasSize.width === 0 || canvasSize.height === 0) {
    return { x: 0, y: 0, scale: 1 };
  }

  const bounds = getNodeBounds(nodes);
  const graphWidth = Math.max(bounds.maxX - bounds.minX, 220);
  const graphHeight = Math.max(bounds.maxY - bounds.minY, 200);
  const availableWidth = Math.max(canvasSize.width, 1);
  const availableHeight = Math.max(canvasSize.height - TOP_CHROME_OFFSET, 1);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const fitScale = Math.min(
    availableWidth / graphWidth,
    availableHeight / graphHeight,
  );
  const maxReadableScale = nodes.length <= 3 ? 1.25 : 1.05;
  const scale = clamp(fitScale * 0.9, MIN_ZOOM, maxReadableScale);

  return {
    x: -centerX * scale,
    y: -centerY * scale + TOP_CHROME_OFFSET / 2,
    scale,
  };
}

function isGraphClipped(
  nodes: GraphNode[],
  view: ViewBox,
  canvasSize: CanvasSize,
): boolean {
  if (nodes.length === 0 || canvasSize.width === 0 || canvasSize.height === 0) {
    return false;
  }

  const bounds = getNodeBounds(nodes);
  const screenMinX = canvasSize.width / 2 + view.x + bounds.minX * view.scale;
  const screenMaxX = canvasSize.width / 2 + view.x + bounds.maxX * view.scale;
  const screenMinY = canvasSize.height / 2 + view.y + bounds.minY * view.scale;
  const screenMaxY = canvasSize.height / 2 + view.y + bounds.maxY * view.scale;
  const tolerance = 24;

  return (
    screenMinX < -tolerance ||
    screenMaxX > canvasSize.width + tolerance ||
    screenMinY < TOP_CHROME_OFFSET - tolerance ||
    screenMaxY > canvasSize.height + tolerance
  );
}

export default function GraphCanvas({
  people,
  selectedPersonId,
  loading,
  error,
  relationships: relationshipsProp,
  selectedRelationshipId,
  onSelectPerson,
  onRetry,
}: GraphCanvasProps) {
  const relationships = relationshipsProp ?? EMPTY_RELATIONSHIPS;
  const svgRef = useRef<SVGSVGElement>(null);
  const dragRef = useRef<DragState | undefined>(undefined);
  const suppressClickRef = useRef(false);
  const autoFitSignatureRef = useRef<string | undefined>(undefined);
  const previousCanvasSizeRef = useRef<CanvasSize>({ width: 0, height: 0 });
  const relationshipsKey = useMemo(
    () =>
      relationships
        .map(
          (relationship) =>
            `${relationship.id}:${relationship.sourceId}:${relationship.targetId}`,
        )
        .sort()
        .join('|'),
    [relationships],
  );
  const graphSignature = useMemo(() => {
    const peopleKey = people
      .map((person) => person.id)
      .sort()
      .join('|');

    return `${peopleKey}::${relationshipsKey}`;
  }, [people, relationshipsKey]);
  const [nodes, setNodes] = useState<GraphNode[]>(() =>
    runLayout(createInitialNodes(people), relationships),
  );
  const [view, setView] = useState<ViewBox>({ x: 0, y: 0, scale: 1 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [hoveredNodeId, setHoveredNodeId] = useState<string>();
  const [hoveredRelationshipId, setHoveredRelationshipId] = useState<string>();
  const [draggingNodeId, setDraggingNodeId] = useState<string>();
  const [relationshipLabelOffsets, setRelationshipLabelOffsets] =
    useState<Record<string, GraphPoint>>(EMPTY_LABEL_OFFSETS);

  const nodeById = useMemo(() => {
    return new Map(nodes.map((node) => [node.person.id, node]));
  }, [nodes]);

  const sortedNodes = useMemo(() => {
    return [...nodes].sort((first, second) => {
      const firstActive =
        first.person.id === selectedPersonId ||
        first.person.id === hoveredNodeId ||
        first.person.id === draggingNodeId;
      const secondActive =
        second.person.id === selectedPersonId ||
        second.person.id === hoveredNodeId ||
        second.person.id === draggingNodeId;

      return Number(firstActive) - Number(secondActive);
    });
  }, [draggingNodeId, hoveredNodeId, nodes, selectedPersonId]);

  const fitGraph = useCallback(() => {
    setView(getFitView(nodes, canvasSize));
  }, [canvasSize.height, canvasSize.width, nodes]);

  useEffect(() => {
    setNodes((current) => {
      const currentById = new Map(
        current.map((node) => [node.person.id, node]),
      );
      const nextNodes = people.map((person, index) => {
        const existing = currentById.get(person.id);

        return existing
          ? { ...existing, person }
          : createSeededNode(person, index, people.length);
      });
      const addedNodes = people.some((person) => !currentById.has(person.id));

      if (current.length === 0 || addedNodes) {
        autoFitSignatureRef.current = undefined;
        return runLayout(nextNodes, relationships);
      }

      return nextNodes;
    });
  }, [people, relationships]);

  useEffect(() => {
    setNodes((current) =>
      current.length > 0 ? runLayout(current, relationships) : current,
    );
    autoFitSignatureRef.current = undefined;
  }, [relationshipsKey, relationships]);

  useEffect(() => {
    setRelationshipLabelOffsets((current) => {
      const relationshipIds = new Set(
        relationships.map((relationship) => relationship.id),
      );
      const next = Object.fromEntries(
        Object.entries(current).filter(([relationshipId]) =>
          relationshipIds.has(relationshipId),
        ),
      );

      return Object.keys(next).length === Object.keys(current).length
        ? current
        : next;
    });
  }, [relationships]);

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) {
      return;
    }

    const updateSize = () => {
      const rect = svg.getBoundingClientRect();
      const nextSize = { width: rect.width, height: rect.height };
      const previousSize = previousCanvasSizeRef.current;
      previousCanvasSizeRef.current = nextSize;

      setCanvasSize(nextSize);

      if (
        previousSize.width > 0 &&
        previousSize.height > 0 &&
        nodes.length > 0 &&
        isGraphClipped(nodes, view, nextSize)
      ) {
        setView(getFitView(nodes, nextSize));
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(svg);

    return () => observer.disconnect();
  }, [nodes, view]);

  useEffect(() => {
    if (
      nodes.length === 0 ||
      canvasSize.width === 0 ||
      canvasSize.height === 0 ||
      autoFitSignatureRef.current === graphSignature
    ) {
      return;
    }

    setView(getFitView(nodes, canvasSize));
    autoFitSignatureRef.current = graphSignature;
  }, [canvasSize, graphSignature, nodes]);

  const toGraphPoint = useCallback(
    (clientX: number, clientY: number): GraphPoint => {
      const rect = svgRef.current?.getBoundingClientRect();

      if (!rect) {
        return { x: 0, y: 0 };
      }

      const cursorX = clientX - rect.left;
      const cursorY = clientY - rect.top;

      return {
        x: (cursorX - canvasSize.width / 2 - view.x) / view.scale,
        y: (cursorY - canvasSize.height / 2 - view.y) / view.scale,
      };
    },
    [canvasSize.height, canvasSize.width, view.scale, view.x, view.y],
  );

  const capturePointer = (pointerId: number) => {
    if (!svgRef.current?.hasPointerCapture(pointerId)) {
      svgRef.current?.setPointerCapture(pointerId);
    }
  };

  const releasePointer = (pointerId: number) => {
    if (svgRef.current?.hasPointerCapture(pointerId)) {
      svgRef.current.releasePointerCapture(pointerId);
    }
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;

    if (!drag) {
      return;
    }

    if (drag.type === 'pan') {
      setView({
        ...drag.view,
        x: drag.view.x + event.clientX - drag.x,
        y: drag.view.y + event.clientY - drag.y,
      });
      return;
    }

    if (drag.type === 'node') {
      const nextPoint = toGraphPoint(event.clientX, event.clientY);
      const nextX = nextPoint.x + drag.offset.x;
      const nextY = nextPoint.y + drag.offset.y;

      dragRef.current = { ...drag, moved: true };
      suppressClickRef.current = true;
      setNodes((current) =>
        current.map((node) =>
          node.person.id === drag.personId
            ? { ...node, x: nextX, y: nextY }
            : node,
        ),
      );
      return;
    }

    if (drag.type === 'relationship') {
      const deltaX = (event.clientX - drag.startClient.x) / view.scale;
      const deltaY = (event.clientY - drag.startClient.y) / view.scale;

      dragRef.current = { ...drag, moved: true };
      suppressClickRef.current = true;
      setRelationshipLabelOffsets((current) => ({
        ...current,
        [drag.relationshipId]: {
          x: drag.startOffset.x + deltaX,
          y: drag.startOffset.y + deltaY,
        },
      }));
    }
  };

  const handlePointerUp = (event: PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;

    if (drag) {
      releasePointer(drag.pointerId);
    }

    if (drag?.type === 'node') {
      setDraggingNodeId(undefined);

      if (!drag.moved) {
        const clickedNode = nodeById.get(drag.personId);
        if (clickedNode) {
          onSelectPerson(clickedNode.person);
        }
      }
    }

    if (drag?.type === 'relationship') {
      setHoveredRelationshipId(drag.relationshipId);
    }

    dragRef.current = undefined;

    if (drag?.type !== 'pan' && drag?.moved) {
      event.preventDefault();
    }
  };

  const handleWheel = (event: WheelEvent<SVGSVGElement>) => {
    event.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();

    if (!rect) {
      return;
    }

    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;
    const graphX = (cursorX - canvasSize.width / 2 - view.x) / view.scale;
    const graphY = (cursorY - canvasSize.height / 2 - view.y) / view.scale;
    const nextScale = clamp(
      view.scale * Math.exp(-event.deltaY * 0.0012),
      MIN_ZOOM,
      MAX_ZOOM,
    );

    setView({
      x: cursorX - canvasSize.width / 2 - graphX * nextScale,
      y: cursorY - canvasSize.height / 2 - graphY * nextScale,
      scale: nextScale,
    });
  };

  const startPan = (event: PointerEvent<SVGElement>) => {
    capturePointer(event.pointerId);
    dragRef.current = {
      type: 'pan',
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      view,
    };
  };

  const startNodeDrag = (event: PointerEvent<SVGGElement>, node: GraphNode) => {
    event.stopPropagation();
    const graphPoint = toGraphPoint(event.clientX, event.clientY);

    capturePointer(event.pointerId);
    setDraggingNodeId(node.person.id);
    dragRef.current = {
      type: 'node',
      pointerId: event.pointerId,
      personId: node.person.id,
      offset: {
        x: node.x - graphPoint.x,
        y: node.y - graphPoint.y,
      },
      moved: false,
    };
  };

  const startRelationshipDrag = (
    event: PointerEvent<SVGGElement>,
    relationshipId: string,
  ) => {
    event.stopPropagation();
    const startOffset = relationshipLabelOffsets[relationshipId] ?? {
      x: 0,
      y: 0,
    };

    capturePointer(event.pointerId);
    dragRef.current = {
      type: 'relationship',
      pointerId: event.pointerId,
      relationshipId,
      startClient: {
        x: event.clientX,
        y: event.clientY,
      },
      startOffset,
      moved: false,
    };
  };

  const handleEdgeClick = (
    event: MouseEvent<SVGGElement>,
    relationshipId: string,
  ) => {
    event.stopPropagation();

    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    setHoveredRelationshipId(relationshipId);
  };

  const handleNodeClick = (person: Person) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    onSelectPerson(person);
  };

  return (
    <main
      className="relative flex flex-1 overflow-hidden bg-slate-900"
      style={{
        backgroundImage:
          'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      <div className="absolute inset-x-0 top-0 z-10 flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 backdrop-blur">
        <h2 className="font-semibold text-slate-200">Community Graph</h2>
        <div className="flex items-center gap-2">
          <p className="mr-1 text-sm text-slate-500">{people.length} people</p>
          <button
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
            onClick={fitGraph}
            title="Fit graph"
          >
            <Maximize2 size={18} />
          </button>
          <button
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
            onClick={() => setView({ x: 0, y: 0, scale: 1 })}
            title="Reset view"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center pt-14">
          <p className="text-slate-400">Loading people...</p>
        </div>
      ) : error ? (
        <div className="flex flex-1 items-center justify-center pt-14">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Could not load people</h2>
            <p className="mt-3 max-w-md text-slate-400">{error}</p>
            <button
              className="mt-5 rounded-xl bg-blue-600 px-4 py-2 hover:bg-blue-500"
              onClick={onRetry}
            >
              Retry
            </button>
          </div>
        </div>
      ) : people.length === 0 ? (
        <div className="flex flex-1 items-center justify-center pt-14">
          <div className="text-center">
            <h2 className="text-3xl font-bold">No People Yet</h2>
            <p className="mt-3 text-slate-400">
              Create your first person to start the community graph.
            </p>
          </div>
        </div>
      ) : (
        <svg
          ref={svgRef}
          className="h-full w-full cursor-grab pt-14 active:cursor-grabbing"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
        >
          <defs>
            <marker
              id="relationship-arrow"
              markerHeight="10"
              markerWidth="10"
              orient="auto"
              refX="9"
              refY="3"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#64748b" />
            </marker>
            <marker
              id="relationship-arrow-active"
              markerHeight="10"
              markerWidth="10"
              orient="auto"
              refX="9"
              refY="3"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#60a5fa" />
            </marker>
          </defs>

          <rect
            width={canvasSize.width}
            height={canvasSize.height}
            fill="transparent"
            onPointerDown={startPan}
          />

          <g
            transform={`translate(${canvasSize.width / 2 + view.x} ${canvasSize.height / 2 + view.y
              }) scale(${view.scale})`}
          >
            {relationships.map((relationship, index) => {
              const source = nodeById.get(relationship.sourceId);
              const target = nodeById.get(relationship.targetId);

              if (!source || !target) {
                return null;
              }

              const dx = target.x - source.x;
              const dy = target.y - source.y;
              const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
              const unitX = dx / distance;
              const unitY = dy / distance;
              const normalX = -unitY;
              const normalY = unitX;
              const labelOffset = relationshipLabelOffsets[relationship.id] ?? {
                x: 0,
                y: 0,
              };
              const curveOffset = ((index % 3) - 1) * 16 + labelOffset.x;
              const startX = source.x + unitX * NODE_RADIUS;
              const startY = source.y + unitY * NODE_RADIUS;
              const endX = target.x - unitX * (NODE_RADIUS + 8);
              const endY = target.y - unitY * (NODE_RADIUS + 8);
              const controlX =
                (startX + endX) / 2 +
                normalX * curveOffset +
                labelOffset.y * unitX;
              const controlY =
                (startY + endY) / 2 +
                normalY * curveOffset +
                labelOffset.y * unitY;
              const labelX = controlX + normalX * EDGE_LABEL_OFFSET;
              const labelY = controlY + normalY * EDGE_LABEL_OFFSET - 8;
              const isActive =
                selectedRelationshipId === relationship.id ||
                hoveredRelationshipId === relationship.id;
              const path = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;

              return (
                <g
                  key={relationship.id}
                  className="cursor-move"
                  onPointerDown={(event) =>
                    startRelationshipDrag(event, relationship.id)
                  }
                  onClick={(event) => handleEdgeClick(event, relationship.id)}
                  onMouseEnter={() => setHoveredRelationshipId(relationship.id)}
                  onMouseLeave={() => setHoveredRelationshipId(undefined)}
                >
                  <path
                    d={path}
                    fill="none"
                    stroke={isActive ? '#60a5fa' : '#64748b'}
                    strokeOpacity={isActive ? 0.95 : 0.62}
                    strokeWidth={isActive ? 3 : 1.7}
                    markerEnd={`url(#${isActive
                        ? 'relationship-arrow-active'
                        : 'relationship-arrow'
                      })`}
                  />
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    className="select-none fill-slate-200 text-[11px] font-medium"
                    paintOrder="stroke"
                    stroke="#020617"
                    strokeWidth="4"
                  >
                    {relationship.label}
                  </text>
                </g>
              );
            })}

            {sortedNodes.map((node) => {
              const color = getNodeColor(node.person.id);
              const isSelected = selectedPersonId === node.person.id;
              const isHovered = hoveredNodeId === node.person.id;
              const activeScale = isSelected ? 1.08 : 1;

              return (
                <g
                  key={node.person.id}
                  className="cursor-move outline-none"
                  transform={`translate(${node.x} ${node.y}) scale(${activeScale})`}
                  tabIndex={0}
                  onPointerDown={(event) => startNodeDrag(event, node)}
                  onClick={() => handleNodeClick(node.person)}
                  onMouseEnter={() => setHoveredNodeId(node.person.id)}
                  onMouseLeave={() => setHoveredNodeId(undefined)}
                >
                  {(isSelected || isHovered) && (
                    <rect
                      x="-54"
                      y="-48"
                      width="108"
                      height="116"
                      rx="18"
                      fill={isSelected ? '#172554' : '#0f172a'}
                      opacity="0.86"
                      stroke={isSelected ? '#60a5fa' : '#475569'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                  )}

                  <circle r={NODE_RADIUS + 5} fill="#020617" opacity="0.95" />
                  <circle r={NODE_RADIUS} fill={color} />

                  {node.person.profilePicture ? (
                    <>
                      <clipPath id={`avatar-clip-${node.person.id}`}>
                        <circle r={NODE_RADIUS - 4} />
                      </clipPath>
                      <image
                        href={node.person.profilePicture}
                        x={-(NODE_RADIUS - 4)}
                        y={-(NODE_RADIUS - 4)}
                        width={(NODE_RADIUS - 4) * 2}
                        height={(NODE_RADIUS - 4) * 2}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#avatar-clip-${node.person.id})`}
                      />
                    </>
                  ) : (
                    <text
                      y="7"
                      textAnchor="middle"
                      className="select-none fill-white text-[17px] font-semibold"
                    >
                      {getInitials(node.person.fullName)}
                    </text>
                  )}

                  <text
                    y="58"
                    textAnchor="middle"
                    className="select-none fill-slate-100 text-[12px] font-medium"
                    paintOrder="stroke"
                    stroke="#020617"
                    strokeWidth="4"
                  >
                    {node.person.fullName.length > 18
                      ? `${node.person.fullName.slice(0, 17)}...`
                      : node.person.fullName}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      )}
    </main>
  );
}
