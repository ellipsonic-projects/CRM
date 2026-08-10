'use client';

import dynamic from 'next/dynamic';
import { Person } from '../../services/people.api';

interface MapCanvasProps {
  people: Person[];
  selectedPersonId?: string;
  loading?: boolean;
  error?: string;
  onSelectPerson: (personId: string) => void;
  onRetry?: () => void;
}

// Dynamically import the real map canvas client-side only
const InnerMapCanvas = dynamic(() => import('./InnerMapCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#0B1220] border border-[#1E293B] rounded-xl h-full min-h-[400px] text-center">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-slate-400">Loading map components...</p>
    </div>
  ),
});

export default function MapCanvas(props: MapCanvasProps) {
  return <InnerMapCanvas {...props} />;
}
