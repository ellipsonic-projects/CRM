'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  DatabaseZap,
  Fingerprint,
  GitBranch,
  LockKeyhole,
  Network,
  Orbit,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  PointerEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './page.module.css';

type NodeKind =
  | 'Person'
  | 'Organization'
  | 'Volunteer'
  | 'Event'
  | 'Admin'
  | 'Login'
  | 'Signup'
  | 'Relationship'
  | 'Community'
  | 'Family';

interface GraphNode {
  id: string;
  kind: NodeKind;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  phase: number;
}

interface GraphEdge {
  id: string;
  source: number;
  target: number;
  label: string;
  strength: number;
}

const nodeKinds: NodeKind[] = [
  'Person',
  'Organization',
  'Volunteer',
  'Event',
  'Admin',
  'Login',
  'Signup',
  'Relationship',
  'Community',
  'Family',
];

const trustedBy = [
  'CivicCloud',
  'Northstar Trust',
  'TempleOps',
  'Kindred Labs',
  'CommunityOS',
  'RelayWorks',
];

const features = [
  {
    title: 'Graph Relationships',
    icon: GitBranch,
    text: 'Map family, community, volunteer, and organizational relationships as living connected data.',
  },
  {
    title: 'People Management',
    icon: Users,
    text: 'Maintain clean profiles, contact details, locations, notes, avatars, and login access in one place.',
  },
  {
    title: 'Events',
    icon: CalendarDays,
    text: 'Plan meetings, community events, social programs, and operational milestones with structured records.',
  },
  {
    title: 'Import/Export',
    icon: DatabaseZap,
    text: 'Bring in CSV or XLSX data, validate it, and export clean operational records whenever needed.',
  },
  {
    title: 'Audit Logs',
    icon: Fingerprint,
    text: 'Track logins, edits, deletes, organization changes, role changes, and critical administrative activity.',
  },
  {
    title: 'Multi-tenant Organizations',
    icon: Building2,
    text: 'Keep each organization isolated, structured, and ready for scale across teams and regions.',
  },
  {
    title: 'RBAC',
    icon: LockKeyhole,
    text: 'Give admins, volunteers, and viewers the right level of access for their responsibilities.',
  },
];

const faqs = [
  {
    question: 'What makes BondGrid different from a spreadsheet?',
    answer:
      'BondGrid treats people, events, users, and relationships as connected data, so teams can understand context instead of chasing rows.',
  },
  {
    question: 'Can teams import existing people records?',
    answer:
      'Yes. BondGrid supports CSV and XLSX people imports with validation previews before records are created.',
  },
  {
    question: 'Is the graph just visual?',
    answer:
      'No. The graph reflects structured relationship records that can power filtering, discovery, audit trails, and operational workflows.',
  },
  {
    question: 'Does BondGrid support roles?',
    answer:
      'Yes. Admin, volunteer, and viewer roles are built into the application and managed from settings.',
  },
];

