export type TripStatus = 'idle' | 'en-route' | 'on-site' | 'completed' | 'delayed';
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'acknowledged' | 'resolved';

export interface RouteStop {
  id: number;
  address: string;
  eta: string;
  status: 'pending' | 'arrived' | 'completed' | 'skipped';
  notes?: string;
}

export interface TripInfo {
  tripId: string;
  driverName: string;
  vehicleId: string;
  status: TripStatus;
  startTime: Date;
  totalStops: number;
  completedStops: number;
  distanceKm: number;
  fuelLevel: number;
  speedKmh: number;
  engineTemp: number;
  stops: RouteStop[];
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  location: string;
  reportedAt: Date;
}

export interface DriverMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  actions?: { id: string; label: string; action: string }[];
}
