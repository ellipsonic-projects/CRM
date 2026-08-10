export interface Coordinate {
  lat: number;
  lng: number;
}

// Pre-defined coordinates for states and major cities in India
const INDIAN_STATES_COORDINATES: Record<string, Coordinate> = {
  andamanandnicobarislands: { lat: 11.7401, lng: 92.6586 },
  andhrapradesh: { lat: 15.9129, lng: 79.74 },
  arunachalpradesh: { lat: 28.218, lng: 94.7278 },
  assam: { lat: 26.2006, lng: 92.9376 },
  bihar: { lat: 25.0961, lng: 85.3131 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  chhattisgarh: { lat: 21.2787, lng: 81.8661 },
  dadraandnagarhavelianddamananddiu: { lat: 20.1809, lng: 73.0169 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  goa: { lat: 15.2993, lng: 74.124 },
  gujarat: { lat: 22.2587, lng: 71.1924 },
  haryana: { lat: 29.0588, lng: 76.0856 },
  himachalpradesh: { lat: 31.1048, lng: 77.1734 },
  jammuandkashmir: { lat: 33.7782, lng: 76.5762 },
  jharkhand: { lat: 23.6102, lng: 85.2799 },
  karnataka: { lat: 15.3173, lng: 75.7139 },
  kerala: { lat: 10.8505, lng: 76.2711 },
  ladakh: { lat: 34.1526, lng: 77.5771 },
  lakshadweep: { lat: 13.6189, lng: 72.1833 },
  madhyapradesh: { lat: 22.9734, lng: 78.6569 },
  maharashtra: { lat: 19.7515, lng: 75.7139 },
  manipur: { lat: 24.6637, lng: 93.9063 },
  meghalaya: { lat: 25.467, lng: 91.3662 },
  mizoram: { lat: 23.1645, lng: 92.9376 },
  nagaland: { lat: 26.1584, lng: 94.5624 },
  odisha: { lat: 20.9517, lng: 85.0985 },
  puducherry: { lat: 11.9416, lng: 79.8083 },
  punjab: { lat: 31.1471, lng: 75.3412 },
  rajasthan: { lat: 27.0238, lng: 74.2179 },
  sikkim: { lat: 27.533, lng: 88.5122 },
  tamilnadu: { lat: 11.1271, lng: 78.6569 },
  telangana: { lat: 18.1124, lng: 79.0193 },
  tripura: { lat: 23.9408, lng: 91.9882 },
  uttarpradesh: { lat: 26.8467, lng: 80.9462 },
  uttarakhand: { lat: 30.0668, lng: 79.0193 },
  westbengal: { lat: 22.9868, lng: 87.855 },
};

const CITY_ALIASES: Record<string, string> = {
  // Karnataka Aliases
  bangalore: 'bengaluru',
  mysore: 'mysuru',
  mangalore: 'mangaluru',
  shimoga: 'shivamogga',
  belgaum: 'belagavi',
  hubli: 'hubballi',
  tumkur: 'tumakuru',
  gulbarga: 'kalaburagi',
  bellary: 'ballari',
  bijapur: 'vijayapura',
  hospet: 'hosapete',
  chikmagalur: 'chikkamagaluru',

  // Other major city aliases
  bombay: 'mumbai',
  madras: 'chennai',
  calcutta: 'kolkata',
  trivandrum: 'thiruvananthapuram',
  cochin: 'kochi',
  pondicherry: 'puducherry',
  gauhati: 'guwahati',
  banaras: 'varanasi',
  baroda: 'vadodara',
  vizag: 'visakhapatnam',
};

const INDIAN_CITIES_COORDINATES: Record<string, Coordinate> = {
  // Karnataka Cities
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mysuru: { lat: 12.2958, lng: 76.6394 },
  mangaluru: { lat: 12.9141, lng: 74.856 },
  shivamogga: { lat: 13.9299, lng: 75.5681 },
  belagavi: { lat: 15.8497, lng: 74.4977 },
  hubballi: { lat: 15.3647, lng: 75.124 },
  dharwad: { lat: 15.4589, lng: 75.0078 },
  tumakuru: { lat: 13.3392, lng: 77.114 },
  kalaburagi: { lat: 17.3297, lng: 76.8343 },
  ballari: { lat: 15.1394, lng: 76.9214 },
  vijayapura: { lat: 16.8302, lng: 75.7100 },
  hosapete: { lat: 15.2689, lng: 76.3909 },
  chikkamagaluru: { lat: 13.3161, lng: 75.7720 },
  udupi: { lat: 13.3409, lng: 74.7421 },
  davangere: { lat: 14.4644, lng: 75.9218 },
  kolar: { lat: 13.1368, lng: 78.1292 },
  mandya: { lat: 12.5218, lng: 76.8951 },
  hassan: { lat: 13.0072, lng: 76.1026 },

  // Maharashtra Cities
  mumbai: { lat: 19.076, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  thane: { lat: 19.2183, lng: 72.9781 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  aurangabad: { lat: 19.8762, lng: 75.3433 },

  // Tamil Nadu Cities
  chennai: { lat: 13.0827, lng: 80.2707 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  madurai: { lat: 9.9252, lng: 78.1198 },
  trichy: { lat: 10.7905, lng: 78.7047 },
  salem: { lat: 11.6643, lng: 78.146 },

  // Telangana Cities
  hyderabad: { lat: 17.385, lng: 78.4867 },
  warangal: { lat: 17.9689, lng: 79.5941 },

  // Andhra Pradesh Cities
  visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  vijayawada: { lat: 16.5062, lng: 80.648 },
  guntur: { lat: 16.3067, lng: 80.4365 },

  // Delhi & NCR
  newdelhi: { lat: 28.6139, lng: 77.209 },
  noida: { lat: 28.5355, lng: 77.391 },
  gurugram: { lat: 28.4595, lng: 77.0266 },

  // West Bengal Cities
  kolkata: { lat: 22.5726, lng: 88.3639 },
  howrah: { lat: 22.5734, lng: 88.2636 },

  // Gujarat Cities
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  surat: { lat: 21.1702, lng: 72.8311 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  rajkot: { lat: 22.3039, lng: 70.8022 },

  // Other Major Cities
  kochi: { lat: 9.9312, lng: 76.2673 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  indore: { lat: 22.7196, lng: 75.8577 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  patna: { lat: 25.5941, lng: 85.1376 },
  guwahati: { lat: 26.1445, lng: 91.7362 },
  bhubaneswar: { lat: 20.304, lng: 85.8189 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
};

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Resolves coordinates for a given city and state.
 * Fallback order:
 * 1. Normalize city, resolve through alias if present, look up city coordinates.
 * 2. If not found, normalize state name and resolve through state coordinates.
 * 3. Return null if no coordinates can be mapped.
 */
export function getCoordinates(city?: string, state?: string): Coordinate | null {
  if (city) {
    let normalizedCity = normalizeName(city);
    // Resolve alias if mapped
    if (CITY_ALIASES[normalizedCity]) {
      normalizedCity = CITY_ALIASES[normalizedCity];
    }
    if (INDIAN_CITIES_COORDINATES[normalizedCity]) {
      return INDIAN_CITIES_COORDINATES[normalizedCity];
    }
  }

  if (state) {
    const normalizedState = normalizeName(state);
    if (INDIAN_STATES_COORDINATES[normalizedState]) {
      return INDIAN_STATES_COORDINATES[normalizedState];
    }
  }

  return null;
}