function seededRandom(seed: number): number {
  let value = seed + 0x6d2b79f5;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

function svgNumber(value: number): string {
  return value.toFixed(3);
}

function createGraph() {
  const nodes: GraphNode[] = Array.from({ length: 72 }, (_, index) => {
    const ring = index % 4;
    const angle = (index / 72) * Math.PI * 2 + ring * 0.38;
    const distance = 90 + ring * 42 + seededRandom(index + 7) * 42;

    return {
      id: `node-${index}`,
      kind: nodeKinds[index % nodeKinds.length],
      label: `${nodeKinds[index % nodeKinds.length]} ${index + 1}`,
      x: 400 + Math.cos(angle) * distance + (seededRandom(index) - 0.5) * 28,
      y:
        280 +
        Math.sin(angle) * distance * 0.78 +
        (seededRandom(index + 3) - 0.5) * 32,
      vx: 0,
      vy: 0,
      radius: 4.5 + seededRandom(index + 11) * 4.5,
      phase: seededRandom(index + 19) * Math.PI * 2,
    };
  });

  const edges: GraphEdge[] = [];

  nodes.forEach((_, index) => {
    const targets = [
      (index + 1 + Math.floor(seededRandom(index + 31) * 5)) % nodes.length,
      (index + 9 + Math.floor(seededRandom(index + 41) * 8)) % nodes.length,
    ];

    targets.forEach((target, targetIndex) => {
      if (target !== index) {
        edges.push({
          id: `edge-${index}-${target}`,
          source: index,
          target,
          label:
            targetIndex === 0
              ? `${nodes[index].kind} connected to ${nodes[target].kind}`
              : `${nodes[index].kind} influences ${nodes[target].kind}`,
          strength: 0.002 + seededRandom(index + target) * 0.002,
        });
      }
    });
  });

  return { nodes, edges };
}

function useReveal() {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function Reveal({
  children,
  className = '',
  delay = 0,
  id,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  const { ref, visible } = useReveal();

  return (
    <section
      id={id}
      ref={ref}
      className={`${styles.reveal} ${visible ? styles.revealVisible : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

function CountUp({ value, suffix = '' }: { value: number; suffix?: string }) {
  const { ref, visible } = useReveal();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let frame = 0;
    const totalFrames = 72;
    const tick = () => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
      setCount(Math.round(value * progress));

      if (frame < totalFrames) {
        window.requestAnimationFrame(tick);
      }
    };

    tick();
  }, [value, visible]);

  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

function RelationshipGraph({ compact = false }: { compact?: boolean }) {
  const graph = useMemo(createGraph, []);
  const nodesRef = useRef<GraphNode[]>(graph.nodes.map((node) => ({ ...node })));
  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggedNode = useRef<number | null>(null);
  const [tick, setTick] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<number | null>(null);
  const [highlightSeed, setHighlightSeed] = useState(0);

  useEffect(() => {
    let frameId = 0;
    let running = true;
    let frame = 0;
    const raf =
      window.requestAnimationFrame ??
      ((callback: FrameRequestCallback) => window.setTimeout(callback, 16));
    const caf =
      window.cancelAnimationFrame ??
      ((id: number) => window.clearTimeout(id));

    const animate = () => {
      if (!running) {
        return;
      }

      frame += 1;
      const nodes = nodesRef.current;

      for (let first = 0; first < nodes.length; first += 1) {
        for (let second = first + 1; second < nodes.length; second += 1) {
          const a = nodes[first];
          const b = nodes[second];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distanceSquared = Math.max(dx * dx + dy * dy, 80);
          const force = 34 / distanceSquared;
          const fx = dx * force;
          const fy = dy * force;

          a.vx += fx;
          a.vy += fy;
          b.vx -= fx;
          b.vy -= fy;
        }
      }

      graph.edges.forEach((edge) => {
        const source = nodes[edge.source];
        const target = nodes[edge.target];
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.max(Math.hypot(dx, dy), 1);
        const desired = compact ? 82 : 118;
        const force = (distance - desired) * edge.strength;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      });

      nodes.forEach((node, index) => {
        if (draggedNode.current === index) {
          node.vx = 0;
          node.vy = 0;
          return;
        }

        const centerX = compact ? 300 : 400;
        const centerY = compact ? 230 : 280;
        node.vx += (centerX - node.x) * 0.0009;
        node.vy += (centerY - node.y) * 0.0009;
        node.vx += Math.cos(frame * 0.014 + node.phase) * 0.002;
        node.vy += Math.sin(frame * 0.012 + node.phase) * 0.002;
        node.vx *= 0.88;
        node.vy *= 0.88;
        node.x += node.vx;
        node.y += node.vy;
      });

      if (frame % 180 === 0) {
        setHighlightSeed((current) => current + 1);
      }

      setTick(frame);
      frameId = raf(animate);
    };

    frameId = raf(animate);

    return () => {
      running = false;
      caf(frameId);
    };
  }, [compact, graph.edges]);

  const nodes = nodesRef.current;
  const highlightedEdges = new Set(
    Array.from({ length: 12 }, (_, index) =>
      (highlightSeed * 7 + index * 5) % graph.edges.length,
    ),
  );

  const getSvgPoint = (event: PointerEvent<SVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();

    if (!rect) {
      return { x: 0, y: 0 };
    }

    const width = compact ? 600 : 800;
    const height = compact ? 460 : 560;

    return {
      x: ((event.clientX - rect.left) / rect.width) * width,
      y: ((event.clientY - rect.top) / rect.height) * height,
    };
  };

  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (draggedNode.current === null) {
      return;
    }

    const point = getSvgPoint(event);
    const node = nodesRef.current[draggedNode.current];
    node.x = point.x;
    node.y = point.y;
  };

  return (
    <div className={styles.graphShell}>
      <div className={styles.graphChrome}>
        <span />
        <span />
        <span />
      </div>
      <svg
        ref={svgRef}
        className={styles.graph}
        viewBox={compact ? '0 0 600 460' : '0 0 800 560'}
        role="img"
        aria-label="Animated relationship graph showing BondGrid connected records"
        onPointerMove={handlePointerMove}
        onPointerUp={() => {
          draggedNode.current = null;
        }}
        onPointerLeave={() => {
          draggedNode.current = null;
        }}
      >
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="42%" stopColor="#67e8f9" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.22" />
          </radialGradient>
          <linearGradient id="edgeGradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.12" />
            <stop offset="50%" stopColor="#a7f3d0" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.16" />
          </linearGradient>
          <filter id="graphGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g opacity="0.34">
          {Array.from({ length: 14 }, (_, index) => (
            <circle
              key={`orbit-${index}`}
              cx={compact ? 300 : 400}
              cy={compact ? 230 : 280}
              r={svgNumber((compact ? 68 : 86) + index * (compact ? 13 : 17))}
              className={styles.orbit}
            />
          ))}
        </g>

        <g>
          {graph.edges.map((edge, index) => {
            const source = nodes[edge.source];
            const target = nodes[edge.target];
            const active =
              hoveredEdge === index ||
              hoveredNode === edge.source ||
              hoveredNode === edge.target ||
              highlightedEdges.has(index);
            const path = `M ${source.x.toFixed(2)} ${source.y.toFixed(
              2,
            )} C ${((source.x + target.x) / 2).toFixed(2)} ${(
              Math.min(source.y, target.y) - 28
            ).toFixed(2)}, ${((source.x + target.x) / 2).toFixed(2)} ${(
              Math.max(source.y, target.y) + 28
            ).toFixed(2)}, ${target.x.toFixed(2)} ${target.y.toFixed(2)}`;

            return (
              <g key={edge.id}>
                <path
                  d={path}
                  className={`${styles.edge} ${active ? styles.edgeActive : ''}`}
                  onPointerEnter={() => setHoveredEdge(index)}
                  onPointerLeave={() => setHoveredEdge(null)}
                />
                {(index + tick) % 7 === 0 ? (
                  <circle
                    r={svgNumber(active ? 3.4 : 2.4)}
                    className={styles.particle}
                  >
                    <animateMotion
                      dur={`${4 + (index % 5)}s`}
                      repeatCount="indefinite"
                      path={path}
                    />
                  </circle>
                ) : null}
              </g>
            );
          })}
        </g>

        <g>
          {nodes.map((node, index) => {
            const active = hoveredNode === index;
            const pulse =
              tick === 0 ? 0 : Math.sin(tick * 0.045 + node.phase) * 1.4;

            return (
              <g
                key={node.id}
                className={styles.nodeGroup}
                transform={`translate(${node.x.toFixed(2)} ${node.y.toFixed(
                  2,
                )})`}
                onPointerDown={(event) => {
                  draggedNode.current = index;
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerEnter={() => setHoveredNode(index)}
                onPointerLeave={() => setHoveredNode(null)}
              >
                <circle
                  r={svgNumber(node.radius + 8 + pulse)}
                  className={styles.nodeHalo}
                />
                <circle
                  r={svgNumber(node.radius + (active ? 3.5 : 0))}
                  className={styles.node}
                  filter="url(#graphGlow)"
                />
                {active ? (
                  <g className={styles.nodeTooltip}>
                    <rect x="12" y="-28" width="142" height="34" rx="10" />
                    <text x="24" y="-7">
                      {node.kind} relationship
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
      <div className={styles.graphHud}>
        <span>Live force graph</span>
        <strong>72 nodes</strong>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <main className={styles.page}>
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}>
        <Link className={styles.brand} href="/">
          <span className={styles.logoMark}>
            <Orbit size={18} />
          </span>
          BondGrid
        </Link>
        <div className={styles.navLinks}>
          <a href="#why">Why</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>
        <div className={styles.navActions}>
          <Link href="/login">Login</Link>
          <Link className={styles.navCta} href="/admin-signup">
            Get Started
          </Link>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.heroCopy}>
          <Link className={styles.heroLogo} href="/">
            <span className={styles.logoMark}>
              <Orbit size={20} />
            </span>
            BondGrid
          </Link>
          <div className={styles.eyebrow}>
            <Sparkles size={16} />
            Relationship intelligence for modern organizations
          </div>
          <h1>See every person, event, role, and relationship as one living grid.</h1>
          <p>
            BondGrid is a premium relationship operating system for communities,
            trusts, NGOs, associations, and multi-tenant teams that need clarity
            at scale.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.primaryButton} href="/admin-signup">
              Get Started
              <ArrowRight size={18} />
            </Link>
            <a className={styles.secondaryButton} href="mailto:demo@bondgrid.app">
              Book Demo
            </a>
          </div>
          <div className={styles.heroStats}>
            <span>
              <strong>100%</strong>
              audit-ready
            </span>
            <span>
              <strong>10</strong>
              entity types
            </span>
            <span>
              <strong>24/7</strong>
              org memory
            </span>
          </div>
        </div>

        <div className={styles.heroGraph}>
          <RelationshipGraph />
        </div>
      </section>

      <Reveal className={styles.trusted}>
        <p>Trusted by teams building durable community infrastructure</p>
        <div className={styles.logoRail}>
          {trustedBy.map((company, index) => (
            <span key={company} style={{ animationDelay: `${index * 90}ms` }}>
              {company}
            </span>
          ))}
        </div>
      </Reveal>

      <Reveal className={styles.why} delay={80}>
        <div className={styles.sectionIntro} id="why">
          <span>Why BondGrid</span>
          <h2>Relationships are the database your organization already runs on.</h2>
          <p>
            BondGrid turns scattered people records, event history, permissions,
            imports, and institutional knowledge into a connected operating
            layer your team can trust.
          </p>
        </div>
        <div className={styles.whyGrid}>
          {[
            ['Context first', 'Understand who is connected, why they matter, and what changed last.'],
            ['Operationally precise', 'Built for daily admin workflows, not a decorative graph demo.'],
            ['Governed by design', 'Roles, audit trails, and organization boundaries are part of the core.'],
          ].map(([title, text], index) => (
            <article key={title} className={styles.glassCard}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal className={styles.showcase}>
        <div className={styles.sectionIntro}>
          <span>Interactive Graph Showcase</span>
          <h2>A living map of your organization.</h2>
          <p>
            Drag nodes, hover relationships, watch paths pulse, and see
            structured records reconnect smoothly in real time.
          </p>
        </div>
        <RelationshipGraph compact />
      </Reveal>

      <Reveal className={styles.features} id="features">
        <div className={styles.sectionIntro}>
          <span>Features</span>
          <h2>Everything connected teams need to operate with confidence.</h2>
        </div>
        <div className={styles.featureGrid}>
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className={styles.featureCard}
                style={{ transitionDelay: `${index * 45}ms` }}
              >
                <div className={styles.featureIcon}>
                  <Icon size={22} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            );
          })}
        </div>
      </Reveal>

      <Reveal className={styles.stats}>
        {[
          ['Nodes visualized', 7200, '+'],
          ['Faster lookup', 84, '%'],
          ['Audit events tracked', 120000, '+'],
          ['Tenant isolation', 100, '%'],
        ].map(([label, value, suffix]) => (
          <div key={label} className={styles.statCard}>
            <strong>
              <CountUp value={Number(value)} suffix={String(suffix)} />
            </strong>
            <span>{label}</span>
          </div>
        ))}
      </Reveal>

      <Reveal className={styles.testimonials}>
        <div className={styles.sectionIntro}>
          <span>Testimonials</span>
          <h2>Designed for teams who cannot afford fuzzy context.</h2>
        </div>
        <div className={styles.testimonialGrid}>
          {[
            [
              'BondGrid gave our operations team a shared memory. New volunteers understood the community map in minutes.',
              'Mira Shah',
              'Operations Director',
            ],
            [
              'The graph is not a gimmick. It changed how we prepare for events, outreach, and member support.',
              'Dev Anand',
              'Community Lead',
            ],
            [
              'Audit logs and roles made governance feel calm. Everyone knows who changed what and when.',
              'Isha Rao',
              'Trust Administrator',
            ],
          ].map(([quote, name, role]) => (
            <article key={name} className={styles.testimonial}>
              <p>“{quote}”</p>
              <div>
                <strong>{name}</strong>
                <span>{role}</span>
              </div>
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal className={styles.pricing} id="pricing">
        <div className={styles.sectionIntro}>
          <span>Pricing</span>
          <h2>Start focused. Scale when the graph grows.</h2>
        </div>
        <div className={styles.pricingGrid}>
          {[
            ['Starter', '₹0', 'For pilots and small communities', ['People graph', 'Events', 'CSV import']],
            ['Growth', '₹4,999', 'For active organizations', ['RBAC', 'Audit logs', 'Import/export', 'Priority support']],
            ['Enterprise', 'Custom', 'For multi-tenant operations', ['Dedicated onboarding', 'Advanced governance', 'Custom data workflows']],
          ].map(([name, price, text, items], index) => (
            <article
              key={String(name)}
              className={`${styles.priceCard} ${index === 1 ? styles.priceFeatured : ''}`}
            >
              <h3>{name}</h3>
              <strong>{price}</strong>
              <p>{text}</p>
              <ul>
                {(items as string[]).map((item) => (
                  <li key={item}>
                    <Check size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/admin-signup">
                Choose {name}
                <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </Reveal>

      <Reveal className={styles.faq} id="faq">
        <div className={styles.sectionIntro}>
          <span>FAQ</span>
          <h2>Questions before you map the grid.</h2>
        </div>
        <div className={styles.faqList}>
          {faqs.map((faq) => (
            <details key={faq.question} className={styles.faqItem}>
              <summary>
                {faq.question}
                <ChevronDown size={18} />
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </Reveal>

      <Reveal className={styles.finalCta}>
        <div>
          <span>Ready for relationship clarity?</span>
          <h2>Build the operating graph your organization deserves.</h2>
        </div>
        <Link className={styles.primaryButton} href="/admin-signup">
          Get Started
          <ArrowRight size={18} />
        </Link>
      </Reveal>

      <footer className={styles.footer}>
        <Link className={styles.brand} href="/">
          <span className={styles.logoMark}>
            <Network size={18} />
          </span>
          BondGrid
        </Link>
        <p>Community relationship platform for modern organizations.</p>
        <div>
          <Link href="/login">Login</Link>
          <Link href="/admin-signup">Admin Signup</Link>
          <a href="mailto:demo@bondgrid.app">Book Demo</a>
        </div>
      </footer>
    </main>
  );
}
