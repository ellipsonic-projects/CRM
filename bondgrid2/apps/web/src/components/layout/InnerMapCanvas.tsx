'use client';

import { useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Person } from '../../services/people.api';
import { getCoordinates, Coordinate } from '../../utils/coordinates';

// Import Leaflet CSS directly
import 'leaflet/dist/leaflet.css';

interface InnerMapCanvasProps {
  people: Person[];
  selectedPersonId?: string;
  loading?: boolean;
  error?: string;
  onSelectPerson: (personId: string) => void;
  onRetry?: () => void;
}

// Custom dark/blue map marker icon matching BondGrid's premium aesthetic
const createMarkerIcon = (isSelected: boolean) => {
  const baseColor = isSelected ? 'bg-emerald-500' : 'bg-blue-500';
  const ringColor = isSelected ? 'bg-emerald-500/50' : 'bg-blue-500/50';
  const shadowColor = isSelected ? 'shadow-emerald-500/50' : 'shadow-blue-500/50';

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-5 h-5">
        <div class="absolute w-5 h-5 ${ringColor} rounded-full animate-ping opacity-75"></div>
        <div class="relative w-3.5 h-3.5 ${baseColor} border-2 border-slate-900 rounded-full shadow-lg ${shadowColor}"></div>
      </div>
    `,
    className: 'custom-div-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Custom cluster icon matching BondGrid's dark UI theme
const createClusterIcon = (count: number) => {
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600/90 border border-blue-400 text-white font-bold text-xs shadow-lg shadow-blue-500/40 hover:scale-105 hover:bg-blue-500 transition-all duration-200 cursor-pointer">
        <span>${count}</span>
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
};

// Custom helper component to handle zoom/move events
function MapStateTracker({ onChangeZoom }: { onChangeZoom: (zoom: number) => void }) {
  useMapEvents({
    zoomend: (e) => {
      onChangeZoom(e.target.getZoom());
    },
  });
  return null;
}

// Individual Cluster component to handle zoom-on-click and multi-person popover
function ClusterMarker({
  center,
  count,
  peopleList,
  onSelectPerson,
}: {
  center: [number, number];
  count: number;
  peopleList: Person[];
  onSelectPerson: (personId: string) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  // Find unique locations in the cluster
  const locationsSet = new Set<string>();
  peopleList.forEach((person) => {
    const loc = person.city?.trim() || person.state.trim();
    if (loc) locationsSet.add(loc);
  });
  const uniqueLocations = Array.from(locationsSet);
  const isSingleLocation = uniqueLocations.length === 1;
  const locationLabel = isSingleLocation ? uniqueLocations[0] : 'Multiple locations';

  // Calculate detailed city breakdown for multi-location clusters
  const locationBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    peopleList.forEach((person) => {
      const loc = person.city?.trim() || person.state.trim();
      if (loc) {
        counts[loc] = (counts[loc] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 3);
  }, [peopleList]);

  return (
    <Marker
      ref={markerRef}
      position={center}
      icon={createClusterIcon(count)}
      eventHandlers={{
        mouseover: () => {
          markerRef.current?.openPopup();
        },
      }}
    >
      <Popup
        closeButton={false}
        className="custom-map-popup"
        autoPan={false}
      >
        <div
          className="bg-[#1E293B] border border-[#2D3748] text-white p-3 rounded-lg shadow-xl text-xs w-[245px] pointer-events-auto select-none"
          onMouseLeave={() => {
            markerRef.current?.closePopup();
          }}
        >
          <div className="font-bold text-slate-100 text-sm truncate mb-0.5">
            {locationLabel}
          </div>
          <div className="text-slate-400 text-[10px] mb-2 font-medium">
            {count} {count === 1 ? 'person' : 'people'}
          </div>

          {/* Show a breakdown of the top 3 locations if there are multiple */}
          {!isSingleLocation && (
            <div className="text-[10px] text-slate-400 mb-2.5 bg-slate-900/50 p-1.5 rounded-lg border border-slate-700/30 space-y-0.5">
              {locationBreakdown.map(([loc, cnt]) => (
                <div key={loc} className="flex justify-between items-center">
                  <span className="truncate pr-2">{loc}</span>
                  <span className="font-semibold text-slate-300">{cnt}</span>
                </div>
              ))}
              {uniqueLocations.length > 3 && (
                <div className="text-[9px] text-slate-500 text-center italic pt-0.5 border-t border-slate-800">
                  + {uniqueLocations.length - 3} more locations
                </div>
              )}
            </div>
          )}

          {/* Scrollable list of people */}
          <div className="max-h-[160px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
            {peopleList.map((person) => (
              <div
                key={person.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectPerson(person.id);
                }}
                className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/80 cursor-pointer border border-slate-700/50 transition-colors"
              >
                <div className="font-semibold text-slate-200 text-[11px] truncate">
                  {person.fullName}
                </div>
                {person.occupation && (
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {person.occupation}
                  </div>
                )}
                <div className="text-[9px] text-blue-400 truncate mt-0.5">
                  {person.city ? `${person.city}, ` : ''}{person.state}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function InnerMapCanvas({
  people,
  selectedPersonId,
  loading,
  error,
  onSelectPerson,
  onRetry,
}: InnerMapCanvasProps) {
  const [zoom, setZoom] = useState(5);

  // Map people to their coordinates
  const mappedPeople = useMemo(() => {
    return people
      .map((person) => {
        const coords = getCoordinates(person.city, person.state);
        return {
          person,
          coords,
        };
      })
      .filter((item): item is { person: Person; coords: Coordinate } => item.coords !== null);
  }, [people]);

  // Center calculation: average of all mapped people or a default coordinate (Bengaluru, India)
  const mapCenter = useMemo((): [number, number] => {
    if (mappedPeople.length === 0) {
      return [12.9716, 77.5946]; // Default to Bengaluru
    }
    const sumLat = mappedPeople.reduce((sum, item) => sum + item.coords.lat, 0);
    const sumLng = mappedPeople.reduce((sum, item) => sum + item.coords.lng, 0);
    return [sumLat / mappedPeople.length, sumLng / mappedPeople.length];
  }, [mappedPeople]);

  // Define grid sizes based on the zoom level to group coordinates
  const getGridSize = (z: number): number => {
    if (z >= 14) return 0.002;
    if (z >= 12) return 0.01;
    if (z >= 10) return 0.04;
    if (z >= 8)  return 0.18;
    if (z >= 6)  return 0.65;
    if (z >= 4)  return 2.5;
    return 6.0;
  };

  // Group coordinates into grid cells for clustering
  const clusters = useMemo(() => {
    const gridSize = getGridSize(zoom);
    const groups: Record<string, typeof mappedPeople> = {};

    mappedPeople.forEach((item) => {
      const cellX = Math.round(item.coords.lng / gridSize);
      const cellY = Math.round(item.coords.lat / gridSize);
      const key = `${cellX}_${cellY}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return Object.values(groups);
  }, [mappedPeople, zoom]);

  // Handle loading and error states
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B1220] border border-[#1E293B] rounded-xl h-full min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400">Loading community map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B1220] border border-[#1E293B] rounded-xl h-full min-h-[400px] p-6 text-center">
        <p className="text-red-400 font-medium mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Retry Loading
          </button>
        )}
      </div>
    );
  }

  // Handle empty states
  if (people.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B1220] border border-[#1E293B] rounded-xl h-full min-h-[400px] text-center">
        <p className="text-slate-400 font-medium">No people match the current filters.</p>
        <p className="text-slate-500 text-sm mt-1">Try clearing filters or adding community members.</p>
      </div>
    );
  }

  if (mappedPeople.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#0B1220] border border-[#1E293B] rounded-xl h-full min-h-[400px] text-center">
        <p className="text-slate-400 font-medium">No mapped locations available.</p>
        <p className="text-slate-500 text-sm mt-1">
          None of the visible people have a mapped city/state combination.
        </p>
      </div>
    );
  }

  const unmappedCount = people.length - mappedPeople.length;

  return (
    <div className="flex-1 h-full min-h-[400px] rounded-xl overflow-hidden border border-[#1E293B] relative bg-[#0B1220]">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        className="w-full h-full"
        style={{ background: '#0B1220' }}
      >
        <MapStateTracker onChangeZoom={setZoom} />

        {/* Dark-matter premium styling tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {clusters.map((group, idx) => {
          // If there is only one person in the grid cell, render an individual marker
          if (group.length === 1) {
            const { person, coords } = group[0];
            const isSelected = person.id === selectedPersonId;

            return (
              <Marker
                key={person.id}
                position={[coords.lat, coords.lng]}
                icon={createMarkerIcon(isSelected)}
                eventHandlers={{
                  click: () => onSelectPerson(person.id),
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -10]}
                  opacity={0.95}
                  className="custom-map-tooltip"
                >
                  <div className="bg-[#1E293B] border border-[#2D3748] text-white p-2 rounded-lg shadow-xl text-xs max-w-[200px]">
                    <div className="font-bold text-slate-100 text-sm truncate">
                      {person.fullName}
                    </div>
                    {person.occupation && (
                      <div className="text-slate-400 font-medium truncate mt-0.5">
                        {person.occupation}
                      </div>
                    )}
                    <div className="text-blue-400 mt-1 font-semibold truncate">
                      {person.city ? `${person.city}, ` : ''}
                      {person.state}
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            );
          }

          // If there are multiple people in the cell, render a cluster marker
          const sumLat = group.reduce((sum, item) => sum + item.coords.lat, 0);
          const sumLng = group.reduce((sum, item) => sum + item.coords.lng, 0);
          const clusterCenter: [number, number] = [sumLat / group.length, sumLng / group.length];

          return (
            <ClusterMarker
              key={`cluster-${idx}`}
              center={clusterCenter}
              count={group.length}
              peopleList={group.map((item) => item.person)}
              onSelectPerson={onSelectPerson}
            />
          );
        })}
      </MapContainer>

      {/* Subtle indicator showing if some people could not be mapped */}
      {unmappedCount > 0 && (
        <div className="absolute bottom-4 left-4 z-[400] bg-slate-950/90 border border-slate-800 px-3 py-1.5 rounded-xl text-[11px] text-slate-400 shadow-lg backdrop-blur-sm select-none pointer-events-none">
          {unmappedCount} {unmappedCount === 1 ? 'person' : 'people'} not mapped (missing coordinates)
        </div>
      )}

      {/* Styled custom leaflet styles override inside the component */}
      <style jsx global>{`
        .leaflet-container {
          font-family: inherit;
        }
        .leaflet-bar {
          border: 1px solid #1E293B !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1) !important;
        }
        .leaflet-bar a {
          background-color: #1E293B !important;
          color: #E2E8F0 !important;
          border-bottom: 1px solid #2D3748 !important;
        }
        .leaflet-bar a:hover {
          background-color: #2D3748 !important;
          color: #FFFFFF !important;
        }
        .leaflet-bar a.leaflet-disabled {
          background-color: #0B1220 !important;
          color: #475569 !important;
        }
        .custom-map-tooltip.leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .custom-map-tooltip.leaflet-tooltip-top:before {
          border-top-color: #1E293B !important;
        }

        /* Leaflet Popover Dark overrides */
        .custom-map-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .custom-map-popup .leaflet-popup-content {
          margin: 0 !important;
          padding: 0 !important;
        }
        .custom-map-popup .leaflet-popup-tip {
          background: #1E293B !important;
          border: 1px solid #2D3748 !important;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}
